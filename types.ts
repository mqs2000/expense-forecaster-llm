export interface ExpenseRecord {
  date: string;
  category: string;
  amount: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalExpenses: number;
  totalIncome: number;
  cashFlow: number;
  categoryBreakdown: Record<string, number>;
}

export interface CategoryChange {
  category: string;
  previousAmount: number;
  currentAmount: number;
  percentageChange: number;
}

export interface ForecastResult {
  predictedNextMonthExpenses: number;
  predictedNextMonthCashFlow: number;
  recentMonthsStats: MonthlyStats[];
  significantChanges: CategoryChange[];
  lastMonthStats: MonthlyStats | null;
}

export enum LoadState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}