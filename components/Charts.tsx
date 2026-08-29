import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
  currencySymbol: string;
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export const IncomeExpensePie: React.FC<Props> = ({ transactions, currencySymbol }) => {
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  const data = [
    { name: 'Income', value: income },
    { name: 'Expense', value: expense },
  ];

  if (income === 0 && expense === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        No data to display
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            <Cell key="income" fill="#10b981" />
            <Cell key="expense" fill="#ef4444" />
          </Pie>
          <Tooltip 
            formatter={(value: number) => `${currencySymbol} ${value.toLocaleString()}`}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TrendChart: React.FC<Props> = ({ transactions, currencySymbol }) => {
  // Group by month (last 6 months)
  const getLast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d);
    }
    return months;
  };

  const months = getLast6Months();
  const data = months.map(date => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const label = date.toLocaleString('default', { month: 'short' });
    
    const monthlyTx = transactions.filter(t => {
      const tDate = new Date(t.date);
      return `${tDate.getFullYear()}-${tDate.getMonth()}` === monthKey;
    });

    return {
      name: label,
      income: monthlyTx.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
      expense: monthlyTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
          <Tooltip 
             formatter={(value: number) => `${currencySymbol} ${value.toLocaleString()}`}
             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
          <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};