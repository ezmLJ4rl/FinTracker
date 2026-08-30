import React, { useState, useRef, useEffect } from 'react';
import { Transaction, Profile, DashboardStats, PragmaticInsight } from '../types';
import { SUGGESTED_ADVISOR_PROMPTS } from '../constants';
import { queryFinancialAdvisor } from '../services/smartService';
import {
  Send,
  RefreshCw,
  Trash2,
  Languages,
  MessageSquare,
  Bot,
  User as UserIcon,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  ClockAlert,
  Wallet,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';

interface Props {
  profile?: Profile;
  transactions?: Transaction[];
  stats?: DashboardStats;
  currencySymbol?: string;
}

// Safe Money & Number Formatter
const formatMoneySafe = (amount: any, currency: string = 'TSh'): string => {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : Number(amount) || 0;
  return `${currency} ${num.toLocaleString()}`;
};

const FormattedMessageText: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  // Split by line breaks
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Bullet point detection
        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\./.test(trimmed);

        // Process bold tokens (**text**)
        const renderFormattedLine = (text: string) => {
          const parts = text.split(/(\*\*.*?\*\*)/g);
          return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={i} className="font-bold text-indigo-700 dark:text-indigo-300">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });
        };

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="text-indigo-500 font-bold shrink-0">•</span>
              <div className="flex-1">
                {renderFormattedLine(trimmed.replace(/^[•\-]\s*/, '').replace(/^\d+\.\s*/, ''))}
              </div>
            </div>
          );
        }

        return <p key={idx}>{renderFormattedLine(line)}</p>;
      })}
    </div>
  );
};

const InsightsView: React.FC<Props> = ({
  profile,
  transactions = [],
  stats,
  currencySymbol = 'TSh',
}) => {
  const profileName = profile?.name || 'Personal Wallet';
  const totalIncome = stats?.totalIncome ?? 0;
  const totalExpenses = stats?.totalExpenses ?? stats?.totalExpense ?? 0;
  const totalBnplDebt = stats?.totalBnplDebt ?? 0;
  const netBalance = stats?.netBalance ?? 0;
  const efficiencyScore = stats?.efficiencyScore?.score ?? 75;

  const createInitialMessage = (): PragmaticInsight => ({
    id: `init-${Date.now()}`,
    timestamp: new Date().toISOString(),
    role: 'assistant',
    content: `Hello! I am your personal Financial Assistant in FinTrack.

You can ask me **any question** in plain words — from checking your spending in **${profileName}**, how to save money, and managing loans, to everyday budgeting advice or friendly chat!

**Quick Wallet Summary:**
• **Income:** ${formatMoneySafe(totalIncome, currencySymbol)}
• **Spent:** ${formatMoneySafe(totalExpenses, currencySymbol)}
• **Loans / BNPL:** ${formatMoneySafe(totalBnplDebt, currencySymbol)}
• **Money Left:** ${formatMoneySafe(netBalance, currencySymbol)}

How can I assist you today?`,
  });

  const [messages, setMessages] = useState<PragmaticInsight[]>([createInitialMessage()]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [languageMode, setLanguageMode] = useState<'en' | 'sw'>('en');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: PragmaticInsight = {
      id: `usr-${Date.now()}`,
      timestamp: new Date().toISOString(),
      role: 'user',
      content: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      
      const safeProfile: Profile = profile || {
        id: 'default',
        name: 'Personal Wallet',
        avatarColor: 'from-blue-600 to-indigo-600',
        currency: 'TZS',
        monthlyBudget: 1500000,
        createdAt: new Date().toISOString(),
      };

      const safeEfficiencyScore = stats?.efficiencyScore || {
        score: 75,
        grade: 'B',
        title: 'Solid Financial Health',
        savingsRate: 20,
        budgetUtilizationPct: 60,
        fixedCostPct: 40,
        variableCostPct: 60,
        bnplBurdenPct: 5,
        projectedRunwayDays: 30,
        breakdown: {
          budgetDiscipline: 25,
          savingsHealth: 25,
          debtAndBnplRisk: 15,
          cashFlowStability: 15,
        },
        keyRecommendations: ['Maintain balanced cash reserves and limit discretionary expenses.'],
      };

      const response = await queryFinancialAdvisor(
        q,
        history,
        transactions,
        currencySymbol,
        safeProfile,
        safeEfficiencyScore
      );

      const assistantMsg: PragmaticInsight = {
        id: `advisor-${Date.now()}`,
        timestamp: new Date().toISOString(),
        role: 'assistant',
        content: response?.rawText || 'I am ready to help you analyze your budget and finances. What would you like to explore next?',
        structured: response?.structured,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Advisor request error:', err);
      const fallbackMsg: PragmaticInsight = {
        id: `advisor-fallback-${Date.now()}`,
        timestamp: new Date().toISOString(),
        role: 'assistant',
        content: `I'm here to help! Based on your active wallet (${profileName}), you have recorded ${formatMoneySafe(totalExpenses, currencySymbol)} in expenses and have ${formatMoneySafe(netBalance, currencySymbol)} remaining. Feel free to ask any other questions!`,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear chat conversation?')) {
      setMessages([createInitialMessage()]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Money Advisor
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5">
            <span>Financial Advisor & Assistant</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ask any question in English or Swahili about your daily spending, budget limits, or saving tips.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Swahili / English Mode Switcher */}
          <button
            onClick={() => {
              const newLang = languageMode === 'en' ? 'sw' : 'en';
              setLanguageMode(newLang);
              if (newLang === 'sw') {
                handleSendMessage('Habari! Nipe muhtasari rahisi wa hali yangu ya pesa na ushauri wa akiba.');
              }
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Languages size={15} className="text-indigo-500" />
            <span>{languageMode === 'en' ? 'Swahili Mode' : 'English Mode'}</span>
          </button>

          <button
            onClick={handleClearHistory}
            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Clear Chat Conversation"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp size={15} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Income</span>
            <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 truncate block">
              {formatMoneySafe(totalIncome, currencySymbol)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <TrendingDown size={15} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Spent</span>
            <span className="text-xs font-black font-mono text-rose-600 dark:text-rose-400 truncate block">
              {formatMoneySafe(totalExpenses, currencySymbol)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ClockAlert size={15} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Loans / BNPL</span>
            <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400 truncate block">
              {formatMoneySafe(totalBnplDebt, currencySymbol)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Wallet size={15} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Net Left</span>
            <span className="text-xs font-black font-mono text-slate-900 dark:text-white truncate block">
              {formatMoneySafe(netBalance, currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Suggested Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <MessageSquare size={13} className="text-indigo-500" />
          Quick questions:
        </span>
        {SUGGESTED_ADVISOR_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p.query)}
            disabled={loading}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all whitespace-nowrap shrink-0 hover:scale-[1.02] cursor-pointer"
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Main Chat Conversation Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[560px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Bot size={18} />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-xs shadow-md font-medium'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-700/80 shadow-xs'
                }`}
              >
                {/* Assistant message header */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-400">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      FinTrack Advisor
                    </span>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}

                {/* Formatted Message Body */}
                <FormattedMessageText content={msg.content} />
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <UserIcon size={16} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={18} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold border border-slate-200 dark:border-slate-700">
                <RefreshCw size={15} className="animate-spin" />
                <span>Thinking and analyzing financial data...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                languageMode === 'en'
                  ? 'Ask anything (e.g. "How can I cut expenses?", "What did I spend on dining?", "Hi!")...'
                  : 'Uliza chochote (mfano: "Nifanye nini kuweka akiba?", "Habari!", "Mbona matumizi ni makubwa?")...'
              }
              className="flex-1 px-4 py-3 text-xs sm:text-sm font-medium rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InsightsView;
