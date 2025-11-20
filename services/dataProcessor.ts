import { ExpenseRecord, MonthlyStats, ForecastResult, CategoryChange } from '../types';

export const parseCSV = (csvText: string): ExpenseRecord[] => {
  const lines = csvText.trim().split('\n');
  const records: ExpenseRecord[] = [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const dateIdx = headers.indexOf('date');
  const categoryIdx = headers.indexOf('category');
  const amountIdx = headers.indexOf('amount');

  if (dateIdx === -1 || categoryIdx === -1 || amountIdx === -1) {
    throw new Error("CSV format invalid. Required columns: date, category, amount");
  }

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((c) => c.trim());
    if (row.length < 3) continue;

    const amount = parseFloat(row[amountIdx]);
    if (!isNaN(amount)) {
      records.push({
        date: row[dateIdx],
        category: row[categoryIdx],
        amount: amount,
      });
    }
  }
  return records;
};

export const analyzeData = (records: ExpenseRecord[]): ForecastResult => {
  // 1. Group by Month
  const statsByMonth: Record<string, MonthlyStats> = {};

  records.forEach((record) => {
    const dateObj = new Date(record.date);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

    if (!statsByMonth[monthKey]) {
      statsByMonth[monthKey] = {
        month: monthKey,
        totalExpenses: 0,
        totalIncome: 0,
        cashFlow: 0,
        categoryBreakdown: {},
      };
    }

    const isIncome = record.category.toLowerCase() === 'income';
    const amount = record.amount;

    if (isIncome) {
      statsByMonth[monthKey].totalIncome += amount;
    } else {
      statsByMonth[monthKey].totalExpenses += amount;
      statsByMonth[monthKey].categoryBreakdown[record.category] = 
        (statsByMonth[monthKey].categoryBreakdown[record.category] || 0) + amount;
    }
  });

  // Calculate Cash Flow
  Object.values(statsByMonth).forEach((stat) => {
    stat.cashFlow = stat.totalIncome - stat.totalExpenses;
  });

  // Sort months
  const sortedMonths = Object.values(statsByMonth).sort((a, b) => a.month.localeCompare(b.month));

  if (sortedMonths.length === 0) {
    throw new Error("No data found to analyze.");
  }

  // 2. Forecast Logic
  // Use last 3 months for average
  const last3Months = sortedMonths.slice(-3);
  
  const avgExpenses =
    last3Months.reduce((sum, m) => sum + m.totalExpenses, 0) / last3Months.length;
  
  // Simple forecast: Avg expenses, assume last month's income
  const lastMonth = sortedMonths[sortedMonths.length - 1];
  const predictedIncome = lastMonth.totalIncome; 
  const predictedNextMonthExpenses = avgExpenses;
  const predictedNextMonthCashFlow = predictedIncome - predictedNextMonthExpenses;

  // 3. Calculate Category Changes (Month over Month)
  const significantChanges: CategoryChange[] = [];
  if (sortedMonths.length >= 2) {
    const current = sortedMonths[sortedMonths.length - 1];
    const previous = sortedMonths[sortedMonths.length - 2];

    Object.keys(current.categoryBreakdown).forEach((cat) => {
      const currVal = current.categoryBreakdown[cat];
      const prevVal = previous.categoryBreakdown[cat] || 0;
      
      // Avoid division by zero
      let pctChange = 0;
      if (prevVal === 0) {
        pctChange = currVal > 0 ? 100 : 0;
      } else {
        pctChange = ((currVal - prevVal) / prevVal) * 100;
      }

      significantChanges.push({
        category: cat,
        previousAmount: prevVal,
        currentAmount: currVal,
        percentageChange: pctChange,
      });
    });
  }

  // Sort changes by absolute magnitude of percentage to find "biggest" changes
  significantChanges.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));

  return {
    predictedNextMonthExpenses,
    predictedNextMonthCashFlow,
    recentMonthsStats: sortedMonths,
    significantChanges: significantChanges.slice(0, 3), // Top 3
    lastMonthStats: lastMonth,
  };
};
