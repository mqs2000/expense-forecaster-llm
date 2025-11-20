import React, { useState, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { ExpenseCharts } from './components/ExpenseCharts';
import { parseCSV, analyzeData } from './services/dataProcessor';
import { generateExplanation } from './services/geminiService';
import { SAMPLE_CSV_DATA } from './constants';
import { ForecastResult, LoadState } from './types';

function App() {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [status, setStatus] = useState<LoadState>(LoadState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const processData = async (csvContent: string) => {
    try {
      setStatus(LoadState.LOADING);
      setErrorMsg(null);
      setExplanation('');

      const records = parseCSV(csvContent);
      if (records.length === 0) {
        throw new Error("No valid rows found in CSV.");
      }

      const result = analyzeData(records);
      setForecast(result);
      setStatus(LoadState.SUCCESS);

      // Trigger AI Explanation automatically after processing
      setIsGeneratingAI(true);
      const aiText = await generateExplanation(result);
      setExplanation(aiText);
    } catch (err: any) {
      console.error(err);
      setStatus(LoadState.ERROR);
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Load sample data by default on mount
  useEffect(() => {
    processData(SAMPLE_CSV_DATA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-900 mb-2">
            ExpenseForecaster <span className="text-indigo-500">AI</span>
          </h1>
          <p className="text-slate-600 max-w-2xl">
            Upload your transaction history to forecast next month's expenses and get AI-powered insights into your spending habits.
          </p>
        </header>

        {/* Controls */}
        <FileUploader 
          onFileLoaded={(content) => processData(content)} 
          onLoadSample={() => processData(SAMPLE_CSV_DATA)} 
        />

        {/* Error Message */}
        {status === LoadState.ERROR && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
            <p className="font-bold">Error</p>
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Main Content */}
        {status === LoadState.SUCCESS && forecast && (
          <div className="space-y-6">
            
            {/* Forecast Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Predicted Next Month Expenses</h2>
                <p className="text-4xl font-bold text-slate-900">
                  ${forecast.predictedNextMonthExpenses.toFixed(2)}
                </p>
                <p className="text-xs text-slate-400 mt-2">Based on 3-month average</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Predicted Net Cash Flow</h2>
                <p className={`text-4xl font-bold ${forecast.predictedNextMonthCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${forecast.predictedNextMonthCashFlow.toFixed(2)}
                </p>
                <p className="text-xs text-slate-400 mt-2">Estimated Income - Predicted Expenses</p>
              </div>
            </div>

            {/* Charts */}
            <ExpenseCharts data={forecast.recentMonthsStats} />

            {/* AI & Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Top Changes List */}
              <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Biggest Changes</h3>
                <div className="space-y-4">
                  {forecast.significantChanges.length > 0 ? (
                    forecast.significantChanges.map((change, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-700">{change.category}</p>
                          <p className="text-xs text-slate-500">was ${change.previousAmount.toFixed(0)}</p>
                        </div>
                        <div className={`text-right font-bold ${change.percentageChange > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {change.percentageChange > 0 ? '+' : ''}{change.percentageChange.toFixed(1)}%
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic">No significant changes detected vs last month.</p>
                  )}
                </div>
              </div>

              {/* Gemini Insight Box */}
              <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-6 rounded-xl shadow-lg flex flex-col justify-center">
                <div className="flex items-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-xl font-bold">AI Financial Insight</h3>
                </div>
                
                {isGeneratingAI ? (
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-2 bg-indigo-400 rounded"></div>
                      <div className="h-2 bg-indigo-400 rounded"></div>
                      <div className="h-2 bg-indigo-400 rounded w-5/6"></div>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-indigo-50 text-lg leading-relaxed">
                      {explanation || "AI explanation unavailable."}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
