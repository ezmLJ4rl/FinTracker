import React, { useState } from 'react';
import { User, Profile, UserSettings } from '../types';
import { ACADEMIC_DISCLAIMER } from '../constants';
import {
  Moon,
  Sun,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  GraduationCap,
  HelpCircle,
  CheckCircle2,
  Lock,
  Wallet,
} from 'lucide-react';
import { dbService } from '../services/databaseService';

interface Props {
  user: User;
  profile: Profile;
  currencySymbol: string;
  onUpdateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  onUpdateProfileBudget: (newBudget: number) => Promise<void>;
  onOpenTutorial: () => void;
  onResetDemoData: () => Promise<void>;
  onClearAllData: () => Promise<void>;
}

const SettingsView: React.FC<Props> = ({
  user,
  profile,
  currencySymbol,
  onUpdateSettings,
  onUpdateProfileBudget,
  onOpenTutorial,
  onResetDemoData,
  onClearAllData,
}) => {
  const [budget, setBudget] = useState(profile.monthlyBudget.toString());
  const [theme, setTheme] = useState(user.settings.theme);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(budget);
    if (!isNaN(val)) {
      await onUpdateProfileBudget(val);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleThemeToggle = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await onUpdateSettings({ theme: newTheme });
  };

  const handleExportBackup = async () => {
    const backup = await dbService.exportFullBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fintrack-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const json = JSON.parse(evt.target?.result as string);
          if (confirm('Importing this file will overwrite existing vault data. Continue?')) {
            await dbService.importFullBackup(json);
            window.location.reload();
          }
        } catch (err) {
          alert('Invalid backup JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            System Configuration
          </span>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            Preferences & Vault
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Settings & Local Security
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Profile Budget & Preferences */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet size={18} className="text-indigo-500" />
              Budget Target & Preferences
            </h3>
          </div>

          {/* Active Profile Monthly Budget */}
          <form onSubmit={handleSaveBudget} className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monthly Expenditure Target ({profile.name})
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono font-bold">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
              >
                Save Budget
              </button>
            </div>
            {savedSuccess && (
              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
                <CheckCircle2 size={13} />
                <span>Monthly budget target updated successfully!</span>
              </p>
            )}
          </form>

          {/* Theme Switcher */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Interface Color Scheme
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {theme === 'dark' ? 'Modern Obsidian Dark Mode' : 'Clean High-Contrast Light Mode'}
              </span>
            </div>
            <button
              onClick={handleThemeToggle}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs font-semibold"
            >
              {theme === 'dark' ? <Moon size={15} className="text-indigo-400" /> : <Sun size={15} className="text-amber-500" />}
              <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </div>

        {/* Local Security & Database Persistence */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Lock size={18} className="text-emerald-500" />
                Zero-Knowledge Local Storage
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>100% Client-Side Privacy</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                All transactions, profiles, receipt photos, and budget logs are securely stored directly in your browser's IndexedDB engine. No financial records leave your computer without explicit user export.
              </p>
            </div>

            {/* Backup & Restore Controls */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleExportBackup}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Download size={15} />
                <span>Export JSON Backup</span>
              </button>

              <label className="cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-2">
                <Upload size={15} />
                <span>Import Backup</span>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>
          </div>

          {/* Database Reset / Maintenance */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onResetDemoData}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Reset Demo Data</span>
              </button>

              <button
                onClick={onOpenTutorial}
                className="py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <HelpCircle size={13} />
                <span>Tour Walkthrough</span>
              </button>

              <button
                onClick={onClearAllData}
                className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Wipe All Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Attribution Footer Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/30">
            <GraduationCap size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight text-white">
              {ACADEMIC_DISCLAIMER.institution}
            </h4>
            <p className="text-xs text-indigo-300 font-semibold">
              {ACADEMIC_DISCLAIMER.faculty} • {ACADEMIC_DISCLAIMER.course} ({ACADEMIC_DISCLAIMER.year})
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supervised by {ACADEMIC_DISCLAIMER.supervisor} • Developed by {ACADEMIC_DISCLAIMER.authors.join(', ')}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-mono font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Final Capstone Architecture
          </span>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
