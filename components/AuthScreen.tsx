
import React, { useState } from 'react';
import { LogIn, Key, Hash, Loader2, Shield, Factory, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, UserX, Lock, WifiOff } from 'lucide-react';
import { loginUser, resetUserPasswordWithRecovery } from '../db';
import RegisterScreen from './RegisterScreen';
import ITCLogo from './ITCLogo';

interface Props {
  onAuthSuccess: (user: any) => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

const AuthScreen: React.FC<Props> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string; hint?: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login State
  const [pNo, setPNo] = useState('');
  const [securityKey, setSecurityKey] = useState('');

  // Forgot Password State
  const [recoveryPNo, setRecoveryPNo] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newKey, setNewKey] = useState('');

  const getFriendlyErrorMessage = (code: string, inputPNo?: string) => {
    switch (code) {
      case 'USER_NOT_FOUND':
        return {
          message: 'Employee ID Not Recognized',
          hint: `P.NO "${inputPNo}" was not found in the ITC registry. Please verify the ID on your factory badge or tap "Register" below to create a new profile.`
        };
      case 'INCORRECT_KEY':
        return {
          message: 'Security Key Mismatch',
          hint: `The key entered for P.NO "${inputPNo}" is incorrect. Keys are case-sensitive. If you have forgotten your key, use the "Forgot?" link above to perform a master reset.`
        };
      case 'CONNECTION_FAILED':
        return {
          message: 'Secure Server Unreachable',
          hint: 'We could not establish a connection to the ITC authentication vault. Please check your network signal or contact your Unit IT desk if the problem persists.'
        };
      case 'INVALID_RECOVERY_CODE':
        return {
          message: 'Invalid Master Recovery Code',
          hint: 'The recovery token provided does not match the master key for this account. Recovery codes are issued during your initial factory induction.'
        };
      case 'SYSTEM_ERROR':
        return {
          message: 'Registry System Malfunction',
          hint: 'An internal security exception occurred while processing your request. Please restart the terminal application.'
        };
      default:
        return {
          message: 'Access Denied',
          hint: 'An unexpected authentication error occurred. Please verify your credentials and attempt to enter the terminal again.'
        };
    }
  };

  const getErrorIcon = (code: string) => {
    switch (code) {
      case 'USER_NOT_FOUND': return <UserX className="w-5 h-5" />;
      case 'INCORRECT_KEY': return <Lock className="w-5 h-5" />;
      case 'CONNECTION_FAILED': return <WifiOff className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await loginUser(pNo, securityKey);
      if (result.success) {
        onAuthSuccess(result.user);
      } else {
        const details = getFriendlyErrorMessage(result.error || 'AUTH_ERROR', pNo);
        setError({ 
          code: result.error || 'AUTH_ERROR', 
          ...details
        });
      }
    } catch (err) {
      const details = getFriendlyErrorMessage('CONNECTION_FAILED');
      setError({ code: 'CONNECTION_FAILED', ...details });
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await resetUserPasswordWithRecovery(recoveryPNo, recoveryCode, newKey);
      if (result.success) {
        setSuccessMsg('Security key successfully reset. You can now login with your new credentials.');
        setTimeout(() => setMode('login'), 2000);
      } else {
        const details = getFriendlyErrorMessage(result.error || 'RECOVERY_ERROR', recoveryPNo);
        setError({ 
          code: result.error || 'RECOVERY_ERROR', 
          ...details
        });
      }
    } catch (err) {
      const details = getFriendlyErrorMessage('SYSTEM_ERROR');
      setError({ code: 'SYSTEM_ERROR', ...details });
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'register') {
    return (
      <RegisterScreen 
        onSuccess={() => setMode('login')} 
        onBackToLogin={() => setMode('login')} 
      />
    );
  }

  if (mode === 'forgot') {
    return (
      <div className="flex flex-col items-center justify-center py-4 md:py-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white dark:bg-slate-900 p-8 md:p-14 rounded-[3.5rem] shadow-2xl border-t-8 border-indigo-600 w-full max-w-lg space-y-10 relative overflow-hidden transition-colors">
           <div className="text-center space-y-4">
              <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-100">
                <RefreshCw className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Identity Recovery</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Master Security Reset</p>
           </div>

           {error && (
             <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 flex flex-col gap-1 animate-in slide-in-from-top-2">
               <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest">
                 <div className="shrink-0">{getErrorIcon(error.code)}</div>
                 <span>{error.message}</span>
               </div>
               {error.hint && <p className="text-[10px] font-medium opacity-80 pl-8 leading-tight italic lowercase first-letter:uppercase">{error.hint}</p>}
             </div>
           )}

           {successMsg && (
             <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
               <CheckCircle2 className="w-4 h-4 shrink-0" />
               {successMsg}
             </div>
           )}

           <form onSubmit={handleRecovery} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Employee P.NO</label>
                <input 
                  required
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-600 outline-none transition-all font-black text-slate-900 dark:text-white"
                  placeholder="Ex: 12345"
                  value={recoveryPNo}
                  onChange={(e) => setRecoveryPNo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Master Recovery Code</label>
                <input 
                  required
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-600 outline-none transition-all font-black text-slate-900 dark:text-white"
                  placeholder="Secret recovery token"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">New Security Key</label>
                <input 
                  required
                  type="password"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-600 outline-none transition-all font-black text-slate-900 dark:text-white"
                  placeholder="Minimum 6 characters"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl hover:bg-slate-900 dark:hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Security Key'}
              </button>
           </form>

           <button 
             onClick={() => setMode('login')}
             className="w-full text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors"
           >
             <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-4 md:py-10 animate-in fade-in zoom-in-95 duration-700">
      <div className={`bg-white dark:bg-slate-900 p-8 md:p-14 rounded-[3.5rem] shadow-2xl border-t-8 border-blue-900 w-full max-w-lg space-y-12 relative overflow-hidden transition-all ${error ? 'animate-shake' : ''}`}>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .animate-shake { animation: shake 0.4s ease-in-out; }
        `}</style>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-16 -mt-16 opacity-40 pointer-events-none" />
        
        <div className="text-center space-y-4 relative z-10">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-100 dark:shadow-none transform hover:scale-110 transition-transform">
            <ITCLogo className="w-16 h-16" variant="color" />
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Login Portal</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">ITC Integrated Systems</p>
          </div>
        </div>

        {error && (
          <div className="p-5 rounded-[1.5rem] bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 flex flex-col gap-1 transition-colors uppercase tracking-widest animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3 text-[10px] font-black">
              <div className="shrink-0">{getErrorIcon(error.code)}</div>
              <span>{error.message}</span>
            </div>
            {error.hint && <p className="text-[9px] font-bold opacity-70 pl-8 leading-tight lowercase first-letter:uppercase italic">{error.hint}</p>}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-8 relative z-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Hash className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400 flex-shrink-0" /> 
              <span>Employee P.NO</span>
            </label>
            <input 
              required
              autoComplete="username"
              className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:border-blue-900 dark:focus:border-blue-500 outline-none transition-all font-black text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-300 dark:placeholder:text-slate-500 shadow-sm"
              placeholder="Ex: 12345"
              value={pNo}
              onChange={(e) => setPNo(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-blue-900 dark:text-blue-400 flex-shrink-0" /> 
                <span>Security Key</span>
              </label>
              <button 
                type="button" 
                onClick={() => setMode('forgot')}
                className="text-[9px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest hover:underline"
              >
                Forgot?
              </button>
            </div>
            <input 
              required
              type="password"
              autoComplete="current-password"
              className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:border-blue-900 dark:focus:border-blue-500 outline-none transition-all font-black text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-300 dark:placeholder:text-slate-500 tracking-widest shadow-sm"
              placeholder="••••••••"
              value={securityKey}
              onChange={(e) => setSecurityKey(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-6 rounded-[2.5rem] font-black text-lg transition-all shadow-2xl flex items-center justify-center gap-4 transform active:scale-[0.98] ${
              loading 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                : 'bg-blue-900 text-white hover:bg-slate-900 dark:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-blue-200 dark:hover:shadow-none'
            }`}
          >
            {loading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <>
                <span className="uppercase tracking-widest text-sm">Enter Terminal</span>
                <LogIn className="w-6 h-6" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-8 border-t border-slate-50 dark:border-slate-800 relative z-10">
          <button 
            type="button"
            onClick={() => setMode('register')}
            className="text-[10px] font-black text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors uppercase tracking-[0.3em] bg-blue-50 dark:bg-blue-900/10 px-6 py-3 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20"
          >
            New Enrollment Required? Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
