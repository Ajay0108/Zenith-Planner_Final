import React from "react";
import { BookOpen, HelpCircle, Sparkles, Layout, Flame, Gift, ArrowLeft } from "lucide-react";

interface GuideViewProps {
  onBack: () => void;
}

export default function GuideView({ onBack }: GuideViewProps) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/50 transition-all cursor-pointer"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" /> Zenith: Planner Guide
          </h1>
          <p className="text-sm text-slate-400 mt-1">Master your time management and cognitive focus tools.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feature 1 */}
        <div className="bg-[#121212] border border-white/5 p-6 rounded-3xl shadow-xl hover:border-indigo-500/30 transition-colors">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Gemini AI Assistant</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The core intelligence of Zenith. You can type commands, use voice-to-text, or even upload PDFs and images. The AI will automatically extract actionable tasks, categorize them based on your persona, and prioritize them using the Eisenhower Matrix logic.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="bg-[#121212] border border-white/5 p-6 rounded-3xl shadow-xl hover:border-emerald-500/30 transition-colors">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
            <Layout className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Priority Matrix Bento Grid</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your tasks are automatically sorted into quadrants: Urgent & Important, Important Not Urgent, Urgent Not Important, and Ikigai (Passion Projects). This visual bento box helps you instantly recognize what requires your immediate focus.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="bg-[#121212] border border-white/5 p-6 rounded-3xl shadow-xl hover:border-amber-500/30 transition-colors">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 mb-4 border border-amber-500/20">
            <Flame className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Pomodoro Focus Timer</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Select a task and enter the deep-work zone. The built-in Pomodoro timer uses standard intervals (25 min focus, 5 min break). Completing sessions feeds directly into your interactive dashboard, increasing your peak performance analytics.
          </p>
        </div>

        {/* Feature 4 */}
        <div className="bg-[#121212] border border-white/5 p-6 rounded-3xl shadow-xl hover:border-purple-500/30 transition-colors">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-4 border border-purple-500/20">
            <Gift className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Cognitive Ranks & Rewards</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Consistency is rewarded. By completing tasks and maintaining login streaks, you accumulate Reward Points. These points upgrade your Cognitive Rank from a "Restless Mind" all the way up to "Zenith Architect."
          </p>
        </div>
      </div>

      <div className="mt-8 bg-[#161616] border border-indigo-500/20 p-6 rounded-3xl">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" /> Pro Tip: Time Slot Optimization
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Sync your Google Calendar securely to let the autonomous scheduler find free gaps in your day. Zenith will suggest exactly when to slot in your pending tasks so you never overbook yourself.
        </p>
      </div>
    </div>
  );
}
