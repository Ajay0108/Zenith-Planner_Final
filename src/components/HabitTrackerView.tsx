import React, { useState } from "react";
import { HelpCircle, Check, X, Info } from "lucide-react";
import { HabitDay, Task } from "../types";

interface HabitTrackerProps {
  habits: HabitDay[];
  tasks: Task[];
  onToggleHabit: (dateString: string) => Promise<void>;
  onSaveHabitNote: (dateString: string, note: string) => Promise<void>;
}

export default function HabitTrackerView({
  habits,
  tasks,
  onToggleHabit,
  onSaveHabitNote,
}: HabitTrackerProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(habits[0]?.dateString || null);
  const [noteText, setNoteText] = useState(habits[0]?.note || "");

  // Find habits list or generate default list of last 15 days
  const activeHabit = habits.find(h => h.dateString === selectedDay);

  const handleDayClick = (dateString: string) => {
    setSelectedDay(dateString);
    const found = habits.find(h => h.dateString === dateString);
    setNoteText(found?.note || "");
  };

  const handleNoteBlur = async () => {
    if (selectedDay) {
      await onSaveHabitNote(selectedDay, noteText);
    }
  };

  // Filter tasks for right pane (top 10 complete, top 10 pending)
  const completedTasks = tasks.filter(t => t.completed && !t.deleted).slice(0, 10);
  const pendingTasks = tasks.filter(t => !t.completed && !t.deleted).slice(0, 10);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 select-none">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-white">Habit Tracker & Consistency Diary</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor your past 15 days of commitment and view workflow volume.
        </p>
      </div>

      <div className="bg-[#121212] border border-white/5 rounded-[24px] shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* LEFT COMPLIANCE SECTION */}
        <div className="flex-1 p-6 md:p-8 border-r border-white/5 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Title with tooltip */}
            <div className="flex items-center gap-2 group/tooltip">
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-wider">Consistency Record</h2>
              <div className="relative">
                <HelpCircle className="w-4 h-4 text-slate-500 hover:text-indigo-400 transition cursor-pointer" />
                <div className="invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 absolute bottom-6 left-0 w-60 bg-[#161616] border border-white/10 text-slate-300 p-2.5 rounded-lg text-[10px] leading-relaxed shadow-2xl z-50 transition-all">
                  Brief: Your daily consistency tracker for the last 15 days. Click any circle to toggle Achieved (Green) vs Missed (Red).
                </div>
              </div>
            </div>

            {/* Habit Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
              {habits.slice(0, 15).map((day) => {
                // Parse date for simple display (e.g. 26 Jun)
                const dateObj = new Date(day.dateString + "T12:00:00");
                const label = dateObj.toLocaleDateString([], { day: "numeric", month: "short" });
                const isSelected = day.dateString === selectedDay;

                return (
                  <div
                    key={day.dateString}
                    onClick={() => handleDayClick(day.dateString)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-xl transition cursor-pointer ${
                      isSelected ? "bg-indigo-500/10 border border-indigo-500/20" : "border border-transparent hover:bg-white/5"
                    }`}
                  >
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{label}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHabit(day.dateString);
                      }}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 active:scale-95 ${
                        day.status === "complete"
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : day.status === "miss"
                          ? "bg-red-500 border-red-500 text-white"
                          : "border-white/10 bg-white/5 hover:border-slate-400 text-slate-400"
                      }`}
                      title={day.status === "complete" ? "Goal Achieved" : day.status === "miss" ? "Missed Day" : "Not Logged"}
                    >
                      {day.status === "complete" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      {day.status === "miss" && <X className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Legend & Summary text */}
            <div className="border-t border-white/5 pt-4 mt-2">
              <span className="text-xs font-semibold text-slate-500 italic block">15 day compliance log:</span>
              <div className="flex gap-4 text-xs font-medium text-slate-400 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Green for complete</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Red for miss</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Notes Area */}
          <div className="mt-8 pt-6 border-t border-white/5 space-y-2">
            <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
              Personal Reflection Note ({selectedDay ? new Date(selectedDay + "T12:00:00").toLocaleDateString([], {day:"numeric", month:"long"}) : "Selected Day"}):
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onBlur={handleNoteBlur}
              placeholder="How was your day? Write down reflections, focus blocks achieved, or wellness logs here... (autosaves on blur)"
              className="w-full h-24 border border-white/10 bg-[#161616] focus:bg-[#1c1c1c] text-white rounded-xl p-3 text-xs outline-none focus:border-indigo-500 transition resize-none leading-relaxed placeholder-slate-600"
            />
          </div>
        </div>

        {/* RIGHT TASK VOLUME LISTS */}
        <div className="w-full lg:w-[320px] bg-white/[0.01] p-6 flex flex-col justify-between">
          {/* Completed block */}
          <div className="space-y-4">
            <div className="flex justify-between items-center group/tooltip-right">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Completed Tasks ({completedTasks.length})</h3>
              <div className="relative">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400 cursor-pointer" />
                <div className="invisible opacity-0 group-hover/tooltip-right:visible group-hover/tooltip-right:opacity-100 absolute bottom-6 right-0 w-48 bg-[#161616] border border-white/10 text-slate-300 p-2 rounded-lg text-[9px] leading-normal shadow-2xl z-50 transition-all">
                  Brief: List of your 10 most recently finished tasks.
                </div>
              </div>
            </div>
            <ul className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {completedTasks.length === 0 ? (
                <p className="text-[10px] text-slate-600 italic py-2">No completed tasks yet.</p>
              ) : (
                completedTasks.map(t => (
                  <li key={t.id} className="text-xs text-slate-400 flex items-start gap-2 truncate">
                    <span className="text-emerald-500 font-extrabold">•</span>
                    <span className="truncate line-through opacity-50">{t.title}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="w-full h-px bg-white/5 my-6" />

          {/* Pending block */}
          <div className="space-y-4">
            <div className="flex justify-between items-center group/tooltip-pending">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Pending Tasks ({pendingTasks.length})</h3>
              <div className="relative">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400 cursor-pointer" />
                <div className="invisible opacity-0 group-hover/tooltip-pending:visible group-hover/tooltip-pending:opacity-100 absolute bottom-6 right-0 w-48 bg-[#161616] border border-white/10 text-slate-300 p-2 rounded-lg text-[9px] leading-normal shadow-2xl z-50 transition-all">
                  Brief: Remaining goals and upcoming priorities.
                </div>
              </div>
            </div>
            <ul className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 text-left">
              {pendingTasks.length === 0 ? (
                <p className="text-[10px] text-slate-600 italic py-2">All tasks completed!</p>
              ) : (
                pendingTasks.map(t => (
                  <li key={t.id} className="text-xs text-slate-300 flex items-start gap-2 truncate">
                    <span className="text-indigo-400 font-extrabold">•</span>
                    <span className="truncate">{t.title}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
