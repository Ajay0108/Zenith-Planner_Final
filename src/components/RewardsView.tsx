import React from "react";
import { Sparkles, Calendar, HelpCircle, Trophy, Flame } from "lucide-react";
import { Task, UserStats } from "../types";

interface RewardsProps {
  userStats: UserStats | null;
  tasks: Task[];
}

export default function RewardsView({ userStats, tasks }: RewardsProps) {
  const stats = userStats || {
    totalPoints: 1250,
    streak: 12,
  };

  // Calculate days until next weekend
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
  let daysUntilWeekend = 0;
  if (dayOfWeek === 0) daysUntilWeekend = 0;
  else if (dayOfWeek === 6) daysUntilWeekend = 0;
  else daysUntilWeekend = 5 - dayOfWeek; // Friday is weekend gateway

  // Calculate Weekend-Free Ratio
  const getWeekendRatio = () => {
    const activeTasks = tasks.filter((t) => !t.completed && !t.deleted).length;
    const completedTasks = tasks.filter((t) => t.completed && !t.deleted).length;

    if (activeTasks === 0 && completedTasks === 0) return 100;
    
    // timePressure goes from 1 (Monday, 5 days away) to 5 (Friday, 1 day away). Max is 6 (Weekend).
    const timePressure = daysUntilWeekend === 0 ? 6 : 6 - daysUntilWeekend; 

    // The more time pressure and pending tasks, the worse the score.
    const effectivePending = activeTasks * (timePressure / 2); 
    
    const ratio = (completedTasks / (completedTasks + effectivePending)) * 100;
    return Math.max(0, Math.min(100, Math.round(ratio)));
  };

  const weekendRatio = getWeekendRatio();

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 select-none">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-white">Rewards & Consistency Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">
          Stay motivated! Consistently ticking off tasks increases points, login streaks, and unlocks cognitive ranks.
        </p>
      </div>

      {/* Rewards Grid Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Weekend Countdown */}
        <div className="bg-[#121212] border border-white/5 p-5 rounded-3xl text-center flex flex-col justify-between hover:border-indigo-500/30 transition duration-300 shadow-2xl">
          <div className="flex justify-center items-center gap-1.5 group/tooltip text-xs font-black text-slate-500 tracking-wider">
            <span>WEEKEND GATEWAY</span>
            <div className="relative">
              <HelpCircle className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
              <div className="invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-[#161616] border border-white/10 text-slate-300 p-2 rounded-lg text-[9px] leading-normal z-50 text-center">
                Days remaining until your weekend break!
              </div>
            </div>
          </div>
          <div className="text-4xl font-black text-slate-200 my-4">
            {daysUntilWeekend === 0 ? "Enjoy!" : `0${daysUntilWeekend}`}
          </div>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Days until next weekend</p>
        </div>

        {/* Card 2: Cumulative Points */}
        <div className="bg-[#121212] border border-white/5 p-5 rounded-3xl text-center flex flex-col justify-between hover:border-indigo-500/30 transition duration-300 shadow-2xl">
          <div className="flex justify-center items-center gap-1.5 group/tooltip text-xs font-black text-slate-500 tracking-wider">
            <span>REWARD POINTS</span>
            <div className="relative">
              <HelpCircle className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
              <div className="invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-[#161616] border border-white/10 text-slate-300 p-2 rounded-lg text-[9px] leading-normal z-50 text-center">
                Total productivity points accumulated this month.
              </div>
            </div>
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-xl mx-auto my-3 animate-bounce">
            💎
          </div>
          <div className="text-2xl font-black text-slate-200">
            {stats.totalPoints.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total balance accumulated</p>
        </div>

        {/* Card 3: Streak Tracker */}
        <div className="bg-[#121212] border border-white/5 p-5 rounded-3xl text-center flex flex-col justify-between hover:border-indigo-500/30 transition duration-300 shadow-2xl">
          <div className="flex justify-center items-center gap-1.5 group/tooltip text-xs font-black text-slate-500 tracking-wider">
            <span>STREAK COUNT</span>
            <div className="relative">
              <HelpCircle className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
              <div className="invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-[#161616] border border-white/10 text-slate-300 p-2 rounded-lg text-[9px] leading-normal z-50 text-center">
                Consecutive daily login checklist streak.
              </div>
            </div>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center text-xl mx-auto my-3">
            🔥
          </div>
          <div className="text-2xl font-black text-slate-200">
            {stats.streak}
          </div>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Consecutive Active days</p>
        </div>

        {/* Card 4: Weekend-Free progress ring */}
        <div className="bg-[#121212] border border-white/5 p-5 rounded-3xl text-center flex flex-col justify-between hover:border-indigo-500/30 transition duration-300 shadow-2xl">
          <div className="flex justify-center items-center gap-1.5 group/tooltip text-xs font-black text-slate-500 tracking-wider">
            <span>WEEKEND-FREE RATIO</span>
            <div className="relative">
              <HelpCircle className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
              <div className="invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-[#161616] border border-white/10 text-slate-300 p-2 rounded-lg text-[9px] leading-normal z-50 text-center">
                Task completion vs scheduled weekend overload.
              </div>
            </div>
          </div>
          
          <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center relative my-1.5" style={{ background: `conic-gradient(#06b6d4 ${weekendRatio}%, rgba(255,255,255,0.04) 0)` }}>
            <div className="w-[52px] h-[52px] rounded-full bg-[#121212] flex items-center justify-center text-xs font-black text-cyan-400">
              {weekendRatio}%
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Task clearance percentage</p>
        </div>
      </div>

      {/* Upcoming public holidays */}
      <div className="bg-[#121212] border border-white/5 rounded-[24px] p-5 md:p-6 shadow-2xl space-y-4">
        <span className="text-xs font-black text-slate-500 tracking-wider uppercase block">Upcoming Public Holidays</span>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { date: "Aug 15", name: "Independence Day", tooltip: "National holiday celebrating freedom." },
            { date: "Oct 02", name: "Gandhi Jayanti", tooltip: "Honoring Mahatma Gandhi." },
            { date: "Oct 20", name: "Dussehra", tooltip: "Festival celebrating the victory of good over evil." },
            { date: "Nov 01", name: "Diwali", tooltip: "The festival of lights." },
            { date: "Dec 25", name: "Christmas Day", tooltip: "Holiday celebrating Christmas." }
          ].map((holiday, idx) => (
            <div
              key={idx}
              className="group border border-dashed border-white/10 hover:border-solid hover:border-amber-500/50 bg-white/[0.01] hover:bg-white/5 p-4 rounded-2xl text-center cursor-pointer transition duration-300 relative"
            >
              <span className="block text-sm font-black text-slate-300 group-hover:text-amber-400 transition duration-200">
                {holiday.date}
              </span>
              <span className="block text-[10px] text-slate-500 font-semibold mt-1">
                {holiday.name}
              </span>

              {/* Tooltip on hover */}
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 bg-[#161616] border border-white/10 text-slate-300 p-2 rounded-lg text-[8px] leading-normal z-50 transition shadow-2xl">
                {holiday.tooltip}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
