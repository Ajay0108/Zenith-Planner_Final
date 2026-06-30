import React, { useState } from "react";
import { Calendar, CheckCircle, Trash2, Layout, Timer, Bell, Inbox, Briefcase, ShoppingCart, Book, Heart, CircleDot, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Task, CalendarEvent } from "../types";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  selectedListFilter: string | null;
  onListFilterChange: (list: string | null) => void;
  onShowDeleted: (show: boolean) => void;
  showDeleted: boolean;
  onShowCompleted: (show: boolean) => void;
  showCompleted: boolean;
}

export default function Sidebar({
  activeView,
  onViewChange,
  tasks,
  calendarEvents,
  selectedListFilter,
  onListFilterChange,
  onShowDeleted,
  showDeleted,
  onShowCompleted,
  showCompleted,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  // Set dynamic date
  const now = new Date();
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const dayName = days[now.getDay()];
  const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  // Count pending tasks for badges
  const pendingCount = tasks.filter(t => !t.completed && !t.deleted).length;
  const todayTasksCount = tasks.filter(t => {
    if (t.completed || t.deleted) return false;
    const lower = t.suggestedTimeline.toLowerCase();
    return lower.includes("today") || lower.includes("hour") || lower.includes("am") || lower.includes("pm");
  }).length;

  const getListCount = (category: string) => {
    return tasks.filter(t => t.category === category && !t.completed && !t.deleted).length;
  };

  const handleNavClick = (view: string) => {
    onShowDeleted(false);
    onShowCompleted(false);
    onListFilterChange(null);
    onViewChange(view);
  };

  const handleListFilterClick = (listName: string) => {
    onShowDeleted(false);
    onShowCompleted(false);
    onListFilterChange(listName);
    onViewChange("tasks");
  };

  return (
    <aside
      className={`${
        collapsed ? "w-[70px]" : "w-[260px]"
      } bg-[#0F0F0F] border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out h-full select-none shrink-0 hidden md:flex`}
      id="sidebar"
    >
      {/* Sidebar toggle button inside sidebar top */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
        {!collapsed && <span className="text-xs font-black tracking-wider text-slate-500">NAVIGATION PANEL</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-white/5 text-slate-400 rounded-lg cursor-pointer transition ml-auto"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 pb-20 md:pb-5 space-y-5">
        {/* Date Card */}
        {!collapsed ? (
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
            <h2 className="text-xs font-black tracking-wider text-indigo-400 uppercase" id="day-txt">
              {dayName}
            </h2>
            <p className="text-sm font-semibold text-slate-200 mt-1" id="date-txt">
              {dateStr}
            </p>
          </div>
        ) : (
          <div className="text-center py-2 bg-white/[0.02] border border-white/5 rounded-lg font-bold text-xs text-indigo-400">
            {now.getDate()}
          </div>
        )}

        {/* Google Calendar Mini-View */}
        {!collapsed && (
          <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Calendar Mini-View</span>
            </div>
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {calendarEvents.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic text-center py-2">No upcoming slots scheduled.</p>
              ) : (
                calendarEvents.slice(0, 3).map(event => {
                  const eventTime = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={event.id} className="text-left bg-[#121212] border border-white/5 p-2 rounded-lg hover:bg-white/5 transition">
                      <p className="text-[11px] font-bold text-slate-300 truncate">{event.title}</p>
                      <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">{eventTime}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Primary View Navigation Group */}
        <div className="space-y-1">
          {/* Today Button */}
          <button
            onClick={() => handleNavClick("tasks")}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-left transition-all ${
              activeView === "tasks" && !selectedListFilter && !showDeleted && !showCompleted
                ? "bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/15"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
            title="Users can see all assigned tasks here"
          >
            <div className="flex items-center gap-3">
              <Inbox className="w-4 h-4 text-slate-500 shrink-0 group-hover:text-indigo-400" />
              {!collapsed && <span className="text-xs font-semibold">Today's Tasks</span>}
            </div>
            {!collapsed && todayTasksCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full font-black">
                {todayTasksCount}
              </span>
            )}
          </button>

          {/* Empty Slots Navigation */}
          <button
            onClick={() => handleNavClick("emptySlots")}
            className={`w-full flex items-center p-2.5 rounded-xl cursor-pointer text-left transition-all ${
              activeView === "emptySlots"
                ? "bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/15"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
            title="Reflect all empty upcoming slots in day and week"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              {!collapsed && <span className="text-xs font-semibold">Empty Slots</span>}
            </div>
          </button>

          {/* Dashboard Navigation */}
          <button
            onClick={() => handleNavClick("dashboard")}
            className={`w-full flex items-center p-2.5 rounded-xl cursor-pointer text-left transition-all ${
              activeView === "dashboard"
                ? "bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/15"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
            title="Overall view of users records"
          >
            <div className="flex items-center gap-3">
              <Layout className="w-4 h-4 text-slate-500 shrink-0" />
              {!collapsed && <span className="text-xs font-semibold">Dashboard</span>}
            </div>
          </button>

          {/* Pomodoro Focus Timer */}
          <button
            onClick={() => handleNavClick("pomodoro")}
            className={`w-full flex items-center p-2.5 rounded-xl cursor-pointer text-left transition-all ${
              activeView === "pomodoro"
                ? "bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/15"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
            title="Pomodoro focus session tracker"
          >
            <div className="flex items-center gap-3">
              <Timer className="w-4 h-4 text-slate-500 shrink-0" />
              {!collapsed && <span className="text-xs font-semibold">Pomodoro</span>}
            </div>
          </button>

          {/* Notifications Log */}
          <button
            onClick={() => handleNavClick("notifications")}
            className={`w-full flex items-center p-2.5 rounded-xl cursor-pointer text-left transition-all ${
              activeView === "notifications"
                ? "bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/15"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
            title="Your notifications and alerts"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-slate-500 shrink-0" />
              {!collapsed && <span className="text-xs font-semibold">Notifications</span>}
            </div>
          </button>
        </div>

        {/* Dynamic Lists Section */}
        {!collapsed && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex justify-between items-center px-2 text-[10px] font-black text-slate-500 tracking-wider">
              <span>LISTS & MATRICES</span>
            </div>

            <div className="space-y-0.5">
              {/* Urgent & Important List Filter */}
              <button
                onClick={() => handleListFilterClick("Urgent & Important")}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left cursor-pointer transition ${
                  selectedListFilter === "Urgent & Important"
                    ? "bg-[#161616] text-red-400 font-bold border-l-2 border-red-500 rounded-l-none"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Briefcase className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="text-xs truncate">Work Focus (#1)</span>
                </div>
                {getListCount("Urgent & Important") > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded-full font-bold">
                    {getListCount("Urgent & Important")}
                  </span>
                )}
              </button>

              {/* Study - Important Not Urgent */}
              <button
                onClick={() => handleListFilterClick("Important Not Urgent")}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left cursor-pointer transition ${
                  selectedListFilter === "Important Not Urgent"
                    ? "bg-[#161616] text-amber-400 font-bold border-l-2 border-amber-500 rounded-l-none"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Book className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-xs truncate">Long-term Study (#2)</span>
                </div>
                {getListCount("Important Not Urgent") > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full font-bold">
                    {getListCount("Important Not Urgent")}
                  </span>
                )}
              </button>

              {/* Shopping - Urgent Not Important */}
              <button
                onClick={() => handleListFilterClick("Urgent Not Important")}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left cursor-pointer transition ${
                  selectedListFilter === "Urgent Not Important"
                    ? "bg-[#161616] text-indigo-400 font-bold border-l-2 border-indigo-500 rounded-l-none"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShoppingCart className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-xs truncate">Delegated Tasks (#3)</span>
                </div>
                {getListCount("Urgent Not Important") > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full font-bold">
                    {getListCount("Urgent Not Important")}
                  </span>
                )}
              </button>

              {/* Wishlist - Not Urgent Not Important */}
              <button
                onClick={() => handleListFilterClick("Not Urgent / Important")}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left cursor-pointer transition ${
                  selectedListFilter === "Not Urgent / Important"
                    ? "bg-[#161616] text-slate-300 font-bold border-l-2 border-slate-500 rounded-l-none"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Heart className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs truncate">Wishlist (#4)</span>
                </div>
                {getListCount("Not Urgent / Important") > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-white/10 text-slate-300 rounded-full font-bold">
                    {getListCount("Not Urgent / Important")}
                  </span>
                )}
              </button>

              {/* Ikigai */}
              <button
                onClick={() => handleListFilterClick("Ikigai")}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left cursor-pointer transition ${
                  selectedListFilter === "Ikigai"
                    ? "bg-[#161616] text-emerald-400 font-bold border-l-2 border-emerald-500 rounded-l-none"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CircleDot className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs truncate">Ikigai Passion (#5)</span>
                </div>
                {getListCount("Ikigai") > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold">
                    {getListCount("Ikigai")}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-white/5 p-3 bg-[#121212] shrink-0 space-y-1">
        {/* Completed View Trigger */}
        <button
          onClick={() => {
            onListFilterChange(null);
            onShowDeleted(false);
            onShowCompleted(true);
            onViewChange("tasks");
          }}
          className={`w-full flex items-center gap-3 p-2 text-left rounded-xl cursor-pointer transition-all ${
            activeView === "tasks" && !showDeleted && showCompleted
              ? "text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/15"
              : "text-slate-500 hover:bg-white/5"
          }`}
          title="See complete actions list"
        >
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          {!collapsed && <span className="text-xs font-semibold truncate">All Completed</span>}
        </button>

        {/* Deleted View Trigger */}
        <button
          onClick={() => {
            onListFilterChange(null);
            onShowDeleted(true);
            onShowCompleted(false);
            onViewChange("tasks");
          }}
          className={`w-full flex items-center gap-3 p-2 text-left rounded-xl cursor-pointer transition-all ${
            showDeleted ? "bg-rose-500/10 text-rose-400 font-bold border border-rose-500/15" : "text-slate-500 hover:bg-white/5"
          }`}
          title="See deleted action list"
        >
          <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
          {!collapsed && <span className="text-xs font-semibold truncate">Trash Bin</span>}
        </button>
      </div>
    </aside>
  );
}
