import React from 'react';
import { Transaction, Profile, DashboardStats, User } from '../types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ClockAlert,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { exportFinancialAuditPDF } from '../utils/financeUtils';

interface Props {
  user: User;
  profile: Profile;
  transactions: Transaction[];
  stats: DashboardStats;
  currencySymbol: string;
  onOpenScanReceipt: () => void;
  onOpenAddTransaction: () => void;
  onOpenSmartEntry?: () => void;
  onNavigateTab: (tab: string) => void;
  onViewReceipt: (id: string) => void;
}

const DashboardView: React.FC<Props> = ({
  user,
  profile,
  transactions,
  stats,
  currencySymbol,
  onOpenScanReceipt,
  onOpenAddTransaction,
  onOpenSmartEntry,
  onNavigateTab,
  onViewReceipt,
}) => {
  const efficiencyScore = stats?.efficiencyScore || {
    score: 75,
    grade: 'B',
    title: 'Solid Financial Health',
    projectedRunwayDays: 30,
  };

  const netBalance = stats?.netBalance ?? 0;
  const totalIncome = stats?.totalIncome ?? 0;
  const totalExpenses = stats?.totalExpenses ?? stats?.totalExpense ?? 0;
  const totalBnplDebt = stats?.totalBnplDebt ?? 0;
  const savingsRate = stats?.savingsRate ?? 0;

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/70 dark:border-indigo-800/70">
          <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span>Active Wallet: {profile?.name || 'Personal'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportFinancialAuditPDF(transactions, profile, currencySymbol, stats, user.username)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            title="Download Full PDF Financial Audit Report"
          >
            <FileText size={15} />
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* 4 Core Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Balance Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Money Left (Net)
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight mb-1">
            {currencySymbol} {netBalance.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {savingsRate.toFixed(0)}% saved
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 dark:text-slate-400">{efficiencyScore.projectedRunwayDays} days left</span>
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Income
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight mb-1">
            +{currencySymbol} {totalIncome.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {transactions.filter((t) => t.type === 'income').length} income records
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Spent
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 tracking-tight mb-1">
            -{currencySymbol} {totalExpenses.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {transactions.filter((t) => t.type === 'expense').length} expense records
          </p>
        </div>

        {/* Loans & BNPL */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Loans & BNPL
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ClockAlert size={16} />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 tracking-tight mb-1">
            {currencySymbol} {totalBnplDebt.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {totalBnplDebt > 0 ? `${currencySymbol} ${totalBnplDebt.toLocaleString()} to pay off` : 'No active loans'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
