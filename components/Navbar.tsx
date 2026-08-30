import React from 'react';
import { User, Profile } from '../types';
import { CURRENCIES } from '../constants';
import {
  Menu,
  TrendingUp,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Users
} from 'lucide-react';

interface Props {
  user: User;
  activeProfile: Profile;
  activeTab: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onSwitchProfile: (profileId: string) => void;
  onToggleSidebar: () => void;
  onNavigateTab: (tab: string) => void;
}

const Navbar: React.FC<Props> = ({
  user,
  activeProfile,
  activeTab,
  isDark,
  onToggleTheme,
  onLogout,
  onSwitchProfile,
  onToggleSidebar,
  onNavigateTab,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);
  const currency = CURRENCIES.find(c => c.code === activeProfile.currency) || CURRENCIES[0];

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'transactions': return 'Transactions Ledger';
      case 'statistics': return 'Analytics & Statistics';
      case 'insights': return 'Financial Advisor';
      case 'profiles': return 'Profiles & Wallets';
      case 'categories': return 'Budget Categories';
      case 'settings': return 'App Settings';
      default: return 'FinTrack Pro';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 h-16">
          {/* Left: Mobile Toggle & Brand / Breadcrumb */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="btn-toggle-sidebar"
              onClick={onToggleSidebar}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors lg:hidden"
              aria-label="Toggle Sidebar"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/20 shrink-0 lg:hidden">
                <TrendingUp size={17} className="stroke-[2.4]" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                  <span className="hidden sm:inline-block text-slate-400 font-normal">FinTrack /</span>
                  <span>{getTabTitle(activeTab)}</span>
                </h1>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Profile Dropdown */}
            <div className="relative inline-flex items-center shrink-0">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="h-9 px-2 sm:px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left inline-flex items-center gap-1.5 max-w-[130px] sm:max-w-[180px] shrink-0"
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
                  className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700">
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
                        onNavigateTab('profiles');
                        setProfileDropdownOpen(false);
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
      </div>
    </header>
  );
};

export default Navbar;
