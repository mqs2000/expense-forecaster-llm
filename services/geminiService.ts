import { GoogleGenAI } from "@google/genai";
import { ForecastResult } from '../types';

// Initialize Gemini Client
// IMPORTANT: Using 'gemini-2.5-flash' as it is lightweight and fast, suitable for this task.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateExplanation = async (forecast: ForecastResult): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure process.env.API_KEY to see AI explanations.";
  }

  const lastMonth = forecast.lastMonthStats;
  if (!lastMonth) return "Not enough data to generate an explanation.";

  const changesDescription = forecast.significantChanges
    .map(c => `${c.category}: ${c.percentageChange > 0 ? '+' : ''}${c.percentageChange.toFixed(1)}% (from $${c.previousAmount} to $${c.currentAmount})`)
    .join(', ');

  const prompt = `
    You are a helpful financial assistant suitable for a personal finance dashboard.
    Analyze the following monthly expense data:

    - Last Month (${lastMonth.month}) Total Expenses: $${lastMonth.totalExpenses.toFixed(2)}
    - Last Month Cash Flow: $${lastMonth.cashFlow.toFixed(2)}
    - Prediction for Next Month Expenses: $${forecast.predictedNextMonthExpenses.toFixed(2)}
    - Prediction for Next Month Cash Flow: $${forecast.predictedNextMonthCashFlow.toFixed(2)}
    - Significant Category Changes vs Previous Month: ${changesDescription}

    Task:
    1. Summarize the user's spending trend briefly.
    2. Explain *why* the forecast might look the way it does based on the data provided (e.g., mentioning the increase/decrease in specific categories).
    3. Give one specific, actionable tip to improve their cash flow next month.
    
    Tone: Friendly, encouraging, and concise (max 3-4 sentences). Avoid complex jargon.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate explanation.";
  } catch (error) {
    console.error("Error generating explanation:", error);
    return "Sorry, I couldn't generate a financial insight at this moment due to a connection error.";
  }
};
