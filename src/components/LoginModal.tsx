import React, { useState } from "react";
import { Sparkles, KeyRound, ArrowRight, ShieldAlert, Bot, Mail, Lock } from "lucide-react";

interface LoginModalProps {
  onLoginGoogle: () => Promise<void>;
  onLoginAnonymously: () => Promise<void>;
  onLoginEmail: (email: string, pass: string) => Promise<void>;
  onRegisterEmail: (email: string, pass: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function LoginModal({
  onLoginGoogle,
  onLoginAnonymously,
  onLoginEmail,
  onRegisterEmail,
  loading,
  error,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !password) {
      setLocalError("Please enter both email and password.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    setLocalLoading(true);
    try {
      if (isSignUp) {
        await onRegisterEmail(email.trim(), password);
      } else {
        await onLoginEmail(email.trim(), password);
      }
    } catch (err: any) {
      setLocalError(err?.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setLocalLoading(false);
    }
  };

  const isBtnDisabled = loading || localLoading;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999] select-none animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#121212] border border-white/5 rounded-[32px] p-6 md:p-8 shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-500" />

        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl mb-4">
          🎯
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-black text-slate-100">Bento Productivity Hub</h2>
          <p className="text-[11px] text-slate-400 mt-1 px-4">
            Cloud persistence and smart Eisenhower Matrix task scheduling
          </p>
        </div>

        {(error || localError) && (
          <div className="w-full mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-start gap-2.5 text-left leading-normal">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex bg-white/[0.03] border border-white/5 p-1 rounded-xl w-full mb-4">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setLocalError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              !isSignUp ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setLocalError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              isSignUp ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="email"
              placeholder="Enter email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
              disabled={isBtnDisabled}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
              disabled={isBtnDisabled}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isBtnDisabled}
            className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md shadow-indigo-950/20"
          >
            {isBtnDisabled ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <span>{isSignUp ? "Register Account" : "Sign In to Account"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center w-full my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <span className="relative px-3 text-[10px] font-bold text-slate-500 bg-[#121212] uppercase tracking-wider">
            Or continue with
          </span>
        </div>

        {/* Third Party Login Buttons */}
        <div className="w-full space-y-2">
          {/* Google Auth login */}
          <button
            onClick={onLoginGoogle}
            disabled={isBtnDisabled}
            className="w-full h-11 border border-white/10 hover:border-indigo-500/30 hover:bg-white/5 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <span>Sign in with Google Account</span>
          </button>

          {/* Guest login */}
          <button
            onClick={onLoginAnonymously}
            disabled={isBtnDisabled}
            className="w-full h-11 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition"
          >
            <span>Continue seamlessly as Guest</span>
          </button>
        </div>

        <div className="flex gap-2 items-center text-[9px] text-slate-500 font-semibold border-t border-white/5 pt-4 w-full justify-center mt-5">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>Firebase persistent cloud security enabled</span>
        </div>
      </div>
    </div>
  );
}
