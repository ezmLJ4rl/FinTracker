export interface Transaction {
  id: string;
  userId: string;
  profileId: string;
  name: string; // Merchant / Payee
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense' | 'bnpl';
  paymentMethod?: string;
  isFixedCost?: boolean;
  notes?: string;
  receiptId?: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  name: string;
  description?: string;
  avatarColor: string;
  currency: string;
  monthlyBudget: number;
  createdAt: string;
}

export interface Receipt {
  id: string;
  userId: string;
  name: string;
  type: string;
  dataUrl: string;
  ocrExtractedData?: {
    merchant?: string;
    total?: number;
    date?: string;
    category?: string;
    items?: Array<{ name: string; price: number }>;
    confidence?: number;
  };
  createdAt: string;
}

export interface OCRResult {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  confidence: number;
  items?: Array<{ name: string; price: number }>;
  notes?: string;
}

export interface OCRReceiptResult {
  merchant: string;
  total: number;
  date: string;
  category: string;
  confidence: number;
  items: Array<{ name: string; price: number }>;
  notes: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'bnpl';
  budgetLimit?: number;
  isFixed?: boolean;
}

export interface PragmaticInsight {
  id: string;
  timestamp: string;
  role: 'user' | 'assistant';
  content: string;
  structured?: {
    observation: string;
    comparison: string;
    riskAnalysis: string;
    actionableStep: string;
  };
}

export interface EfficiencyScore {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  title: string;
  savingsRate: number;
  budgetUtilizationPct: number;
  fixedCostPct: number;
  variableCostPct: number;
  bnplBurdenPct: number;
  projectedRunwayDays: number;
  breakdown: {
    budgetDiscipline: number; // max 30
    savingsHealth: number;    // max 30
    debtAndBnplRisk: number;  // max 20
    cashFlowStability: number;// max 20
  };
  keyRecommendations: string[];
}

export interface UserSettings {
  currency: string;
  theme: 'light' | 'dark';
  darkMode?: boolean;
  activeProfileId?: string;
  language: 'en' | 'sw';
  monthlyBudget?: number;
  budgets?: Record<string, number>;
  notifications?: boolean;
  autoCategorize?: boolean;
  showRunwayWarning?: boolean;
  hasCompletedTutorial?: boolean;
}

export interface User {
  id?: string;
  username: string;
  email: string;
  password?: string;
  activeProfileId?: string;
  settings: UserSettings;
  profiles: Profile[];
  createdAt?: string;
}

export interface DashboardStats {
  netBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalExpense: number;
  totalBnplDebt: number;
  savingsRate: number;
  budgetRemaining: number;
  budgetUsedPercent: number;
  transactionCount: number;
  efficiencyScore: EfficiencyScore;
}

export interface SmartParsedTransaction {
  name: string;
  amount: number;
  date: string;
  type: 'income' | 'expense' | 'bnpl';
  category: string;
  paymentMethod?: string;
  isFixedCost?: boolean;
  notes?: string;
}

