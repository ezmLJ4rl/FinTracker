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
  ChevronDown,
  X
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
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<Props> = ({
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
  isOpen,
  onClose,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);
  const currency = CURRENCIES.find(c => c.code === activeProfile.currency) || CURRENCIES[0];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'statistics', label: 'Statistics', icon: PieChart },
    { id: 'insights', label: 'Financial Advisor', icon: BrainCircuit },
    { id: 'profiles', label: 'Profiles & Wallets', icon: Users },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/20 shrink-0 relative group">
              <TrendingUp size={20} className="stroke-[2.4]" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                FinTrack
              </span>
              <span className="ml-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                Pro
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close Sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Active Profile Switcher */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left flex items-center justify-between gap-2"
              title={`Active Wallet: ${activeProfile.name} (${currency.code})`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${activeProfile.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0`}>
                  {activeProfile.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {activeProfile.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {currency.name} ({currency.code})
                  </div>
                </div>
              </div>
              <ChevronDown size={14} className="text-slate-400 shrink-0" />
            </button>

            {profileDropdownOpen && (
              <div
                className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <div className="px-3 py-1 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Switch Wallet / Profile</p>
                </div>
                <div className="py-1 max-h-48 overflow-y-auto">
                  {user.profiles.map((prof) => (
                    <button
                      key={prof.id}
                      onClick={() => {
                        onSwitchProfile(prof.id);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 flex items-center justify-between text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors ${
                        prof.id === activeProfile.id ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={`w-5 h-5 rounded bg-gradient-to-br ${prof.avatarColor} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
                          {prof.name.charAt(0)}
                        </div>
                        <span className="truncate">{prof.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{prof.currency}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700 pt-1">
                  <button
                    onClick={() => {
                      setActiveTab('profiles');
                      setProfileDropdownOpen(false);
                      onClose();
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold flex items-center gap-1.5"
                  >
                    <Users size={13} />
                    Manage All Profiles
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="p-3 space-y-2 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <p className="text-[10px] uppercase font-bold text-slate-400 px-1">Quick Actions</p>
          <div className="grid grid-cols-1 gap-1.5">
            {onOpenSmartEntry && (
              <button
                id="btn-sidebar-smart-entry"
                onClick={() => {
                  onOpenSmartEntry();
                  onClose();
                }}
                className="w-full h-9 px-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all flex items-center gap-2"
              >
                <BrainCircuit size={15} />
                <span>Smart Entry</span>
              </button>
            )}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                id="btn-sidebar-scan-receipt"
                onClick={() => {
                  onOpenScanReceipt();
                  onClose();
                }}
                className="h-9 px-2.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Camera size={14} />
                <span>Scan Receipt</span>
              </button>
              <button
                id="btn-sidebar-add-tx"
                onClick={() => {
                  onOpenAddTransaction();
                  onClose();
                }}
                className="h-9 px-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add Record</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Navigation Menu Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] uppercase font-bold text-slate-400 px-2 pb-1">Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={17} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-md font-extrabold uppercase">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Utility Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 space-y-2">
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={onToggleTheme}
              className="flex-1 h-9 px-2 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              {isDark ? (
                <>
                  <Sun size={15} className="text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={15} className="text-slate-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            <button
              onClick={onLogout}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
          <div className="text-[10px] text-center text-slate-400 font-mono">
            {user.username} • {user.email || 'Local Vault'}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
