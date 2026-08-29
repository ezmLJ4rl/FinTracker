import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Transaction, CategoryItem, Profile, DashboardStats } from '../types';
import {
  PieChart as PieIcon,
  TrendingUp,
  ClockAlert,
  ShieldCheck,
  Percent,
  Layers,
  Scale,
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  categories: CategoryItem[];
  profile: Profile;
  stats: DashboardStats;
  currencySymbol: string;
}

const PALETTE = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#f97316', // Orange
];

const StatisticsView: React.FC<Props> = ({
  transactions,
  categories,
  profile,
  stats,
  currencySymbol,
}) => {
  const { efficiencyScore } = stats;

  // 1. Spending by Category Aggregation
  const categoryMap: Record<string, number> = {};
  const outflowTx = transactions.filter((t) => t.type === 'expense' || t.type === 'bnpl');
  const totalOutflows = outflowTx.reduce((acc, t) => acc + t.amount, 0);

  outflowTx.forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const categoryPieData = Object.entries(categoryMap)
    .map(([name, value], i) => ({
      name,
      value,
      percentage: totalOutflows > 0 ? ((value / totalOutflows) * 100).toFixed(1) : '0',
      color: PALETTE[i % PALETTE.length],
    }))
    .sort((a, b) => b.value - a.value);

  // 2. 6-Month Cash Flow Trend Aggregation
  const getLast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d);
    }
    return months;
  };

  const cashFlowData = getLast6Months().map((date) => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const label = date.toLocaleString('default', { month: 'short' });

    const monthTx = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return `${tDate.getFullYear()}-${tDate.getMonth()}` === monthKey;
    });

    const income = monthTx.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthTx
      .filter((t) => t.type === 'expense' || t.type === 'bnpl')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      month: label,
      inflow: income,
      outflow: expense,
      surplus: income - expense,
    };
  });

  // 3. Fixed vs Variable Allocation
  const fixedTotal = outflowTx.filter((t) => t.isFixedCost).reduce((acc, t) => acc + t.amount, 0);
  const variableTotal = totalOutflows - fixedTotal;

  const costBreakdownData = [
    { name: 'Fixed Essential Costs', value: fixedTotal, color: '#6366f1' },
    { name: 'Variable Discretionary', value: variableTotal, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Reports & Charts
          </span>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            Live Data
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Money Charts & Statistics
        </h2>
      </div>

      {/* Main Charts Row: Doughnut (Figure 5) & Cash Flow (Figure 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown (Doughnut Chart - Figure 5) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Spending by Category
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Where your money goes each month
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PieIcon size={16} />
            </div>
          </div>

          {categoryPieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No outflow transactions recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-6 h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [
                        `${currencySymbol} ${val.toLocaleString()}`,
                        'Amount',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown Table */}
              <div className="sm:col-span-6 space-y-2 max-h-56 overflow-y-auto pr-1">
                {categoryPieData.map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/60"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                        {cat.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {currencySymbol} {cat.value.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 6-Month Cash Flow (Line/Area Graph - Figure 6) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Monthly Income vs Spent
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Income compared to expenses & loans over the last 6 months
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#334155" strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(val: number) => [`${currencySymbol} ${val.toLocaleString()}`]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="inflow"
                  name="Income"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#colorInflow)"
                />
                <Area
                  type="monotone"
                  dataKey="outflow"
                  name="Spent"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fill="url(#colorOutflow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Row: Fixed vs Variable Analysis & BNPL Risk Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fixed vs Variable Analysis */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale size={16} className="text-indigo-500" />
              Fixed vs Variable Costs
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Fixed Bills (Rent, Bills, Utilities)</span>
                <span className="font-mono">{efficiencyScore.fixedCostPct.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${efficiencyScore.fixedCostPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Daily Spending (Food, Shopping)</span>
                <span className="font-mono">{efficiencyScore.variableCostPct.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${efficiencyScore.variableCostPct}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              💡 <strong>Tip</strong>: Keeping fixed bills below 50% helps you save more each month.
            </p>
          </div>
        </div>

        {/* BNPL & Debt Obligations Exposure */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClockAlert size={16} className="text-amber-500" />
              Loans & Installments
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Active Loans to Pay:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {currencySymbol} {stats.totalBnplDebt.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Share of Total Spending:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {efficiencyScore.bnplBurdenPct.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {stats.totalBnplDebt === 0 ? 'No Debt' : 'Active Loans'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/50">
              ⚠️ Pay loan installments on time to keep your budget healthy and avoid fees.
            </p>
          </div>
        </div>

        {/* Financial Runway Days */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              Days of Money Left
            </h3>
          </div>

          <div className="text-center py-3 space-y-1">
            <div className="text-4xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {efficiencyScore.projectedRunwayDays}
            </div>
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Days Left with Current Savings
            </p>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 text-center leading-relaxed">
            With your current daily spending and saved money, your funds will last about {efficiencyScore.projectedRunwayDays} days.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatisticsView;
