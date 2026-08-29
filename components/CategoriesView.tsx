import React, { useState } from 'react';
import { CategoryItem } from '../types';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  ClockAlert,
  ArrowDownLeft,
  ArrowUpRight,
  Utensils,
  Car,
  Home,
  Zap,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Film,
  Wifi,
  Briefcase,
  Laptop,
  TrendingUp,
  PiggyBank,
  Gift,
  X,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  categories: CategoryItem[];
  currencySymbol: string;
  onSaveCategory: (category: CategoryItem) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const COLOR_OPTIONS = [
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#eab308',
  '#ec4899',
  '#ef4444',
  '#10b981',
  '#6366f1',
  '#06b6d4',
  '#f43f5e',
  '#14b8a6',
  '#059669',
  '#0284c7',
  '#84cc16',
];

const CategoriesView: React.FC<Props> = ({
  categories,
  currencySymbol,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'bnpl'>('expense');
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [type, setType] = useState<'expense' | 'income' | 'bnpl'>('expense');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [isFixed, setIsFixed] = useState(false);

  const handleOpenAdd = () => {
    setEditingCat(null);
    setName('');
    setColor(COLOR_OPTIONS[0]);
    setType(activeTab);
    setBudgetLimit('');
    setIsFixed(false);
    setShowModal(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCat(cat);
    setName(cat.name);
    setColor(cat.color);
    setType(cat.type);
    setBudgetLimit(cat.budgetLimit?.toString() || '');
    setIsFixed(!!cat.isFixed);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newCat: CategoryItem = {
      id: editingCat ? editingCat.id : `cat-${Date.now()}`,
      name,
      icon: 'Tag',
      color,
      type,
      budgetLimit: budgetLimit ? parseFloat(budgetLimit) : undefined,
      isFixed: type === 'income' ? false : isFixed,
    };

    await onSaveCategory(newCat);
    setShowModal(false);
  };

  const filtered = categories.filter((c) => c.type === activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Taxonomy & Categorization
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              {categories.length} Total
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Spending & Inflow Categories
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Custom category allocations, color coding, and monthly expenditure caps.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Add Custom Category</span>
        </button>
      </div>

      {/* Type Tabs */}
      <div className="flex p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md shadow-xs">
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'expense'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowDownLeft size={14} />
          <span>Expenses ({categories.filter((c) => c.type === 'expense').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'income'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowUpRight size={14} />
          <span>Incomes ({categories.filter((c) => c.type === 'income').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bnpl')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'bnpl'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ClockAlert size={14} />
          <span>BNPL & Loans ({categories.filter((c) => c.type === 'bnpl').length})</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cat) => (
          <div
            key={cat.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs font-bold text-sm"
                style={{ backgroundColor: cat.color }}
              >
                {cat.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {cat.name}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {cat.budgetLimit ? (
                    <span className="font-mono">
                      Cap: {currencySymbol} {cat.budgetLimit.toLocaleString()}
                    </span>
                  ) : (
                    <span>No sub-cap</span>
                  )}
                  {cat.isFixed && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Fixed
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Edit Category"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete category "${cat.name}"?`)) {
                    onDeleteCategory(cat.id);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                title="Delete Category"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingCat ? 'Edit Category' : 'Create Custom Category'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Electricity, Gym, Freelance Retainers"
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Classification
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Inflow (Income)</option>
                  <option value="bnpl">BNPL / Installment Loan</option>
                </select>
              </div>

              {type !== 'income' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Monthly Spending Ceiling ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                    placeholder="Optional sub-budget cap"
                    className="w-full px-3.5 py-2 text-xs font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {type !== 'income' && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Fixed Essential Expense?
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Essential bills vs discretionary variable
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isFixed}
                    onChange={(e) => setIsFixed(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Badge Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center text-white ${
                        color === c ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <CheckCircle2 size={13} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all"
                >
                  Save Category
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesView;
