import React, { useState, useEffect } from 'react';
import { Transaction, CategoryItem } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { parseSmartEntry } from '../services/smartService';
import {
  X,
  Save,
  Upload,
  Image as ImageIcon,
  ClockAlert,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  initialData?: Transaction;
  categories: CategoryItem[];
  currencySymbol: string;
  onSave: (
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'userId' | 'profileId'>,
    receiptData?: { name: string; type: string; dataUrl: string }
  ) => Promise<void>;
  onClose: () => void;
  onOpenSmartEntry?: () => void;
}

const TransactionFormModal: React.FC<Props> = ({
  isOpen,
  initialData,
  categories,
  currencySymbol,
  onSave,
  onClose,
  onOpenSmartEntry,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'income' | 'expense' | 'bnpl'>(initialData?.type || 'expense');
  const [category, setCategory] = useState(initialData?.category || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || PAYMENT_METHODS[0]);
  const [isFixedCost, setIsFixedCost] = useState(initialData?.isFixedCost || false);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [receipt, setReceipt] = useState<{ name: string; type: string; dataUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickInputText, setQuickInputText] = useState('');
  const [isQuickParsing, setIsQuickParsing] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAmount(initialData.amount.toString());
      setDate(initialData.date);
      setType(initialData.type);
      setCategory(initialData.category);
      setPaymentMethod(initialData.paymentMethod || PAYMENT_METHODS[0]);
      setIsFixedCost(!!initialData.isFixedCost);
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setType('expense');
      setPaymentMethod(PAYMENT_METHODS[0]);
      setIsFixedCost(false);
      setNotes('');
      setReceipt(null);
      setQuickInputText('');
    }
  }, [initialData, isOpen]);

  // Set default category according to type
  useEffect(() => {
    const filteredCats = categories.filter((c) => c.type === type);
    if (filteredCats.length > 0) {
      const match = filteredCats.find((c) => c.name === category);
      if (!match) {
        setCategory(filteredCats[0].name);
      }
    }
  }, [type, categories]);

  if (!isOpen) return null;

  const handleQuickAutofill = async () => {
    if (!quickInputText.trim() || isQuickParsing) return;
    setIsQuickParsing(true);
    try {
      const categoryNames = categories.map((c) => c.name);
      const extracted = await parseSmartEntry(quickInputText, categoryNames, currencySymbol);
      if (extracted.length > 0) {
        const item = extracted[0];
        setName(item.name);
        setAmount(item.amount.toString());
        if (item.date) setDate(item.date);
        setType(item.type);
        if (item.category) setCategory(item.category);
        if (item.paymentMethod) setPaymentMethod(item.paymentMethod);
        setIsFixedCost(Boolean(item.isFixedCost));
        if (item.notes) setNotes(item.notes);
      }
    } catch (err) {
      console.warn('Quick autofill error:', err);
    } finally {
      setIsQuickParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setReceipt({
            name: file.name,
            type: file.type || 'image/jpeg',
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
      await onSave(
        {
          name,
          amount: parseFloat(amount),
          date,
          type,
          category,
          paymentMethod,
          isFixedCost: type === 'income' ? false : isFixedCost,
          notes,
          receiptId: initialData?.receiptId,
        },
        receipt || undefined
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const availableCategories = categories.filter((c) => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {initialData ? 'Edit Transaction Record' : 'Record New Transaction'}
            </h3>
            {onOpenSmartEntry && !initialData && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSmartEntry();
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 hover:bg-indigo-200 transition-colors flex items-center gap-1"
                title="Switch to full Smart Natural Language mode"
              >
                <span>Smart Words Mode</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Sentence Autofill bar (when creating new) */}
        {!initialData && (
          <div className="px-6 py-3 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={quickInputText}
                  onChange={(e) => setQuickInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickAutofill();
                    }
                  }}
                  placeholder="Type words (e.g. 'Lunch 15,000 KFC with M-Pesa') to autofill..."
                  className="w-full pl-3 pr-20 py-1.5 text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <button
                  type="button"
                  onClick={handleQuickAutofill}
                  disabled={!quickInputText.trim() || isQuickParsing}
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  {isQuickParsing && <RefreshCw size={11} className="animate-spin" />}
                  <span>Autofill</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Type Segment Control: Expense, Income, BNPL */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft size={14} />
              Expense
            </button>

            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight size={14} />
              Income
            </button>

            <button
              type="button"
              onClick={() => {
                setType('bnpl');
                setIsFixedCost(true);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === 'bnpl'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Buy Now Pay Later / Installment Loan obligation"
            >
              <ClockAlert size={14} />
              BNPL / Debt
            </button>
          </div>

          {/* Merchant / Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {type === 'income' ? 'Income Source / Payee' : 'Merchant / Payee Name'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'income' ? 'e.g. Monthly Salary, Freelance Client' : 'e.g. Samaki Samaki, TANESCO LUKU'}
              className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Amount ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono font-bold">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-3 py-2 text-xs font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Transaction Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fixed vs Variable Cost Classification (For Expenses & BNPL) */}
          {type !== 'income' && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Fixed Recurring Cost?
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isFixedCost ? 'Essential fixed expense (Rent, LUKU, Loan, School)' : 'Discretionary variable cost (Dining, Shopping, Trips)'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFixedCost}
                  onChange={(e) => setIsFixedCost(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Audit Notes & Details (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Receipt #4892, 2nd installment of 4, tax deductible"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Receipt Image Upload */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Thermal Receipt / Invoice Photo
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full">
                <Upload size={16} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {receipt ? 'Change Receipt Photo' : 'Attach Receipt Image'}
                </span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {receipt && (
              <div className="mt-2 relative w-full h-28 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                <img src={receipt.dataUrl} alt="Receipt preview" className="h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setReceipt(null)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white p-1 rounded-full transition"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {!receipt && initialData?.receiptId && (
              <div className="mt-2 text-xs text-indigo-500 flex items-center gap-1">
                <ImageIcon size={14} />
                <span>Existing receipt record attached in database</span>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-xs"
            >
              <Save size={16} />
              <span>{loading ? 'Saving Record...' : 'Save to Ledger'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionFormModal;
