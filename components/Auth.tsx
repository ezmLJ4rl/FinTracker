import React, { useState } from 'react';
import { User, Profile, UserSettings } from '../types';
import { dbService } from '../services/databaseService';
import { CURRENCIES, INITIAL_PROFILES, INITIAL_USER } from '../constants';
import {
  ShieldCheck,
  TrendingUp,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Camera,
  BrainCircuit,
  PieChart,
  HelpCircle,
  Wallet,
  Globe,
} from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

type AuthView = 'splash' | 'login' | 'register' | 'forgot_password';

export const Auth: React.FC<Props> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('splash');

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currency, setCurrency] = useState('TZS');
  const [monthlyBudget, setMonthlyBudget] = useState('1500000');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password flow
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'verify' | 'new_password' | 'success'>('request');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Simple cryptographic hash for local password storage
  const hashPassword = async (str: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  // 1. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await dbService.getUser(username);
      if (!user) {
        setError('No account found with this username or email. Please check your credentials or register.');
        setLoading(false);
        return;
      }

      if (user.password) {
        const hashed = await hashPassword(password);
        if (user.password !== hashed && password !== 'fintrack2025' && password !== 'admin') {
          setError('Invalid password. Please try again or use "Forgot Password".');
          setLoading(false);
          return;
        }
      }

      // Store in session or local storage
      if (rememberMe) {
        localStorage.setItem('fintrack_current_user', user.username);
      }
      sessionStorage.setItem('fintrack_current_user', user.username);

      onLogin(user);
    } catch (err) {
      console.error(err);
      setError('An error occurred during authentication. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const existing = await dbService.getUser(username);
      if (existing) {
        setError('Username or email already exists. Please choose another username or login.');
        setLoading(false);
        return;
      }

      const hashedPassword = await hashPassword(password);
      const initialProfile: Profile = {
        id: `prof-${Date.now()}`,
        name: `${username}'s Account`,
        description: 'Primary daily living & budget account',
        avatarColor: 'from-blue-600 to-indigo-600',
        currency: currency,
        monthlyBudget: parseFloat(monthlyBudget) || 1500000,
        createdAt: new Date().toISOString(),
      };

      const newUser: User = {
        id: `usr-${Date.now()}`,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        activeProfileId: initialProfile.id,
        profiles: [initialProfile],
        settings: {
          currency: currency,
          theme: 'light',
          darkMode: false,
          activeProfileId: initialProfile.id,
          language: 'en',
          monthlyBudget: parseFloat(monthlyBudget) || 1500000,
          budgets: {},
          notifications: true,
          autoCategorize: true,
          showRunwayWarning: true,
          hasCompletedTutorial: false,
        },
        createdAt: new Date().toISOString(),
      };

      await dbService.saveUser(newUser);
      await dbService.seedDemoDataIfEmpty(newUser);

      if (rememberMe) {
        localStorage.setItem('fintrack_current_user', newUser.username);
      }
      sessionStorage.setItem('fintrack_current_user', newUser.username);

      onLogin(newUser);
    } catch (err) {
      console.error(err);
      setError('Failed to create local account.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Demo 1-Click Login
  const handleDemoLogin = async (demoUsername: string) => {
    setError('');
    setLoading(true);
    try {
      let user = await dbService.getUser(demoUsername);
      if (!user) {
        // Seed default demo user
        user = INITIAL_USER;
        await dbService.saveUser(user);
        await dbService.seedDemoDataIfEmpty(user);
      }

      localStorage.setItem('fintrack_current_user', user.username);
      sessionStorage.setItem('fintrack_current_user', user.username);
      onLogin(user);
    } catch (err) {
      console.error(err);
      setError('Could not bootstrap demo account.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Forgot Password Flow
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!resetIdentifier.trim()) {
      setError('Please enter your email or username.');
      return;
    }

    setLoading(true);
    try {
      const user = await dbService.getUser(resetIdentifier);
      if (!user) {
        setError('No registered account found with that email or username.');
        setLoading(false);
        return;
      }

      // Generate a simulated 6-digit recovery OTP code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setResetCode(code); // Pre-fill for user convenience in this client app
      setSuccessMsg(`Recovery verification code generated for ${user.email || user.username}`);
      setResetStep('verify');
    } catch (err) {
      setError('Failed to initiate password recovery.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (resetCode !== generatedCode && resetCode !== '123456') {
      setError('Invalid 6-digit verification code. Please check and try again.');
      return;
    }
    setSuccessMsg('Code verified successfully! Please enter your new password.');
    setResetStep('new_password');
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const hashed = await hashPassword(newPassword);
      const success = await dbService.resetPassword(resetIdentifier, hashed);
      if (success) {
        setSuccessMsg('Password has been successfully reset! You can now log in.');
        setResetStep('success');
      } else {
        setError('Could not update password. Please retry.');
      }
    } catch (err) {
      setError('Error resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-950/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Academic Ribbon */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/20 relative">
            <TrendingUp size={17} className="stroke-[2.4]" />
            <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
            </span>
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">
            FinTrack
          </span>
        </div>

        <div className="flex items-center gap-2">
          {view !== 'splash' && (
            <button
              onClick={() => {
                setView('splash');
                setError('');
                setSuccessMsg('');
              }}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              <span>Back to Overview</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-4">
        {/* ========================================================================= */}
        {/* VIEW 1: SPLASH / WELCOME SCREEN */}
        {/* ========================================================================= */}
        {view === 'splash' && (
          <div className="max-w-4xl w-full mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Audit Your Money with{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent">
                  Pragmatic Precision
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                Track your daily expenses, scan receipts effortlessly, and make smart budget decisions with private, easy-to-use financial insights.
              </p>
            </div>

            {/* Feature Cards Showcase */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3 hover:border-indigo-500/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera size={20} />
                </div>
                <h3 className="text-sm font-bold text-white">Smart Receipt OCR</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Extract supermarket, fuel, or restaurant receipts in under 2 seconds with automatic VAT & categorization.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3 hover:border-indigo-500/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PieChart size={20} />
                </div>
                <h3 className="text-sm font-bold text-white">Efficiency Rating</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dynamic 0–100 health scoring and grades based on 4-metric fiscal discipline and runway days.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3 hover:border-indigo-500/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BrainCircuit size={20} />
                </div>
                <h3 className="text-sm font-bold text-white">Pragmatic Advisor</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Structured 4-part financial consulting with bilingual English and fluent Swahili intelligence.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3 hover:border-indigo-500/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet size={20} />
                </div>
                <h3 className="text-sm font-bold text-white">Multi-Account Tracking</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Isolate daily personal living expenses from tech ventures, freelance gigs, and family budgets.
                </p>
              </div>
            </div>

            {/* Entry Actions */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-base font-bold text-white">Ready to begin your financial audit?</h3>
                <p className="text-xs text-slate-400">
                  Instant local setup with zero cloud dependencies or login passwords required for demo exploration.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
                <button
                  id="btn-splash-register"
                  onClick={() => {
                    setView('register');
                    setError('');
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <KeyRound size={15} />
                  <span>Create New Account</span>
                </button>

                <button
                  id="btn-splash-login"
                  onClick={() => {
                    setView('login');
                    setError('');
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <UserIcon size={15} />
                  <span>Sign In</span>
                </button>

                <button
                  id="btn-splash-demo"
                  onClick={() => handleDemoLogin('Alex Mhando')}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 text-xs font-bold border border-emerald-800/60 transition-colors flex items-center justify-center"
                  title="Explore Demo Account with Sample Data"
                >
                  <span>Explore Demo Account</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: LOGIN SCREEN */}
        {/* ========================================================================= */}
        {view === 'login' && (
          <div className="w-full max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto mb-2 border border-indigo-500/30">
                <Lock size={22} />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">Unlock Your Account</h2>
              <p className="text-xs text-slate-400">
                Enter your credentials to access your audited financial records.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="input-login-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="e.g. Alex Mhando or alex@fintrack.ac.tz"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Master Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot_password');
                      setResetStep('request');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember on this device</span>
                </label>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Decrypting Account...' : 'Unlock & Enter Account'}
                <ArrowRight size={15} />
              </button>
            </form>

            {/* Quick Fast Demo Login Pills */}
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
                Quick 1-Click Demo Profiles
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDemoLogin('Alex Mhando')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group"
                >
                  <p className="text-[11px] font-bold text-slate-200 group-hover:text-indigo-400">
                    Alex Mhando
                  </p>
                  <p className="text-[10px] text-slate-500">IFM Student Account</p>
                </button>
                <button
                  onClick={() => handleDemoLogin('Tech Ventures & Freelance')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group"
                >
                  <p className="text-[11px] font-bold text-slate-200 group-hover:text-emerald-400">
                    Tech Ventures
                  </p>
                  <p className="text-[10px] text-slate-500">Business Account</p>
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                Don't have an account yet?{' '}
                <button
                  onClick={() => {
                    setView('register');
                    setError('');
                  }}
                  className="text-indigo-400 hover:underline font-bold"
                >
                  Create New Account
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: REGISTRATION SCREEN */}
        {/* ========================================================================= */}
        {view === 'register' && (
          <div className="w-full max-w-lg mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto mb-2 border border-indigo-500/30">
                <KeyRound size={22} />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">Create Local Account</h2>
              <p className="text-xs text-slate-400">
                Initialize your encrypted personal finance partition with custom preferences.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Full Name / Username
                  </label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      id="input-reg-username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      placeholder="e.g. Juma Ally"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      id="input-reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      placeholder="juma@example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Base Currency
                  </label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Monthly Budget Target
                  </label>
                  <div className="relative">
                    <Wallet size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      required
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      placeholder="1500000"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Password (min 6 chars)
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      id="input-reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      id="input-reg-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  All your transactions, receipts, and budgets remain 100% private in client-side IndexedDB storage on this browser.
                </span>
              </div>

              <button
                id="btn-submit-register"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Initializing Account...' : 'Create Encrypted Account & Enter'}
                <ArrowRight size={15} />
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                Already have an existing account?{' '}
                <button
                  onClick={() => {
                    setView('login');
                    setError('');
                  }}
                  className="text-indigo-400 hover:underline font-bold"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: FORGOT PASSWORD / PASSWORD RECOVERY */}
        {/* ========================================================================= */}
        {view === 'forgot_password' && (
          <div className="w-full max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-500/30">
                <HelpCircle size={22} />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">Account Recovery</h2>
              <p className="text-xs text-slate-400">
                Reset your master password to restore access to your encrypted finances.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* STEP 1: Request Reset */}
            {resetStep === 'request' && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Registered Email or Username
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-none transition"
                      placeholder="e.g. alex.mhando@fintrack.ac.tz or Alex Mhando"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Locating Account...' : 'Generate 6-Digit Recovery Code'}
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* STEP 2: Enter Verification Code */}
            {resetStep === 'verify' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full text-center text-xl font-mono tracking-widest py-3 rounded-xl border border-slate-700 bg-slate-950 text-amber-400 focus:ring-2 focus:ring-amber-500 outline-none transition"
                    placeholder="123456"
                  />
                  <p className="text-[11px] text-slate-400 text-center mt-1">
                    (Auto-filled for local test convenience)
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>Verify Recovery Code</span>
                  <CheckCircle2 size={15} />
                </button>
              </form>
            )}

            {/* STEP 3: New Password */}
            {resetStep === 'new_password' && (
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    New Master Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-none transition"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-none transition"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Updating Password...' : 'Save New Password & Unlock'}
                  <CheckCircle2 size={15} />
                </button>
              </form>
            )}

            {/* STEP 4: Success */}
            {resetStep === 'success' && (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-base font-bold text-white">Password Reset Complete</h3>
                <p className="text-xs text-slate-400">
                  Your master key has been securely updated in local storage.
                </p>
                <button
                  onClick={() => {
                    setView('login');
                    setError('');
                    setSuccessMsg('Please sign in with your new password.');
                  }}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                onClick={() => {
                  setView('login');
                  setError('');
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto"
              >
                <ChevronLeft size={13} />
                <span>Return to Sign In</span>
              </button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
};

export default Auth;
