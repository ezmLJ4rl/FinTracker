import React, { useState } from 'react';
import { User, Profile, Transaction } from '../types';
import { CURRENCIES } from '../constants';
import {
  Users,
  Plus,
  CheckCircle2,
  Wallet,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react';

interface Props {
  user: User;
  activeProfile: Profile;
  transactions: Transaction[];
  onSwitchProfile: (profileId: string) => void;
  onCreateProfile: (profile: Omit<Profile, 'id' | 'createdAt'>) => Promise<void>;
  currencySymbol: string;
}

const GRADIENTS = [
  { name: 'Indigo Dream', value: 'from-blue-600 to-indigo-600' },
  { name: 'Emerald Vault', value: 'from-emerald-500 to-teal-600' },
  { name: 'Royal Violet', value: 'from-purple-600 to-indigo-700' },
  { name: 'Amber Sunset', value: 'from-amber-500 to-orange-600' },
  { name: 'Rose Quartz', value: 'from-rose-500 to-pink-600' },
  { name: 'Slate Steel', value: 'from-slate-700 to-slate-900' },
];

const ProfilesView: React.FC<Props> = ({
  user,
  activeProfile,
  transactions,
  onSwitchProfile,
  onCreateProfile,
  currencySymbol,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [newProfileCurrency, setNewProfileCurrency] = useState('TZS');
  const [newProfileBudget, setNewProfileBudget] = useState('1500000');
  const [newProfileColor, setNewProfileColor] = useState(GRADIENTS[0].value);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName) return;

    setLoading(true);
    try {
      await onCreateProfile({
        name: newProfileName,
        description: newProfileDesc || 'Multi-vault profile',
        avatarColor: newProfileColor,
        currency: newProfileCurrency,
        monthlyBudget: parseFloat(newProfileBudget) || 1500000,
      });
      setShowCreateModal(false);
      setNewProfileName('');
      setNewProfileDesc('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Account Profiles
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              Multi-Profile
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Profile & Account Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Keep personal living, business revenue, side projects, and family expenses completely separated.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Create New Profile</span>
        </button>
      </div>

      {/* Profile Cards Grid (Figure 8) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {user.profiles.map((prof) => {
          const isActive = prof.id === activeProfile.id;
          const profileTx = transactions.filter((t) => t.profileId === prof.id || (!t.profileId && prof.id === 'prof-main'));
          const profIncome = profileTx.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
          const profExpense = profileTx.filter((t) => t.type === 'expense' || t.type === 'bnpl').reduce((acc, t) => acc + t.amount, 0);
          const profBalance = profIncome - profExpense;

          return (
            <div
              key={prof.id}
              className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-5 ${
                isActive
                  ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${prof.avatarColor} text-white flex items-center justify-center text-lg font-black shadow-md`}
                  >
                    {prof.name.charAt(0)}
                  </div>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 size={13} />
                      Active Account
                    </span>
                  ) : (
                    <button
                      onClick={() => onSwitchProfile(prof.id)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>Switch Account</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {prof.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {prof.description || 'Personal financial vault'}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Net Balance
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {currencySymbol} {profBalance.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Monthly Budget
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {currencySymbol} {prof.monthlyBudget.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {!isActive && (
                <button
                  onClick={() => onSwitchProfile(prof.id)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
                >
                  Activate {prof.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Profile Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create New Profile Vault
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Vault Name
                </label>
                <input
                  type="text"
                  required
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Side Hustle, Family Budget"
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                  placeholder="e.g. Project revenue, software tools & tax deductions"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Currency
                  </label>
                  <select
                    value={newProfileCurrency}
                    onChange={(e) => setNewProfileCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Monthly Target
                  </label>
                  <input
                    type="number"
                    value={newProfileBudget}
                    onChange={(e) => setNewProfileBudget(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Color Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENTS.map((g) => (
                    <button
                      type="button"
                      key={g.value}
                      onClick={() => setNewProfileColor(g.value)}
                      className={`h-8 rounded-lg bg-gradient-to-r ${g.value} flex items-center justify-center text-white transition-transform ${
                        newProfileColor === g.value ? 'ring-2 ring-indigo-500 scale-105' : 'opacity-80'
                      }`}
                    >
                      {newProfileColor === g.value && <CheckCircle2 size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all"
                >
                  Create Vault
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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

export default ProfilesView;
