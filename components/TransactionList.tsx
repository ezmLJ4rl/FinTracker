import React, { useState } from 'react';
import { Transaction } from '../types';
import { Trash2, Edit2, FileText, ExternalLink } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  currencySymbol: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewReceipt: (id: string) => void;
}

const TransactionList: React.FC<Props> = ({ transactions, currencySymbol, onEdit, onDelete, onViewReceipt }) => {
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filtered = transactions.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(filter.toLowerCase()) || t.category.toLowerCase().includes(filter.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Sort by date desc
  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {sorted.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">No transactions found</div>
        ) : (
          sorted.map((tx) => (
            <div key={tx.id} className="group flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                  tx.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                }`}>
                  {tx.category.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{tx.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{tx.date} • {tx.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{currencySymbol}{tx.amount.toLocaleString()}
                </span>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {tx.receiptId && (
                    <button 
                      onClick={() => onViewReceipt(tx.receiptId!)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                      title="View Receipt"
                    >
                      <FileText size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => onEdit(tx.id)}
                    className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(tx.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionList;