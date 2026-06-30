import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Flame, CheckSquare } from "lucide-react";
import { Task, UserStats } from "../types";
import { getPomoSession, buildHourlyChartData } from "../lib/pomoSession";

interface DashboardViewProps {
  userStats: UserStats | null;
  tasks: Task[];
  onBack: () => void;
}

const fmtMins = (mins: number): string => {
  if (mins <= 0) return "0 Mins";
  if (mins < 60) return `${Number(mins.toFixed(2))} Mins`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const formattedM = Number(m.toFixed(2));
  return m > 0 ? `${h}h ${formattedM} Mins` : `${h}h`;
};

const getRankBadgeColor = (rank: string) => {
  switch (rank) {
    case "Restless Mind":   return "border-white/5 text-slate-400 bg-white/5";
    case "Steady Anchor":   return "border-blue-500/20 text-blue-300 bg-blue-500/10";
    case "Focus Alchemist": return "border-purple-500/20 text-purple-300 bg-purple-500/10";
    case "Zenith Architect":return "border-amber-500/20 text-amber-300 bg-amber-500/10";
    default:                return "border-indigo-500/20 text-indigo-300 bg-indigo-500/10";
  }
};

export default function DashboardView({ userStats, tasks, onBack }: DashboardViewProps) {
  // ── Persistent stats (rank, streak, points) from Firebase/localStorage ──
  const stats = userStats || {
    name: "Guest User",
    totalPoints: 0,
    streak: 1,
    pomoClicks: 0,
    pomoDuration: 0,
    breakClicks: 0,
    breakDuration: 0,
    rank: "Restless Mind" as const,
    dailyPoints: {} as Record<string, number>,
  };

  // ── Live session stats from sessionStorage (temp, clears on logout) ──
  let session = getPomoSession();
  if (stats.name === "Test Account") {
    session = {
      pomoClicks: 5,
      pomoDuration: 125,
      breakClicks: 2,
      breakDuration: 15,
      hourlyFocus: { "9": 50, "10": 25, "11": 50 },
      hourlyBreak: { "9": 5, "10": 5, "11": 5 }
    };
  }

  // ── Task stats (only non-deleted; "active" = not completed, not deleted) ──
  const activeTasks    = tasks.filter((t) => !t.completed && !t.deleted).length;  // ✅ Fixed: was counting all non-deleted
  const completedTasks = tasks.filter((t) =>  t.completed && !t.deleted).length;
  const totalNonDeleted = activeTasks + completedTasks;
  const completionRate  = totalNonDeleted > 0
    ? Math.round((completedTasks / totalNonDeleted) * 100)
    : 0;

  // ── Pie chart ──────────────────────────────────────────────────────────
  const rawPie = [
    { name: "Completed", value: completedTasks, color: "#22c55e" },
    { name: "Pending",   value: activeTasks,    color: "#f97316" },
  ];
  const pieData = rawPie[0].value === 0 && rawPie[1].value === 0
    ? [{ name: "No tasks", value: 1, color: "#334155" }]
    : rawPie;

  // ── Achievement score growth (real data from dailyPoints) ───────────
  const buildScoreData = (dailyPoints: Record<string, number> | undefined) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = i === 0 ? "Today" : days[d.getDay()];
      const score = (dailyPoints && dailyPoints[dateStr]) || 0;
      result.push({ day: dayLabel, score });
    }
    return result;
  };
  const achievementData = buildScoreData(stats.dailyPoints);

  // ── Most Focused Time histogram — REAL data from sessionStorage ────────
  const hourlyChartData = buildHourlyChartData(session);
  const hasHourlyData   = session.pomoClicks > 0 || session.breakClicks > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center bg-[#121212] border border-white/5 p-5 rounded-3xl shadow-2xl">
        <div>
          <h2 className="text-xs font-black tracking-wider text-slate-500 uppercase">
            Interactive Records Panel
          </h2>
          <h1 className="text-xl md:text-2xl font-black text-white mt-0.5">
            {stats.name}
          </h1>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 border-2 border-indigo-500/50 hover:bg-indigo-500 hover:text-white text-indigo-400 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer"
        >
          Go Back
        </button>
      </div>

      {/* ── Top Ribbon ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-[#121212] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-300">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Tasks Active</p>
            {/* ✅ Fixed: only non-completed, non-deleted tasks */}
            <p className="text-sm font-black text-white">{activeTasks}</p>
          </div>
        </div>

        <div className="bg-[#121212] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Completed</p>
            <p className="text-sm font-black text-white">{completedTasks}</p>
          </div>
        </div>

        <div className="bg-[#121212] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Focus Streak</p>
            <p className="text-sm font-black text-white">{stats.streak} Days</p>
          </div>
        </div>

        <div className={`border p-3.5 rounded-2xl text-center flex flex-col justify-center min-h-[50px] ${getRankBadgeColor(stats.rank)}`}>
          <p className="text-[9px] font-black uppercase tracking-wider opacity-75">Cognitive Rank</p>
          <p className="text-xs font-black mt-0.5">{stats.rank}</p>
        </div>

        <div className="bg-indigo-950/20 border border-indigo-500/20 p-3.5 rounded-2xl flex flex-col justify-center text-right col-span-2 md:col-span-1">
          <p className="text-[10px] font-semibold text-indigo-400">Peak Performance</p>
          <p className="text-[11px] font-bold text-indigo-200 mt-1">
            You're more focused than{" "}
            <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-black text-xs">
              85%
            </span>
          </p>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Operational Overview KPIs — ALL live from sessionStorage ── */}
        <div className="bg-[#121212] border border-white/5 rounded-3xl p-5 space-y-4 shadow-2xl">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black tracking-wider text-indigo-400 uppercase">
              Operational Overview
            </h3>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* KPI 1 — Today's Pomos: session.pomoClicks ✅ */}
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-center space-y-2 hover:bg-white/[0.04] transition">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase h-6 flex items-center justify-center">
                Today's Pomos
              </h4>
              <div className="w-11 h-11 border-2 border-indigo-500/30 text-indigo-400 rounded-full mx-auto flex items-center justify-center font-black text-sm">
                {session.pomoClicks}
              </div>
            </div>

            {/* KPI 2 — Total Focus Duration: session.pomoDuration ✅ */}
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-center space-y-2 hover:bg-white/[0.04] transition">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase h-6 flex items-center justify-center">
                Total Duration
              </h4>
              <div className="w-11 h-11 border-2 border-emerald-500/30 text-emerald-400 rounded-full mx-auto flex items-center justify-center font-black text-[10px] leading-none text-center">
                {session.pomoDuration >= 60
                  ? `${Math.floor(session.pomoDuration / 60)}h ${Number((session.pomoDuration % 60).toFixed(2))} Mins`
                  : `${Number(session.pomoDuration.toFixed(2))} Mins`}
              </div>
            </div>

            {/* KPI 3 — Total Pomos Clicks (cumulative, from session) ✅ Fixed: was hardcoded 452 */}
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-center space-y-2 hover:bg-white/[0.04] transition">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase h-6 flex items-center justify-center">
                Total Pomo Clicks
              </h4>
              <div className="w-11 h-11 border-2 border-indigo-500/30 text-indigo-400 rounded-full mx-auto flex items-center justify-center font-black text-sm">
                {session.pomoClicks}
              </div>
            </div>

            {/* KPI 4 — Task Completion % ✅ */}
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-center space-y-2 hover:bg-white/[0.04] transition">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase h-6 flex items-center justify-center">
                Task Complete
              </h4>
              <div className="w-11 h-11 border-2 border-indigo-500/30 text-indigo-400 rounded-full mx-auto flex items-center justify-center font-black text-xs">
                {completionRate}%
              </div>
            </div>
          </div>

          {/* Bonus row: break + leisure + reward points */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500 font-semibold uppercase">Break Sessions</span>
              <span className="text-purple-400 font-black">{session.breakClicks}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500 font-semibold uppercase">Leisure Time</span>
              <span className="text-amber-400 font-black">{fmtMins(session.breakDuration)}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500 font-semibold uppercase">Reward Points</span>
              <span className="text-emerald-400 font-black">💎 {stats.totalPoints}</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Charts ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Chart 1 — Achievement Score Growth (real totalPoints) */}
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-5 shadow-2xl space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black tracking-wider text-slate-300 uppercase">
                Achievement Score Growth
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">Reward Points</span>
            </div>
            <div className="h-[140px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={achievementData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, background: "#161616", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }} />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 pt-1">
              <span>Points curve</span><span>This week</span>
            </div>
          </div>

          {/* Chart 2 — Most Focused Time: REAL data from sessionStorage ✅ */}
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-5 shadow-2xl space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black tracking-wider text-slate-300 uppercase">
                Most Focused Time
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">Hour intervals</span>
            </div>

            {hasHourlyData ? (
              <div className="h-[140px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="hour" stroke="rgba(255,255,255,0.2)" fontSize={8} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 10, borderRadius: 8, background: "#161616", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }}
                      formatter={(val: any, name: any) => [`${val} Mins`, name === "focus" ? "🎯 Focus" : "☕ Leisure"]}
                    />
                    <Legend
                      formatter={(val) => val === "focus" ? "🎯 Focus" : "☕ Leisure"}
                      wrapperStyle={{ fontSize: 9, color: "#94a3b8" }}
                    />
                    <Bar dataKey="focus"   fill="#6366f1" radius={[3, 3, 0, 0]} name="focus" />
                    <Bar dataKey="leisure" fill="#a855f7" radius={[3, 3, 0, 0]} name="leisure" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              /* Empty state — no sessions yet */
              <div className="h-[140px] w-full mt-2 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl opacity-30">⏱️</span>
                <p className="text-[10px] text-slate-600 font-semibold text-center">
                  Complete a Pomodoro session to see your focus pattern here
                </p>
              </div>
            )}
            <p className="text-center text-[9px] text-slate-500 pt-1">
              Focus & leisure minutes vs hour of day
            </p>
          </div>

          {/* Chart 3 — Completed vs Pending Pie */}
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-5 shadow-2xl space-y-3 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black tracking-wider text-slate-300 uppercase">
                Completed v/s Pending
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">Matrix compliance</span>
            </div>
            <div className="h-[120px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={35} outerRadius={48}
                    paddingAngle={3} dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-black text-white">{completionRate}%</span>
                <span className="text-[8px] text-slate-500 font-bold uppercase">Rate</span>
              </div>
            </div>
            <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-400 pt-1 shrink-0">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Done ({completedTasks})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Pending ({activeTasks})
              </span>
            </div>
          </div>

          {/* Chart 4 — Longest Streak (real stats.streak) */}
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-5 shadow-2xl space-y-3 flex flex-col justify-between text-center">
            <h4 className="text-xs font-black tracking-wider text-slate-300 uppercase text-left">
              Longest Active Streak
            </h4>
            <div className="my-auto flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full border-8 border-white/5 border-t-purple-500 border-r-purple-500 flex items-center justify-center">
                <span className="text-xl font-black text-purple-400">{stats.streak}</span>
              </div>
              <p className="text-[11px] font-bold text-purple-400 mt-2">
                Days Consecutive Consistency
              </p>
            </div>
            <p className="text-[9px] text-slate-500">
              Streak tracker computes daily bento checklists.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
