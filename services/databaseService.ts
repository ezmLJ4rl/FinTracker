import { Transaction, Receipt, User, CategoryItem, Profile } from '../types';
import { STORAGE_DB_NAME, STORES, DEFAULT_CATEGORIES, INITIAL_PROFILES, INITIAL_USER } from '../constants';

export interface FullBackupData {
  version: number;
  exportedAt: string;
  app: string;
  users: User[];
  transactions: Transaction[];
  receipts: Receipt[];
  categories: CategoryItem[];
  profiles: Profile[];
}

class DatabaseService {
  private dbName: string;
  private version: number;

  constructor() {
    this.dbName = STORAGE_DB_NAME;
    this.version = 3;
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.RECEIPTS)) {
          db.createObjectStore(STORES.RECEIPTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.USERS)) {
          db.createObjectStore(STORES.USERS, { keyPath: 'username' });
        }
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.PROFILES)) {
          db.createObjectStore(STORES.PROFILES, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  // --- Generic Helpers ---

  private async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async put<T>(storeName: string, value: T): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async delete(storeName: string, key: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async clear(storeName: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Transactions ---

  async getTransactions(username?: string, profileId?: string): Promise<Transaction[]> {
    const all = await this.getAll<Transaction>(STORES.TRANSACTIONS);
    if (!username) {
      if (profileId) {
        return all.filter((t) => t.profileId === profileId);
      }
      return all;
    }
    return all.filter((t) => {
      if (t.userId !== username && t.userId !== 'usr-default' && t.userId !== 'Alex Mhando') {
        if (t.userId !== username) return false;
      }
      if (profileId && t.profileId && t.profileId !== profileId) return false;
      return true;
    });
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    await this.put(STORES.TRANSACTIONS, transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.delete(STORES.TRANSACTIONS, id);
  }

  // --- Receipts ---

  async getReceipt(id: string): Promise<Receipt | undefined> {
    return this.get<Receipt>(STORES.RECEIPTS, id);
  }

  async saveReceipt(receipt: Receipt): Promise<void> {
    await this.put(STORES.RECEIPTS, receipt);
  }

  async deleteReceipt(id: string): Promise<void> {
    await this.delete(STORES.RECEIPTS, id);
  }

  // --- Users ---

  async getUser(username?: string): Promise<User | undefined> {
    if (username) {
      const u = await this.get<User>(STORES.USERS, username);
      if (u) return u;
      // Also search by email or id
      const all = await this.getAll<User>(STORES.USERS);
      return all.find(
        (user) =>
          user.username.toLowerCase() === username.toLowerCase() ||
          user.email.toLowerCase() === username.toLowerCase() ||
          user.id === username
      );
    }

    // Default current session lookup
    const sessionUser = sessionStorage.getItem('fintrack_current_user') || localStorage.getItem('fintrack_current_user');
    if (sessionUser) {
      const u = await this.getUser(sessionUser);
      if (u) return u;
    }

    const allUsers = await this.getAll<User>(STORES.USERS);
    if (allUsers.length > 0) {
      return allUsers[0];
    }

    return INITIAL_USER;
  }

  async getAllUsers(): Promise<User[]> {
    return this.getAll<User>(STORES.USERS);
  }

  async saveUser(user: User): Promise<void> {
    await this.put(STORES.USERS, user);
  }

  async resetPassword(identifier: string, newHashedPassword: string): Promise<boolean> {
    const all = await this.getAll<User>(STORES.USERS);
    const target = all.find(
      (u) =>
        u.email.toLowerCase() === identifier.toLowerCase() ||
        u.username.toLowerCase() === identifier.toLowerCase()
    );

    if (target) {
      target.password = newHashedPassword;
      await this.saveUser(target);
      return true;
    }
    return false;
  }

  // --- Categories ---

  async getCategories(username?: string): Promise<CategoryItem[]> {
    const all = await this.getAll<CategoryItem>(STORES.CATEGORIES);
    if (all.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await this.put(STORES.CATEGORIES, cat);
      }
      return DEFAULT_CATEGORIES;
    }
    return all;
  }

  async saveCategory(category: CategoryItem): Promise<void> {
    await this.put(STORES.CATEGORIES, category);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.delete(STORES.CATEGORIES, id);
  }

  // --- Backup & Restore ---

  async exportFullBackup(): Promise<FullBackupData> {
    const users = await this.getAll<User>(STORES.USERS);
    const transactions = await this.getAll<Transaction>(STORES.TRANSACTIONS);
    const receipts = await this.getAll<Receipt>(STORES.RECEIPTS);
    const categories = await this.getAll<CategoryItem>(STORES.CATEGORIES);
    const profiles = await this.getAll<Profile>(STORES.PROFILES);

    return {
      version: 1,
      app: 'FinTrack Pro IFM Capstone',
      exportedAt: new Date().toISOString(),
      users: users.length > 0 ? users : [INITIAL_USER],
      transactions,
      receipts,
      categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES,
      profiles: profiles.length > 0 ? profiles : INITIAL_PROFILES,
    };
  }

  async importFullBackup(backupData: FullBackupData): Promise<boolean> {
    if (!backupData || !Array.isArray(backupData.transactions)) {
      throw new Error('Invalid backup file format.');
    }

    await this.clearAllData();

    if (Array.isArray(backupData.users)) {
      for (const u of backupData.users) {
        await this.put(STORES.USERS, u);
      }
    }
    if (Array.isArray(backupData.transactions)) {
      for (const t of backupData.transactions) {
        await this.put(STORES.TRANSACTIONS, t);
      }
    }
    if (Array.isArray(backupData.receipts)) {
      for (const r of backupData.receipts) {
        await this.put(STORES.RECEIPTS, r);
      }
    }
    if (Array.isArray(backupData.categories)) {
      for (const c of backupData.categories) {
        await this.put(STORES.CATEGORIES, c);
      }
    }
    if (Array.isArray(backupData.profiles)) {
      for (const p of backupData.profiles) {
        await this.put(STORES.PROFILES, p);
      }
    }

    return true;
  }

  // --- Reset & Seeding ---

  async seedDemoDataIfEmpty(user?: User): Promise<void> {
    const activeUser = user || INITIAL_USER;
    
    // Ensure default user exists
    const existingUser = await this.getUser(activeUser.username);
    if (!existingUser) {
      await this.saveUser(activeUser);
    }

    // Ensure categories exist
    const cats = await this.getAll<CategoryItem>(STORES.CATEGORIES);
    if (cats.length === 0) {
      for (const c of DEFAULT_CATEGORIES) {
        await this.put(STORES.CATEGORIES, c);
      }
    }

    // Ensure demo transactions exist
    const existing = await this.getTransactions(activeUser.username);
    if (existing.length > 0) return;

    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const getDate = (daysAgo: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const isTsh = activeUser.settings.currency === 'TZS';
    const mult = isTsh ? 1 : 1 / 2600;

    const demoTx: Omit<Transaction, 'id' | 'createdAt'>[] = [
      // Income
      {
        userId: activeUser.username,
        profileId: 'prof-main',
        name: 'Ministry of IT / Monthly Salary',
        amount: Math.round(2500000 * mult),
        date: getDate(2),
        category: 'Monthly Salary',
        type: 'income',
        paymentMethod: 'Bank Transfer / NMB / CRDB',
        isFixedCost: false,
        notes: 'Monthly net direct deposit after PAYE tax',
      },
      {
        userId: activeUser.username,
        profileId: 'prof-main',
        name: 'Web Design Project Freelance',
        amount: Math.round(850000 * mult),
        date: getDate(12),
        category: 'Freelance & Projects',
        type: 'income',
        paymentMethod: 'M-Pesa / Vodacom',
        isFixedCost: false,
      },
      // Fixed Expenses
      {
        userId: activeUser.username,
        profileId: 'prof-main',
        name: 'Apartment Monthly Rent (Mikocheni B)',
        amount: Math.round(450000 * mult),
        date: getDate(5),
        category: 'Rent & Housing',
        type: 'expense',
        paymentMethod: 'M-Pesa / Vodacom',
        isFixedCost: true,
      },
      {
        userId: activeUser.username,
        profileId: 'prof-main',
        name: 'TANESCO LUKU Electricity Token',
        amount: Math.round(75000 * mult),
        date: getDate(8),
        category: 'Utilities (LUKU & Water)',
        type: 'expense',
        paymentMethod: 'M-Pesa / Vodacom',
        isFixedCost: true,
      },
      {
        userId: activeUser.username,
        profileId: 'prof-main',
        name: 'Fibre Internet 50Mbps Monthly',
        amount: Math.round(65000 * mult),
        date: getDate(14),
        category: 'Internet & Subscriptions',
        type: 'expense',
        paymentMethod: 'Tigo Pesa / Airtel Money',
        isFixedCost: true,
      },
      // Variable Expenses
      {
        userId: activeUser.username,
        profileId: 'prof-main',
        name: 'Shoppers Supermarket Mlimani City',
        amount: Math.round(184500 * mult),
        date: getDate(1),
        category: 'Shopping & Groceries',
        type: 'expense',
        paymentMethod: 'Bank Card / Visa / MC',
        isFixedCost: false,
        notes: 'Monthly pantry restock, olive oil, toiletries',
      },
      {
        userId: activeUser.username,
        profileId: 'prof-main',
        name: 'Samaki Samaki Restaurant & Seafood',
        amount: Math.round(68000 * mult),
        date: getDate(3),
        category: 'Food & Dining',
        type: 'expense',
        paymentMethod: 'M-Pesa / Vodacom',
        isFixedCost: false,
      },
      {
        userId: activeUser.username,
        profileId: 'prof-main',
        name: 'TotalEnergies Fuel Station Masaki',
        amount: Math.round(110000 * mult),
        date: getDate(6),
        category: 'Transport & Fuel',
        type: 'expense',
        paymentMethod: 'Cash',
        isFixedCost: false,
      },
      {
        userId: activeUser.username,
        profileId: 'prof-main',
        name: 'Aga Khan Pharmacy Prescription',
        amount: Math.round(42000 * mult),
        date: getDate(10),
        category: 'Healthcare & Meds',
        type: 'expense',
        paymentMethod: 'Bank Card / Visa / MC',
        isFixedCost: false,
      },
      {
        userId: activeUser.username,
        profileId: 'prof-main',
        name: 'Uber / Bolt Rides Commute',
        amount: Math.round(38000 * mult),
        date: getDate(13),
        category: 'Transport & Fuel',
        type: 'expense',
        paymentMethod: 'M-Pesa / Vodacom',
        isFixedCost: false,
      },
      // BNPL Installment
      {
        userId: activeUser.username,
        profileId: 'prof-main',
        name: 'Samsung TV 4K Installment (Lipa Baadaye 2/4)',
        amount: Math.round(120000 * mult),
        date: getDate(4),
        category: 'BNPL / Installment Loans',
        type: 'bnpl',
        paymentMethod: 'BNPL / Lipa Baadaye',
        isFixedCost: true,
        notes: '2nd installment of 4; remaining balance 240,000 TZS',
      },
      // Historical previous month
      {
        userId: activeUser.username,
        profileId: 'prof-main',
        name: 'Previous Month Salary',
        amount: Math.round(2500000 * mult),
        date: getDate(35),
        category: 'Monthly Salary',
        type: 'income',
        paymentMethod: 'Bank Transfer / NMB / CRDB',
      },
      {
        userId: activeUser.username,
        profileId: 'prof-main',
        name: 'Previous Month Rent',
        amount: Math.round(450000 * mult),
        date: getDate(36),
        category: 'Rent & Housing',
        type: 'expense',
        paymentMethod: 'M-Pesa / Vodacom',
        isFixedCost: true,
      },
      // Business Profile Tx
      {
        userId: activeUser.username,
        profileId: 'prof-biz',
        name: 'Fintech Mobile App Retainer Client',
        amount: Math.round(3500000 * mult),
        date: getDate(7),
        category: 'Business Revenue',
        type: 'income',
        paymentMethod: 'Bank Transfer / NMB / CRDB',
      },
      {
        userId: activeUser.username,
        profileId: 'prof-biz',
        name: 'AWS Cloud Hosting & Domain SSL',
        amount: Math.round(180000 * mult),
        date: getDate(9),
        category: 'Internet & Subscriptions',
        type: 'expense',
        paymentMethod: 'Bank Card / Visa / MC',
        isFixedCost: true,
      },
    ];

    for (let i = 0; i < demoTx.length; i++) {
      const item = demoTx[i];
      await this.saveTransaction({
        id: `tx-demo-${Date.now()}-${i}`,
        createdAt: new Date().toISOString(),
        ...item,
      });
    }
  }

  async clearAllData(): Promise<void> {
    await this.clear(STORES.TRANSACTIONS);
    await this.clear(STORES.RECEIPTS);
    await this.clear(STORES.USERS);
    await this.clear(STORES.CATEGORIES);
    await this.clear(STORES.PROFILES);
  }

  async clearAllDataForUser(username: string): Promise<void> {
    const allTx = await this.getAll<Transaction>(STORES.TRANSACTIONS);
    const userTx = allTx.filter((t) => t.userId === username);
    for (const tx of userTx) {
      await this.delete(STORES.TRANSACTIONS, tx.id);
      if (tx.receiptId) {
        await this.delete(STORES.RECEIPTS, tx.receiptId);
      }
    }
  }
}

export const dbService = new DatabaseService();
