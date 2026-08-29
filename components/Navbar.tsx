import React from 'react';
import { User, Profile } from '../types';
import { CURRENCIES } from '../constants';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  BrainCircuit,
  Users,
  Tag,
  Settings,
  Moon,
  Sun,
  LogOut,
  Plus,
  Camera,
  TrendingUp,
  ChevronDown
} from 'lucide-react';

interface Props {
  user: User;
  activeProfile: Profile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onOpenScanReceipt: () => void;
  onOpenAddTransaction: () => void;
  onOpenSmartEntry?: () => void;
  onSwitchProfile: (profileId: string) => void;
  onOpenTutorial: () => void;
}

const Navbar: React.FC<Props> = ({
  user,
  activeProfile,
  activeTab,
  setActiveTab,
  isDark,
  onToggleTheme,
  onLogout,
  onOpenScanReceipt,
  onOpenAddTransaction,
  onOpenSmartEntry,
  onSwitchProfile,
  onOpenTutorial,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);
  const currency = CURRENCIES.find(c => c.code === activeProfile.currency) || CURRENCIES[0];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'statistics', label: 'Statistics', icon: PieChart },
    { id: 'insights', label: 'AI Advisor', icon: BrainCircuit },
    { id: 'profiles', label: 'Profiles', icon: Users },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 mr-1 xl:mr-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/20 shrink-0 relative group">
              <TrendingUp size={20} className="stroke-[2.4] transition-transform group-hover:scale-105" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400 whitespace-nowrap">
                  FinTrack
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-0.5 xl:space-x-1 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={15} className={`shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] px-1 py-0.2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded font-extrabold uppercase">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Smart Natural Words Entry Button */}
            {onOpenSmartEntry && (
              <button
                id="btn-smart-entry-nav"
                onClick={onOpenSmartEntry}
                className="h-9 px-2.5 xl:px-3.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                title="Smart Natural Language Entry"
              >
                <BrainCircuit size={15} className="shrink-0" />
                <span className="hidden xl:inline">Smart Entry</span>
              </button>
            )}

            {/* Quick Actions (Scan OCR & Manual Entry) */}
            <button
              id="btn-scan-receipt-nav"
              onClick={onOpenScanReceipt}
              className="h-9 px-2.5 xl:px-3.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
              title="Scan Receipt with AI Vision"
            >
              <Camera size={15} className="shrink-0" />
              <span className="hidden xl:inline">AI Scanner</span>
            </button>

            <button
              id="btn-add-tx-nav"
              onClick={onOpenAddTransaction}
              className="h-9 px-2.5 xl:px-3.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
              title="Add New Transaction"
            >
              <Plus size={15} className="shrink-0" />
              <span className="hidden xl:inline">Add Entry</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative inline-flex items-center shrink-0">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="h-9 px-2 sm:px-2.5 xl:px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left inline-flex items-center gap-1.5 xl:gap-2 max-w-[120px] sm:max-w-[160px] xl:max-w-[210px] shrink-0"
                title={`Active Wallet: ${activeProfile.name} (${currency.code})`}
              >
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${activeProfile.avatarColor} flex items-center justify-center text-white text-[11px] font-bold shadow-xs shrink-0`}>
                  {activeProfile.name.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col justify-center min-w-0 flex-1 overflow-hidden">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
                    {activeProfile.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-none">
                    {currency.code}
                  </div>
                </div>
                <ChevronDown size={13} className="text-slate-400 shrink-0 ml-0.5" />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Switch Wallet / Profile</p>
                  </div>
                  <div className="py-1">
                    {user.profiles.map((prof) => (
                      <button
                        key={prof.id}
                        onClick={() => onSwitchProfile(prof.id)}
                        className={`w-full px-3 py-2 flex items-center justify-between text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors ${
                          prof.id === activeProfile.id ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded bg-gradient-to-br ${prof.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}>
                            {prof.name.charAt(0)}
                          </div>
                          <span>{prof.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{prof.currency}</span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 pt-1">
                    <button
                      onClick={() => setActiveTab('profiles')}
                      className="w-full px-3 py-1.5 text-left text-xs text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-medium flex items-center gap-1.5"
                    >
                      <Users size={13} />
                      Manage All Profiles
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className="w-9 h-9 inline-flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="w-9 h-9 inline-flex items-center justify-center text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
