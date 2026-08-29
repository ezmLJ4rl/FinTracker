import React, { useState, useEffect } from 'react';
import { Transaction, Receipt } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants';
import { Upload, X, Save, Image as ImageIcon } from 'lucide-react';

interface Props {
  initialData?: Transaction;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'userId'>, receipt?: { name: string, type: string, dataUrl: string }) => Promise<void>;
  onCancel: () => void;
  currencySymbol: string;
}

const TransactionForm: React.FC<Props> = ({ initialData, onSave, onCancel, currencySymbol }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense');
  const [category, setCategory] = useState(initialData?.category || EXPENSE_CATEGORIES[0]);
  const [receipt, setReceipt] = useState<{ name: string, type: string, dataUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Update category default when type changes
  useEffect(() => {
    if (!initialData) {
      setCategory(type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    }
  }, [type, initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setReceipt({
            name: file.name,
            type: file.type,
            dataUrl: event.target.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !date) return;

    setLoading(true);
    try {
      await onSave({
        name,
        amount: parseFloat(amount),
        date,
        type,
        category,
        receiptId: initialData?.receiptId // Preserve existing ID if not replacing
      }, receipt || undefined);
    } finally {
      setLoading(false);
    }
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
          {initialData ? 'Edit Transaction' : 'Add Transaction'}
        </h3>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              type === 'income'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Expense
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. Grocery Shopping"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Receipt</label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full">
              <Upload size={18} className="text-slate-500" />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {receipt ? 'Change Image' : 'Upload Image'}
              </span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
          {receipt && (
            <div className="mt-3 relative w-full h-32 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <img src={receipt.dataUrl} alt="Preview" className="h-full object-contain" />
                <button 
                    type="button"
                    onClick={() => setReceipt(null)}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition"
                >
                    <X size={14} />
                </button>
            </div>
          )}
           {!receipt && initialData?.receiptId && (
              <div className="mt-2 text-sm text-blue-500 flex items-center gap-1">
                  <ImageIcon size={14}/> <span>Has existing receipt</span>
              </div>
          )}
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;