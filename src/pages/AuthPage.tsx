import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Zap, ShieldCheck, Lock, User, ArrowRight, CheckCircle2, Sun, Moon } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, signUp, loginAsAdmin, isConfigured } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const [emailOrUser, setEmailOrUser] = useState('rishi');
  const [password, setPassword] = useState('rishi24');
  const [fullName, setFullName] = useState('Rishi');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'signin') {
      const res = await login(emailOrUser, password);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials. Enter rishi and rishi24.');
      }
    } else {
      const emailToUse = emailOrUser.includes('@') ? emailOrUser : `${emailOrUser}@attechdigital.com`;
      const res = await signUp(emailToUse, password, fullName);
      setLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create account.');
      } else {
        setSuccessMsg(res.message || 'Admin account successfully registered!');
      }
    }
  };

  const handleInstantAdminLogin = () => {
    loginAsAdmin('rishi@attechdigital.com', 'Rishi');
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-[#080c14] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Theme Toggle Button */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all cursor-pointer text-xs font-medium"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/20 mb-3 text-white">
            <Zap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            AT TECH <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400">DIGITAL</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Computer Hardware Inventory Management System</p>
        </div>

        {/* Auth Box */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xl dark:shadow-2xl backdrop-blur-md space-y-5">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Admin Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Register Admin
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
              <span>{mode === 'signin' ? 'System Administrator Login' : 'Register Administrator'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'signin'
                ? 'Sign in as administrator to manage hardware inventory & suppliers.'
                : 'Register a new administrator account in Supabase.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs leading-relaxed">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs leading-relaxed flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Full Name"
                placeholder="Rishi"
                leftIcon={<User className="w-4 h-4" />}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}

            <Input
              label="Admin Username or Email"
              type="text"
              placeholder="rishi"
              leftIcon={<User className="w-4 h-4" />}
              value={emailOrUser}
              onChange={(e) => setEmailOrUser(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="rishi24"
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={loading}
            >
              {mode === 'signin' ? 'Sign In (rishi / rishi24)' : 'Register Admin'}
            </Button>
          </form>

          {/* Quick 1-Click Access Option */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <button
              type="button"
              onClick={handleInstantAdminLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-cyan-500/30 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-inner group"
            >
              <span>Instant 1-Click Login as Rishi</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <div className="text-center text-[11px] text-slate-500 dark:text-slate-400">
              Admin: <span className="text-slate-800 dark:text-slate-200 font-semibold">rishi</span> &bull; Password: <span className="text-slate-800 dark:text-slate-200 font-semibold font-mono">rishi24</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
