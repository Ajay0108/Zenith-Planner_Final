import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { UserStats } from "../types";
import {
  getPomoSession,
  recordPomoClick,
  recordPomoDuration,
  buildHourlyChartData,
  PomoSessionData,
} from "../lib/pomoSession";

interface PomodoroProps {
  userStats: UserStats | null;
  onUpdatePomoStats: (
    pomoDelta: number,
    durationDelta: number,
    isBreak: boolean
  ) => Promise<void>;
}

const fmtMins = (mins: number) => {
  if (mins <= 0) return "0 Mins";
  if (mins < 60) return `${Number(mins.toFixed(2))} Mins`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const formattedM = Number(m.toFixed(2));
  return m > 0 ? `${h}h ${formattedM} Mins` : `${h}h`;
};

export default function PomodoroView({
  userStats,
  onUpdatePomoStats,
}: PomodoroProps) {
  // ─── Timer state ───────────────────────────────────────────────
  const [mode, setMode] = useState<"Pomo" | "Break">("Pomo");
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // ─── Session-done flag (set inside interval, handled in effect) ─
  // This is the CORRECT React pattern — never call async from inside
  // a state updater function.
  const [sessionDone, setSessionDone] = useState(false);

  // ─── Modal state ───────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [finishedMode, setFinishedMode] = useState<"Pomo" | "Break">("Pomo");
  const [finishedDuration, setFinishedDuration] = useState(25);

  // ─── sessionStorage stats (single source of truth) ────────────
  const [session, setSession] = useState<PomoSessionData>(getPomoSession);

  // Refresh session data whenever we navigate to this page
  useEffect(() => {
    setSession(getPomoSession());
  }, []);

  // ─── Refs ──────────────────────────────────────────────────────
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Refs so interval callback always sees latest values (no stale closure)
  const modeRef = useRef(mode);
  const durationRef = useRef(duration);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  // ─── INTERVAL: purely decrements timeLeft ──────
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning]);

  // ─── EFFECT: watches timeLeft to safely trigger completion ─
  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      // Reached the end! Record time spent first.
      stopAndRecord(0);
      setSessionDone(true);
    }
  }, [timeLeft, isRunning]);

  // ─── EFFECT: handle success modal when hitting 0 ─
  useEffect(() => {
    if (!sessionDone) return;
    setSessionDone(false); // Reset flag immediately

    const currentMode = modeRef.current;
    const currentDuration = durationRef.current;
    const isBreak = currentMode === "Break";

    // 1️⃣ Show success modal
    setFinishedMode(currentMode);
    setFinishedDuration(currentDuration);
    setShowModal(true);

    // 2️⃣ Auto-swap mode
    if (!isBreak) {
      setMode("Break");
      setDuration(5);
      setTimeLeft(5 * 60);
    } else {
      setMode("Pomo");
      setDuration(25);
      setTimeLeft(25 * 60);
    }
  }, [sessionDone]);

  // ─── Duration picker change ────────────────────────────────────
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(Math.round(duration * 60));
    }
  }, [duration]);

  // ─── Incremental Tracking (Start/Pause/Reset) ──────────────────
  const lastStartedTimeLeft = useRef<number | null>(null);

  const startSession = () => {
    const isBreak = mode === "Break";
    // Count as 1 click as soon as they hit Start!
    setSession(recordPomoClick(isBreak));
    lastStartedTimeLeft.current = timeLeft;
    setIsRunning(true);
  };

  const stopAndRecord = (currentTimeLeft: number) => {
    setIsRunning(false);
    if (lastStartedTimeLeft.current !== null) {
      const elapsedSeconds = lastStartedTimeLeft.current - currentTimeLeft;
      if (elapsedSeconds > 0) {
        const isBreak = mode === "Break";
        // Record the actual duration spent before pausing/resetting locally
        setSession(recordPomoDuration(isBreak, elapsedSeconds));
        
        // BUG FIX: Only trigger points and pomoClicks IF the timer hits exactly 0 (full completion)
        // For Pomodoro, we only count it if duration is >= 25 minutes to prevent quick exploits
        const isFullCompletion = currentTimeLeft === 0 && (!isBreak ? duration >= 25 : true);
        const clickDelta = isFullCompletion ? 1 : 0;
        
        // Sync to global stats
        onUpdatePomoStats(clickDelta, elapsedSeconds / 60, isBreak).catch(console.error);
      }
      lastStartedTimeLeft.current = null;
    }
  };

  const toggleTimer = () => {
    if (isRunning) {
      stopAndRecord(timeLeft); // PAUSE
    } else {
      startSession(); // START
    }
  };

  const resetTimer = () => {
    if (isRunning) {
      stopAndRecord(timeLeft); // PAUSE & RECORD ELAPSED TIME FIRST
    }
    setTimeLeft(Math.round(duration * 60));
  };

  const handleModeChange = (newMode: "Pomo" | "Break") => {
    setIsRunning(false);
    setMode(newMode);
    const d = newMode === "Pomo" ? 25 : 5;
    setDuration(d);
    setTimeLeft(d * 60);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // SVG progress ring
  const totalSec = Math.round(duration * 60);
  const pct = totalSec > 0 ? ((totalSec - timeLeft) / totalSec) * 100 : 0;
  const circumference = 2 * Math.PI * 130;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="bg-[#121212] border border-white/5 rounded-[32px] overflow-hidden flex flex-col md:flex-row shadow-2xl max-w-4xl mx-auto py-2 select-none">
      {/* ── LEFT PANEL — LIVE STATS from sessionStorage ── */}
      <aside className="w-full md:w-[280px] bg-white/[0.01] border-r border-white/5 p-8 flex flex-col justify-between">
        <div>
          <h2 className="text-xs font-black tracking-wider text-slate-500 uppercase mb-6">
            Pomodoro Stats
          </h2>

          <div className="space-y-6">
            {/* Sessions */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Today's Pomos
              </span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs bg-indigo-500/10">
                  C
                </div>
                <span className="text-lg font-black text-slate-200">
                  {session.pomoClicks}{" "}
                  {session.pomoClicks === 1 ? "Session" : "Sessions"}
                </span>
              </div>
            </div>

            {/* Focus Duration */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Total Focus Duration
              </span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs bg-emerald-500/10">
                  S
                </div>
                <span className="text-lg font-black text-slate-200">
                  {fmtMins(session.pomoDuration)}
                </span>
              </div>
            </div>

            {/* Break Count */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Break Count
              </span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xs bg-purple-500/10">
                  B
                </div>
                <span className="text-lg font-black text-slate-200">
                  {session.breakClicks}{" "}
                  {session.breakClicks === 1 ? "Break" : "Breaks"}
                </span>
              </div>
            </div>

            {/* Leisure Time */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Total Leisure Time
              </span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs bg-amber-500/10">
                  L
                </div>
                <span className="text-lg font-black text-slate-200">
                  {fmtMins(session.breakDuration)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[9px] text-slate-500 italic pt-6 border-t border-white/5 mt-6 md:mt-0 leading-normal">
          Each completed Pomodoro session awards you 💎 25 cognitive points!
        </div>
      </aside>

      {/* ── RIGHT PANEL — CLOCK & CONTROLS ── */}
      <main className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center bg-transparent">
        {/* Mode Toggle */}
        <div className="flex bg-white/5 p-1 rounded-xl mb-8 border border-white/5 shadow-inner">
          <button
            onClick={() => handleModeChange("Pomo")}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === "Pomo"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pomodoro Focus
          </button>
          <button
            onClick={() => handleModeChange("Break")}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === "Break"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Leisure Break
          </button>
        </div>

        {/* Clock Ring */}
        <div className="relative w-[280px] h-[280px] md:w-[320px] md:h-[320px] flex flex-col justify-center items-center mb-8">
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 300 300"
          >
            <circle
              cx="150" cy="150" r="130"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="6"
            />
            <circle
              cx="150" cy="150" r="130"
              fill="none"
              stroke={mode === "Pomo" ? "#6366f1" : "#a855f7"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-3 rounded-full border border-white/5 hover:border-indigo-500/30 transition duration-300 bg-white/[0.01]" />

          <div className="relative text-5xl md:text-6xl font-light tracking-tight text-white font-mono z-10">
            {formatTime(timeLeft)}
          </div>

          <div className="relative mt-4 z-10">
            <select
              value={duration}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setDuration(v);
                setTimeLeft(Math.round(v * 60));
              }}
              disabled={isRunning}
              className="px-4 py-1.5 border border-white/10 rounded-full text-xs font-bold bg-[#161616] text-slate-300 cursor-pointer outline-none focus:border-indigo-500 transition disabled:opacity-50"
            >
              {mode === "Pomo" ? (
                <>
                  <option value="0.1666" className="bg-[#121212]">⚡ 10 Seconds (Speed Test)</option>
                  <option value="25" className="bg-[#121212]">25:00 Minutes</option>
                  <option value="30" className="bg-[#121212]">30:00 Minutes</option>
                  <option value="60" className="bg-[#121212]">1:00 Hour</option>
                </>
              ) : (
                <>
                  <option value="0.1666" className="bg-[#121212]">⚡ 10 Seconds (Speed Test)</option>
                  <option value="5" className="bg-[#121212]">05:00 Minutes</option>
                  <option value="10" className="bg-[#121212]">10:00 Minutes</option>
                  <option value="15" className="bg-[#121212]">15:00 Minutes</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <button
            onClick={toggleTimer}
            className={`px-10 py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 cursor-pointer text-white flex items-center gap-2 ${
              isRunning
                ? "bg-[#1a1a1a] border border-white/10 hover:bg-[#262626]"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isRunning ? (
              <><Pause className="w-4 h-4 fill-white" /><span>Pause Session</span></>
            ) : (
              <><Play className="w-4 h-4 fill-white" /><span>Start Session</span></>
            )}
          </button>
          <button
            onClick={resetTimer}
            className="px-6 py-3.5 border border-white/5 hover:border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold text-slate-300 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        {isRunning && (
          <div className="mt-5 flex items-center gap-2 text-xs text-indigo-400 font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            {mode === "Pomo" ? "Focus session in progress..." : "Leisure break running..."}
          </div>
        )}
      </main>

      {/* ── SUCCESS MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
          <div className="bg-[#161616] border border-white/10 rounded-[28px] p-6 max-w-sm w-full text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 w-full left-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

            <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-3xl">
              🏆
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-100 tracking-tight">
                {finishedMode === "Pomo" ? "Focus Block Complete!" : "Break Complete!"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed px-2">
                You finished your{" "}
                <span className="text-emerald-400 font-bold">
                  {finishedMode === "Pomo" ? "Pomodoro Focus" : "Leisure Break"}
                </span>{" "}
                session of{" "}
                <span className="text-slate-200 font-bold">
                  {finishedDuration >= 1
                    ? `${Math.round(finishedDuration)} minutes`
                    : `${Math.round(finishedDuration * 60)} seconds`}
                </span>.
              </p>
            </div>

            {finishedMode === "Pomo" && (
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs font-bold text-emerald-400 flex justify-center items-center gap-1.5 animate-pulse">
                <span>💎 +25 Cognitive Points Awarded!</span>
              </div>
            )}

            {/* Live snapshot from sessionStorage */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                <p className="text-[9px] text-slate-500 uppercase font-bold">Focus Sessions</p>
                <p className="text-base font-black text-indigo-400 mt-0.5">
                  {session.pomoClicks}
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                <p className="text-[9px] text-slate-500 uppercase font-bold">Focus Time</p>
                <p className="text-base font-black text-emerald-400 mt-0.5">
                  {fmtMins(session.pomoDuration)}
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                <p className="text-[9px] text-slate-500 uppercase font-bold">Break Sessions</p>
                <p className="text-base font-black text-purple-400 mt-0.5">
                  {session.breakClicks}
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                <p className="text-[9px] text-slate-500 uppercase font-bold">Leisure Time</p>
                <p className="text-base font-black text-amber-400 mt-0.5">
                  {fmtMins(session.breakDuration)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-lg shadow-indigo-950/20"
            >
              Claim Rewards & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
