import React, { useState } from 'react';
import { CategoryItem, SmartParsedTransaction } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { parseSmartEntryWithAI } from '../services/geminiService';
import {
  X,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  Mic,
  MicOff,
  ArrowDownLeft,
  ArrowUpRight,
  ClockAlert,
  HelpCircle,
  Layers,
  Send,
  BrainCircuit,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  categories: CategoryItem[];
  currencySymbol: string;
  onSaveTransactions: (
    transactions: Array<{
      name: string;
      amount: number;
      date: string;
      category: string;
      type: 'income' | 'expense' | 'bnpl';
      paymentMethod: string;
      isFixedCost: boolean;
      notes: string;
    }>
  ) => Promise<void>;
  onClose: () => void;
}

const QUICK_EXAMPLES = [
  'Lunch at KFC 15,000 with M-Pesa',
  'LUKU electricity bill 50,000 with Airtel Money',
  'Monthly Salary 1,800,000 deposited in Bank',
  'Shoppers groceries 45,000 cash yesterday',
  'Uber taxi ride 14,000 via M-Pesa',
  'Bought sneakers 65,000 with Lipa Pole Pole (BNPL)',
];

const SWAHILI_EXAMPLES = [
  'Chakula cha mchana shilingi 15000 kwa M-Pesa',
  'Nimelipa bili ya maji 35000 kwa Airtel Money',
  'Nimepokea mshahara 1500000 benki',
  'Manunuzi ya nyumbani sokoni 40000 taslimu',
];

const SmartEntryModal: React.FC<Props> = ({
  isOpen,
  categories,
  currencySymbol,
  onSaveTransactions,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [parsedItems, setParsedItems] = useState<SmartParsedTransaction[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  // Handle Speech-to-Text if available in browser
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your transactions directly.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev}\n${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Trigger AI NLP parsing
  const handleParseText = async (textToParse?: string) => {
    const text = (textToParse || inputText).trim();
    if (!text || isParsing) return;

    setIsParsing(true);
    setSuccessCount(null);

    try {
      const categoryNames = categories.map((c) => c.name);
      const results = await parseSmartEntryWithAI(text, categoryNames, currencySymbol);
      setParsedItems(results);
    } catch (err) {
      console.error('Smart entry parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  // Update item in parsed table
  const handleUpdateItem = (index: number, updates: Partial<SmartParsedTransaction>) => {
    setParsedItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  // Remove item from parsed list
  const handleRemoveItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Add an empty item
  const handleAddBlankItem = () => {
    const defaultDate = new Date().toISOString().split('T')[0];
    setParsedItems((prev) => [
      ...prev,
      {
        name: 'New Item',
        amount: 10000,
        date: defaultDate,
        type: 'expense',
        category: categories.find((c) => c.type === 'expense')?.name || 'Food & Dining',
        paymentMethod: PAYMENT_METHODS[0],
        isFixedCost: false,
        notes: 'Added manually',
      },
    ]);
  };

  // Commit and record all parsed items
  const handleRecordAll = async () => {
    if (parsedItems.length === 0 || isRecording) return;

    setIsRecording(true);
    try {
      const formatted = parsedItems.map((item) => ({
        name: item.name.trim() || 'Transaction',
        amount: Number(item.amount) || 0,
        date: item.date || new Date().toISOString().split('T')[0],
        category: item.category || (item.type === 'income' ? 'Salary' : 'Food & Dining'),
        type: item.type,
        paymentMethod: item.paymentMethod || PAYMENT_METHODS[0],
        isFixedCost: Boolean(item.isFixedCost),
        notes: item.notes || 'Recorded via Smart Natural Words Entry',
      }));

      await onSaveTransactions(formatted);
      setSuccessCount(formatted.length);
      setTimeout(() => {
        onClose();
        setParsedItems([]);
        setInputText('');
        setSuccessCount(null);
      }, 1000);
    } catch (err) {
      console.error('Failed to record transactions:', err);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
              <BrainCircuit size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Smart Natural Entry
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  AI Text Parser
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Type or speak sentences in plain words — AI extracts and records transactions instantly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Natural Language Input Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Type Your Spending / Incomes in Words</span>
              </label>
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                  isListening
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Speak to dictate text"
              >
                {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    handleParseText();
                  }
                }}
                placeholder="Examples:&#10;• Lunch 15,000 KFC with M-Pesa&#10;• Paid 60,000 for fuel at Shell yesterday&#10;• Received 1,500,000 monthly salary into Bank Account&#10;• Nilinunua chakula 20000 kwa M-Pesa"
                className="w-full px-4 py-3 text-xs sm:text-sm font-medium rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed resize-none shadow-xs"
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-slate-400">
                Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">Ctrl+Enter</kbd> to analyze
              </span>
              <button
                type="button"
                onClick={() => handleParseText()}
                disabled={!inputText.trim() || isParsing}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <span>Extract with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Examples Pills */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Quick Click Templates:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EXAMPLES.slice(0, 4).map((eg, idx) => (
                <button
                  key={`en-${idx}`}
                  type="button"
                  onClick={() => {
                    setInputText(eg);
                    handleParseText(eg);
                  }}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  + {eg}
                </button>
              ))}
              {SWAHILI_EXAMPLES.slice(0, 2).map((sw, idx) => (
                <button
                  key={`sw-${idx}`}
                  type="button"
                  onClick={() => {
                    setInputText(sw);
                    handleParseText(sw);
                  }}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors border border-emerald-200 dark:border-emerald-800"
                >
                  🇹🇿 {sw}
                </button>
              ))}
            </div>
          </div>

          {/* Parsed Transactions List Preview */}
          {parsedItems.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-500" />
                    <span>Extracted Transactions ({parsedItems.length})</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddBlankItem}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add Another Item</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {parsedItems.map((item, idx) => {
                  const availableCategories = categories.filter((c) => c.type === item.type);
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Type Switcher */}
                        <div className="flex p-0.5 bg-slate-200/80 dark:bg-slate-700/80 rounded-lg text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(idx, { type: 'expense' })}
                            className={`px-2 py-0.5 rounded-md transition-colors ${
                              item.type === 'expense'
                                ? 'bg-rose-500 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            Expense
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(idx, { type: 'income' })}
                            className={`px-2 py-0.5 rounded-md transition-colors ${
                              item.type === 'income'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            Income
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(idx, { type: 'bnpl' })}
                            className={`px-2 py-0.5 rounded-md transition-colors ${
                              item.type === 'bnpl'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            BNPL
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Row 1: Name and Amount */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">
                            Transaction Title
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(idx, { name: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="e.g. Lunch at KFC"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">
                            Amount ({currencySymbol})
                          </label>
                          <input
                            type="number"
                            value={item.amount || ''}
                            onChange={(e) => handleUpdateItem(idx, { amount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-1.5 text-xs font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Row 2: Category, Payment Method, Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">
                            Category
                          </label>
                          <select
                            value={item.category}
                            onChange={(e) => handleUpdateItem(idx, { category: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {availableCategories.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">
                            Payment Method
                          </label>
                          <select
                            value={item.paymentMethod || PAYMENT_METHODS[0]}
                            onChange={(e) => handleUpdateItem(idx, { paymentMethod: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {PAYMENT_METHODS.map((pm) => (
                              <option key={pm} value={pm}>
                                {pm}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">
                            Date
                          </label>
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => handleUpdateItem(idx, { date: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Success Message Banner */}
          {successCount !== null && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Successfully recorded {successCount} transaction{successCount > 1 ? 's' : ''} to your wallet!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRecordAll}
              disabled={parsedItems.length === 0 || isRecording}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isRecording ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>
                    Record {parsedItems.length > 0 ? `${parsedItems.length} Transaction${parsedItems.length > 1 ? 's' : ''}` : 'Transactions'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartEntryModal;
