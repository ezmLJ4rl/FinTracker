import React, { useState } from 'react';
import { Transaction, CategoryItem, Profile, DashboardStats, User } from '../types';
import {
  Search,
  Filter,
  Camera,
  Plus,
  FileDown,
  FileText,
  Trash2,
  Edit2,
  ClockAlert,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { exportFinancialAuditPDF, exportTransactionsCSV } from '../utils/financeUtils';

interface Props {
  user: User;
  profile: Profile;
  transactions: Transaction[];
  categories: CategoryItem[];
  stats: DashboardStats;
  currencySymbol: string;
  onOpenScanReceipt: () => void;
  onOpenAddTransaction: () => void;
  onOpenSmartEntry?: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onViewReceipt: (id: string) => void;
}

const TransactionsView: React.FC<Props> = ({
  user,
  profile,
  transactions,
  categories,
  stats,
  currencySymbol,
  onOpenScanReceipt,
  onOpenAddTransaction,
  onOpenSmartEntry,
  onEditTransaction,
  onDeleteTransaction,
  onViewReceipt,
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense' | 'bnpl'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Filter Logic
  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(search.toLowerCase())) ||
      (t.paymentMethod && t.paymentMethod.toLowerCase().includes(search.toLowerCase()));

    const matchesType = selectedType === 'all' || t.type === selectedType;
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;

    return matchesSearch && matchesType && matchesCat;
  });

  // Sort Logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Fast Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              All Transactions
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              {transactions.length} Total
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Transaction History
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenSmartEntry && (
            <button
              onClick={onOpenSmartEntry}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
              title="Type transactions in plain words"
            >
              <span>Smart Entry</span>
            </button>
          )}
          <button
            onClick={onOpenScanReceipt}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
          >
            <Camera size={15} />
            <span>Receipt Scanner</span>
          </button>
          <button
            onClick={onOpenAddTransaction}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Transaction</span>
          </button>
          <button
            onClick={() => exportTransactionsCSV(transactions, profile.name)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Download CSV file"
          >
            <FileDown size={16} />
          </button>
          <button
            onClick={() => exportFinancialAuditPDF(transactions, profile, currencySymbol, stats, user.username)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Download PDF report"
          >
            <FileText size={16} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shop, category, notes, or payment..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Types (Income & Expenses)</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
              <option value="bnpl">Loans / BNPL Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="date-desc">Newest Date</option>
              <option value="date-asc">Oldest Date</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List (Figure 4) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {sorted.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Layers size={22} />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No transactions match your current filters.
            </p>
            <p className="text-xs text-slate-400">
              Try adjusting your search query or reset the type filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {sorted.map((tx) => (
              <div
                key={tx.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
              >
                {/* Left: Type Indicator & Merchant Details */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center shadow-xs font-bold text-sm ${
                      tx.type === 'income'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : tx.type === 'bnpl'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight size={20} />
                    ) : tx.type === 'bnpl' ? (
                      <ClockAlert size={20} />
                    ) : (
                      <ArrowDownLeft size={20} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {tx.name}
                      </h4>
                      {tx.type === 'bnpl' && (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Loan / BNPL
                        </span>
                      )}
                      {tx.isFixedCost && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          Fixed Cost
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {tx.category}
                      </span>
                      <span>•</span>
                      <span>{tx.date}</span>
                      {tx.paymentMethod && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500">{tx.paymentMethod}</span>
                        </>
                      )}
                    </div>

                    {tx.notes && (
                      <p className="text-[11px] text-slate-400 mt-1 italic max-w-md">
                        {tx.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-14 sm:pl-0">
                  <div className="text-right">
                    <div
                      className={`text-base font-black font-mono tracking-tight ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : tx.type === 'bnpl'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {currencySymbol} {tx.amount.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {tx.type === 'bnpl' ? 'Loan' : tx.type}
                    </span>
                  </div>

                  {/* Actions Group */}
                  <div className="flex items-center gap-1">
                    {tx.receiptId && (
                      <button
                        onClick={() => onViewReceipt(tx.receiptId!)}
                        className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl transition-colors cursor-pointer"
                        title="View Receipt Photo"
                      >
                        <FileText size={16} />
                      </button>
                    )}

                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="Edit Transaction"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete transaction "${tx.name}"?`)) {
                          onDeleteTransaction(tx.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                      title="Delete Transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsView;
