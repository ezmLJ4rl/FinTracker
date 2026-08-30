import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  Profile,
  Transaction,
  CategoryItem,
  UserSettings,
  Receipt,
  OCRResult,
} from './types';
import { dbService } from './services/databaseService';
import { computeDashboardStats } from './utils/financeUtils';
import { CURRENCIES, INITIAL_USER, DEFAULT_CATEGORIES, INITIAL_PROFILES } from './constants';

import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import StatisticsView from './components/StatisticsView';
import InsightsView from './components/InsightsView';
import ProfilesView from './components/ProfilesView';
import CategoriesView from './components/CategoriesView';
import SettingsView from './components/SettingsView';

import ReceiptScannerModal from './components/ReceiptScannerModal';
import TransactionFormModal from './components/TransactionFormModal';
import SmartEntryModal from './components/SmartEntryModal';
import ReceiptViewerModal from './components/ReceiptViewerModal';
import TutorialModal from './components/TutorialModal';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState<boolean>(false);

  // Modals state
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSmartEntryModalOpen, setIsSmartEntryModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initial Data & Session Bootstrapping
  const bootstrapSession = useCallback(async () => {
    try {
      setLoading(true);
      const savedUserKey =
        sessionStorage.getItem('fintrack_current_user') ||
        localStorage.getItem('fintrack_current_user');

      if (savedUserKey) {
        const foundUser = await dbService.getUser(savedUserKey);
        if (foundUser) {
          setUser(foundUser);
          const userCats = await dbService.getCategories(foundUser.username);
          const userTx = await dbService.getTransactions(foundUser.username);
          setCategories(userCats);
          setTransactions(userTx);
          setIsDark(foundUser.settings?.theme === 'dark' || foundUser.settings?.darkMode === true);
        }
      }
    } catch (err) {
      console.error('Error during session bootstrap:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  // Sync Dark Mode with document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Handle User Login from Auth Component
  const handleUserLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsDark(loggedInUser.settings?.theme === 'dark' || loggedInUser.settings?.darkMode === true);
    const userCats = await dbService.getCategories(loggedInUser.username);
    const userTx = await dbService.getTransactions(loggedInUser.username);
    setCategories(userCats);
    setTransactions(userTx);
    setActiveTab('dashboard');
  };

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem('fintrack_current_user');
    localStorage.removeItem('fintrack_current_user');
    setUser(null);
    setTransactions([]);
  };

  // Toggle Theme
  const handleToggleTheme = async () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (user) {
      const updatedUser: User = {
        ...user,
        settings: {
          ...user.settings,
          theme: nextDark ? 'dark' : 'light',
          darkMode: nextDark,
        },
      };
      await dbService.saveUser(updatedUser);
      setUser(updatedUser);
    }
  };

  // Active Profile Resolution
  const activeProfile: Profile = useMemo(() => {
    if (!user || !user.profiles || user.profiles.length === 0) {
      return INITIAL_PROFILES[0];
    }
    return (
      user.profiles.find((p) => p.id === user.activeProfileId) ||
      user.profiles[0]
    );
  }, [user]);

  // Currency Symbol
  const currencySymbol = useMemo(() => {
    if (!user) return 'TZS';
    const found = CURRENCIES.find((c) => c.code === activeProfile.currency || c.code === user.settings.currency);
    return found ? found.symbol : 'TZS';
  }, [user, activeProfile]);

  // Filter transactions for active profile
  const profileTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.profileId === activeProfile.id || (!t.profileId && activeProfile.id === 'prof-main')
    );
  }, [transactions, activeProfile.id]);

  // Compute Live Statistics & Efficiency Score
  const dashboardStats = useMemo(() => {
    return computeDashboardStats(profileTransactions, activeProfile);
  }, [profileTransactions, activeProfile]);

  // Profile Switching
  const handleSwitchProfile = async (profileId: string) => {
    if (!user) return;
    const updatedUser: User = { ...user, activeProfileId: profileId };
    await dbService.saveUser(updatedUser);
    setUser(updatedUser);
  };

  // Create Profile
  const handleCreateProfile = async (newProf: Omit<Profile, 'id' | 'createdAt'>) => {
    if (!user) return;
    const profile: Profile = {
      ...newProf,
      id: `prof-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedProfiles = [...user.profiles, profile];
    const updatedUser: User = { ...user, profiles: updatedProfiles, activeProfileId: profile.id };
    await dbService.saveUser(updatedUser);
    setUser(updatedUser);
  };

  // Save / Update Transaction
  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id' | 'createdAt' | 'userId' | 'profileId'>,
    receiptData?: { name: string; type: string; dataUrl: string }
  ) => {
    if (!user) return;
    let receiptId = txData.receiptId;

    if (receiptData) {
      const newReceipt: Receipt = {
        id: `rec-${Date.now()}`,
        userId: user.username,
        name: receiptData.name,
        type: receiptData.type,
        dataUrl: receiptData.dataUrl,
        createdAt: new Date().toISOString(),
      };
      await dbService.saveReceipt(newReceipt);
      receiptId = newReceipt.id;
    }

    const tx: Transaction = {
      ...txData,
      id: editingTransaction ? editingTransaction.id : `tx-${Date.now()}`,
      userId: user.username,
      profileId: activeProfile.id,
      receiptId,
      createdAt: editingTransaction ? editingTransaction.createdAt : new Date().toISOString(),
    };

    await dbService.saveTransaction(tx);
    const refreshedTx = await dbService.getTransactions(user.username);
    setTransactions(refreshedTx);
    setEditingTransaction(undefined);
    setIsFormModalOpen(false);
  };

  // Receipt Scanner Save Callback
  const handleSaveScannedReceipt = async (
    data: {
      name: string;
      amount: number;
      date: string;
      category: string;
      type: 'expense' | 'bnpl';
      paymentMethod: string;
      isFixedCost: boolean;
      notes: string;
    },
    receiptData?: { name: string; type: string; dataUrl: string }
  ) => {
    if (!user) return;
    let receiptId: string | undefined = undefined;

    if (receiptData) {
      const newReceipt: Receipt = {
        id: `rec-${Date.now()}`,
        userId: user.username,
        name: receiptData.name,
        type: receiptData.type,
        dataUrl: receiptData.dataUrl,
        createdAt: new Date().toISOString(),
      };
      await dbService.saveReceipt(newReceipt);
      receiptId = newReceipt.id;
    }

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: user.username,
      profileId: activeProfile.id,
      name: data.name,
      amount: data.amount,
      date: data.date,
      category: data.category,
      type: data.type,
      paymentMethod: data.paymentMethod,
      isFixedCost: data.isFixedCost,
      notes: data.notes,
      receiptId,
      createdAt: new Date().toISOString(),
    };

    await dbService.saveTransaction(tx);
    const refreshedTx = await dbService.getTransactions(user.username);
    setTransactions(refreshedTx);
    setIsScanModalOpen(false);
  };

  // Smart Words / Natural Language Bulk Save Callback
  const handleSaveSmartTransactions = async (
    parsedList: Array<{
      name: string;
      amount: number;
      date: string;
      category: string;
      type: 'income' | 'expense' | 'bnpl';
      paymentMethod: string;
      isFixedCost: boolean;
      notes: string;
    }>
  ) => {
    if (!user) return;
    const now = new Date().toISOString();
    for (let i = 0; i < parsedList.length; i++) {
      const item = parsedList[i];
      const tx: Transaction = {
        id: `tx-${Date.now()}-${i}`,
        userId: user.username,
        profileId: activeProfile.id,
        name: item.name,
        amount: item.amount,
        date: item.date || new Date().toISOString().split('T')[0],
        category: item.category,
        type: item.type,
        paymentMethod: item.paymentMethod || 'Cash',
        isFixedCost: item.type === 'income' ? false : !!item.isFixedCost,
        notes: item.notes || '',
        createdAt: now,
      };
      await dbService.saveTransaction(tx);
    }
    const refreshedTx = await dbService.getTransactions(user.username);
    setTransactions(refreshedTx);
    setIsSmartEntryModalOpen(false);
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    await dbService.deleteTransaction(id);
    const refreshedTx = await dbService.getTransactions(user.username);
    setTransactions(refreshedTx);
  };

  // View Receipt Modal
  const handleViewReceipt = async (receiptId: string) => {
    const r = await dbService.getReceipt(receiptId);
    if (r) {
      setViewingReceipt(r);
    }
  };

  // Update Settings
  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      settings: { ...user.settings, ...newSettings },
    };
    await dbService.saveUser(updatedUser);
    setUser(updatedUser);
    if (newSettings.theme) {
      setIsDark(newSettings.theme === 'dark');
    }
  };

  // Update Profile Budget
  const handleUpdateProfileBudget = async (newBudget: number) => {
    if (!user) return;
    const updatedProfiles = user.profiles.map((p) =>
      p.id === activeProfile.id ? { ...p, monthlyBudget: newBudget } : p
    );
    const updatedUser: User = { ...user, profiles: updatedProfiles };
    await dbService.saveUser(updatedUser);
    setUser(updatedUser);
  };

  // Save Custom Category
  const handleSaveCategory = async (cat: CategoryItem) => {
    if (!user) return;
    await dbService.saveCategory(cat);
    const cats = await dbService.getCategories(user.username);
    setCategories(cats);
  };

  // Delete Custom Category
  const handleDeleteCategory = async (id: string) => {
    if (!user) return;
    await dbService.deleteCategory(id);
    const cats = await dbService.getCategories(user.username);
    setCategories(cats);
  };

  // Reset Demo Data
  const handleResetDemoData = async () => {
    if (!user) return;
    if (confirm('Reset FinTrack Pro with standard sample demo records?')) {
      await dbService.clearAllDataForUser(user.username);
      await dbService.seedDemoDataIfEmpty(user);
      const userTx = await dbService.getTransactions(user.username);
      setTransactions(userTx);
    }
  };

  // Clear All Data
  const handleClearAllData = async () => {
    if (confirm('Permanently erase all local transactions, categories, and profiles?')) {
      await dbService.clearAllData();
      sessionStorage.clear();
      localStorage.clear();
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 animate-pulse flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-600/30">
          FP
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold">FinTrack Pro</h2>
          <p className="text-xs text-slate-400">Loading encrypted local vault...</p>
        </div>
      </div>
    );
  }

  // If no user is authenticated, render the Auth system (Splash, Login, Register, Forgot Password)
  if (!user) {
    return <Auth onLogin={handleUserLogin} />;
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        activeProfile={activeProfile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        onOpenScanReceipt={() => setIsScanModalOpen(true)}
        onOpenAddTransaction={() => {
          setEditingTransaction(undefined);
          setIsFormModalOpen(true);
        }}
        onOpenSmartEntry={() => setIsSmartEntryModalOpen(true)}
        onSwitchProfile={handleSwitchProfile}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Layout Area offset by Sidebar width on desktop */}
      <div className="flex-1 flex flex-col lg:pl-64 w-full min-w-0 transition-all duration-300">
        {/* Top Application Navbar */}
        <Navbar
          user={user}
          activeProfile={activeProfile}
          activeTab={activeTab}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          onLogout={handleLogout}
          onSwitchProfile={handleSwitchProfile}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNavigateTab={setActiveTab}
        />

        {/* Main App Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            user={user}
            profile={activeProfile}
            transactions={profileTransactions}
            stats={dashboardStats}
            currencySymbol={currencySymbol}
            onOpenScanReceipt={() => setIsScanModalOpen(true)}
            onOpenAddTransaction={() => {
              setEditingTransaction(undefined);
              setIsFormModalOpen(true);
            }}
            onOpenSmartEntry={() => setIsSmartEntryModalOpen(true)}
            onNavigateTab={setActiveTab}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            user={user}
            profile={activeProfile}
            transactions={profileTransactions}
            categories={categories}
            stats={dashboardStats}
            currencySymbol={currencySymbol}
            onOpenScanReceipt={() => setIsScanModalOpen(true)}
            onOpenAddTransaction={() => {
              setEditingTransaction(undefined);
              setIsFormModalOpen(true);
            }}
            onOpenSmartEntry={() => setIsSmartEntryModalOpen(true)}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsFormModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'statistics' && (
          <StatisticsView
            transactions={profileTransactions}
            categories={categories}
            profile={activeProfile}
            stats={dashboardStats}
            currencySymbol={currencySymbol}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsView
            profile={activeProfile}
            transactions={profileTransactions}
            stats={dashboardStats}
            currencySymbol={currencySymbol}
          />
        )}

        {activeTab === 'profiles' && (
          <ProfilesView
            user={user}
            activeProfile={activeProfile}
            transactions={transactions}
            onSwitchProfile={handleSwitchProfile}
            onCreateProfile={handleCreateProfile}
            currencySymbol={currencySymbol}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesView
            categories={categories}
            currencySymbol={currencySymbol}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            user={user}
            profile={activeProfile}
            currencySymbol={currencySymbol}
            onUpdateSettings={handleUpdateSettings}
            onUpdateProfileBudget={handleUpdateProfileBudget}
            onOpenTutorial={() => setIsTutorialOpen(true)}
            onResetDemoData={handleResetDemoData}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>

      {/* Global Modals */}
      {/* 1. Smart OCR Receipt Scanner */}
      <ReceiptScannerModal
        isOpen={isScanModalOpen}
        categories={categories}
        currencySymbol={currencySymbol}
        onSaveScannedTransaction={handleSaveScannedReceipt}
        onClose={() => setIsScanModalOpen(false)}
      />

      {/* 2. Smart Natural Language Bulk Words Entry Modal */}
      <SmartEntryModal
        isOpen={isSmartEntryModalOpen}
        categories={categories}
        currencySymbol={currencySymbol}
        onSaveTransactions={handleSaveSmartTransactions}
        onClose={() => setIsSmartEntryModalOpen(false)}
      />

      {/* 3. Transaction Add/Edit Form Modal */}
      <TransactionFormModal
        isOpen={isFormModalOpen}
        initialData={editingTransaction}
        categories={categories}
        currencySymbol={currencySymbol}
        onSave={handleSaveTransaction}
        onOpenSmartEntry={() => {
          setIsFormModalOpen(false);
          setIsSmartEntryModalOpen(true);
        }}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTransaction(undefined);
        }}
      />

      {/* 4. Receipt Viewer Modal */}
      <ReceiptViewerModal
        receipt={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
      />

      {/* 5. Academic Guided Tour Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
      </div>
    </div>
  );
}

export default App;
