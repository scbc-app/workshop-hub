
import React, { useState, useEffect } from 'react';
import { LogIn, Users, Fingerprint, ShieldAlert, RotateCcw, CheckCircle2, WifiOff } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: string, pass: string) => void;
  isAuthenticating: boolean;
  loginSuccess: boolean;
  error: string;
  isReady: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isAuthenticating, loginSuccess, error, isReady }) => {
  const [form, setForm] = useState({ user: '', pass: '' });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline || isAuthenticating || loginSuccess) return;
    onLogin(form.user, form.pass);
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-white overflow-hidden">
      {/* BRANDING SIDEBAR / HEADER */}
      <div className="w-full md:w-[35%] lg:w-[30%] bg-[#0F1135] flex flex-col justify-between p-6 md:p-10 shrink-0">
        <div className="flex md:flex-col items-center md:items-start gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center text-[#0F1135] font-black text-xl md:text-2xl shadow-xl">W</div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none uppercase">Workshop Hub</h1>
            <p className="text-[8px] md:text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-1 md:mt-2">Staff & Tool Management</p>
          </div>
        </div>

        <div className="hidden md:block space-y-4">
          <div className="flex items-center space-x-4">
            <div className={`w-1 h-6 rounded-full transition-all duration-500 ${isOffline ? 'bg-rose-500' : isReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
            <div>
              <p className="text-white text-[10px] font-black uppercase tracking-widest">
                {isOffline ? 'No Connection' : isReady ? 'System Online' : 'Syncing...'}
              </p>
            </div>
          </div>
          
          {isOffline && (
            <div className="flex items-center space-x-2 text-rose-400">
               <WifiOff size={14} />
               <span className="text-[8px] font-black uppercase tracking-widest">Internet Required</span>
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <p className="text-white/20 text-[8px] font-black uppercase tracking-widest">Internal Use Only</p>
        </div>
      </div>

      {/* LOGIN INTERFACE */}
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        <div className="w-full max-w-sm">
          <div className="mb-6 md:mb-10 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-1 uppercase">Sign In</h2>
            <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Authorized entry only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Staff ID</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text" 
                  required 
                  disabled={isAuthenticating || loginSuccess}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 md:py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm disabled:opacity-50"
                  placeholder="ID Number"
                  value={form.user}
                  onChange={e => setForm({...form, user: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="password" 
                  required 
                  disabled={isAuthenticating || loginSuccess}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 md:py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm disabled:opacity-50"
                  placeholder="••••••••"
                  value={form.pass}
                  onChange={e => setForm({...form, pass: e.target.value})}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-[9px] font-black text-rose-600 uppercase border border-rose-100 rounded-xl flex items-center space-x-3 animate-in shake-in">
                <ShieldAlert size={14} />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isAuthenticating || loginSuccess || isOffline}
              className={`w-full py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center space-x-3 shadow-lg relative overflow-hidden active:scale-[0.98] ${
                isOffline
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                  : loginSuccess
                    ? 'bg-emerald-600 text-white'
                    : isAuthenticating 
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#0F1135] text-white hover:bg-indigo-700'
              }`}
            >
              {isOffline ? (
                <>
                  <WifiOff size={16} />
                  <span>Offline</span>
                </>
              ) : loginSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Logged in</span>
                </>
              ) : isAuthenticating ? (
                <>
                  <RotateCcw size={16} className="animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
