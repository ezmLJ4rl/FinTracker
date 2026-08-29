import { CategoryItem, Profile, Transaction } from './types';

export const CURRENCIES = [
  { code: 'TZS', symbol: 'TSh', label: 'TSh (Tanzanian Shilling)', locale: 'sw-TZ' },
  { code: 'USD', symbol: '$', label: '$ USD (US Dollar)', locale: 'en-US' },
  { code: 'KES', symbol: 'KSh', label: 'KSh (Kenyan Shilling)', locale: 'en-KE' },
  { code: 'EUR', symbol: '€', label: '€ EUR (Euro)', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', label: '£ GBP (British Pound)', locale: 'en-GB' },
  { code: 'ZAR', symbol: 'R', label: 'R ZAR (South African Rand)', locale: 'en-ZA' },
  { code: 'CAD', symbol: 'C$', label: 'C$ CAD (Canadian Dollar)', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', label: 'A$ AUD (Australian Dollar)', locale: 'en-AU' },
  { code: 'INR', symbol: '₹', label: '₹ INR (Indian Rupee)', locale: 'en-IN' },
  { code: 'AED', symbol: 'AED', label: 'AED (UAE Dirham)', locale: 'ar-AE' },
];

export const PAYMENT_METHODS = [
  'M-Pesa / Vodacom',
  'Tigo Pesa / Airtel Money',
  'Cash',
  'Bank Card / Visa / MC',
  'Bank Transfer / NMB / CRDB',
  'BNPL / Lipa Baadaye',
  'Other Digital Wallet',
];

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  // Expenses
  { id: 'cat-food', name: 'Food & Dining', icon: 'Utensils', color: '#f59e0b', type: 'expense', budgetLimit: 300000, isFixed: false },
  { id: 'cat-transport', name: 'Transport & Fuel', icon: 'Car', color: '#3b82f6', type: 'expense', budgetLimit: 150000, isFixed: false },
  { id: 'cat-housing', name: 'Rent & Housing', icon: 'Home', color: '#8b5cf6', type: 'expense', budgetLimit: 500000, isFixed: true },
  { id: 'cat-utilities', name: 'Utilities (LUKU & Water)', icon: 'Zap', color: '#eab308', type: 'expense', budgetLimit: 100000, isFixed: true },
  { id: 'cat-shopping', name: 'Shopping & Groceries', icon: 'ShoppingBag', color: '#ec4899', type: 'expense', budgetLimit: 200000, isFixed: false },
  { id: 'cat-health', name: 'Healthcare & Meds', icon: 'HeartPulse', color: '#ef4444', type: 'expense', budgetLimit: 80000, isFixed: false },
  { id: 'cat-education', name: 'Education & Courses', icon: 'GraduationCap', color: '#10b981', type: 'expense', budgetLimit: 250000, isFixed: true },
  { id: 'cat-entertainment', name: 'Entertainment & Leisure', icon: 'Film', color: '#6366f1', type: 'expense', budgetLimit: 80000, isFixed: false },
  { id: 'cat-subscriptions', name: 'Internet & Subscriptions', icon: 'Wifi', color: '#06b6d4', type: 'expense', budgetLimit: 75000, isFixed: true },
  
  // BNPL / Debt Obligations
  { id: 'cat-bnpl', name: 'BNPL / Installment Loans', icon: 'ClockAlert', color: '#f43f5e', type: 'bnpl', budgetLimit: 120000, isFixed: true },

  // Income
  { id: 'cat-salary', name: 'Monthly Salary', icon: 'Briefcase', color: '#10b981', type: 'income' },
  { id: 'cat-freelance', name: 'Freelance & Projects', icon: 'Laptop', color: '#14b8a6', type: 'income' },
  { id: 'cat-business', name: 'Business Revenue', icon: 'TrendingUp', color: '#059669', type: 'income' },
  { id: 'cat-investments', name: 'Investments & Dividends', icon: 'PiggyBank', color: '#0284c7', type: 'income' },
  { id: 'cat-other-inc', name: 'Gifts & Allowance', icon: 'Gift', color: '#84cc16', type: 'income' },
];

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'prof-main',
    name: 'Personal Account',
    description: 'Daily living, household expenses, and personal savings',
    avatarColor: 'from-blue-600 to-indigo-600',
    currency: 'TZS',
    monthlyBudget: 1500000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prof-biz',
    name: 'Tech Ventures & Freelance',
    description: 'Consulting revenue, software licenses, equipment costs',
    avatarColor: 'from-emerald-500 to-teal-600',
    currency: 'TZS',
    monthlyBudget: 2800000,
    createdAt: new Date().toISOString(),
  },
];

export const SUGGESTED_AI_PROMPTS = [
  {
    title: '🍔 Check food spending',
    query: 'How much am I spending on food and dining? Is it too high?',
    icon: 'Utensils',
  },
  {
    title: '💳 Check debts & loans',
    query: 'What are my current loans or BNPL debts, and how can I pay them off faster?',
    icon: 'ClockAlert',
  },
  {
    title: '⏳ How long will my money last?',
    query: 'Based on my spending so far, how long will my budget last this month?',
    icon: 'Calendar',
  },
  {
    title: '💡 3 Simple tips to save money',
    query: 'Give me 3 simple, easy tips to save more money this month.',
    icon: 'Lightbulb',
  },
  {
    title: '🇹🇿 Ushauri kwa Kiswahili',
    query: 'Habari! Nipe ushauri rahisi wa jinsi ya kupanga matumizi yangu na kuweka akiba.',
    icon: 'Languages',
  },
];

export const ACADEMIC_DISCLAIMER = {
  institution: 'Institute of Finance Management (IFM)',
  faculty: 'Faculty of Computing, Information Systems and Mathematics',
  course: 'BSc. in Information Technology / Computer Science Capstone',
  year: '2025/2026',
  supervisor: 'Department Academic Supervisor',
  authors: ['FinTrack Pro Capstone Research Group'],
};

export const INITIAL_USER = {
  id: 'usr-default',
  username: 'Alex Mhando',
  email: 'alex.mhando@fintrack.ac.tz',
  activeProfileId: 'prof-main',
  profiles: INITIAL_PROFILES,
  settings: {
    currency: 'TZS',
    theme: 'dark' as 'light' | 'dark',
    notifications: true,
    autoCategorize: true,
    showRunwayWarning: true,
  },
};
export const STORAGE_DB_NAME = 'fintrack_pro_db_v3';
export const STORES = {
  TRANSACTIONS: 'transactions',
  RECEIPTS: 'receipts',
  USERS: 'users',
  CATEGORIES: 'categories',
  PROFILES: 'profiles',
};
