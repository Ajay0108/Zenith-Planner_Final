import React, { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  FileText, 
  Trash, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  HelpCircle, 
  Settings, 
  ChevronDown,
  Check,
  Mail
} from "lucide-react";
import { CalendarEvent } from "../types";

interface CalendarProps {
  events: CalendarEvent[];
  onAddEvent: (title: string, start: string, end: string, description: string) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  
  // Google Workspace integrations
  accessToken?: string | null;
  onSyncCalendar?: () => Promise<void>;
  isSyncing?: boolean;
  lastSynced?: Date | null;
  onAutoSchedule?: () => Promise<void>;
  isAutoScheduling?: boolean;
  aiBehavioralLearnings?: string[];
  extractedGmailTasks?: any[];
  onAnalyzeGmail?: () => Promise<void>;
  isAnalyzingGmail?: boolean;
  onCategorizeEvents?: () => Promise<void>;
  isCategorizingEvents?: boolean;
  onAddTask?: (title: string, category: any, priority: any, timeline: string, notes: string, points: number) => Promise<void>;
  calendarSyncError?: string | null;
  onClearCalendarSyncError?: () => void;
  gmailSyncError?: string | null;
  onClearGmailSyncError?: () => void;
}

export default function CalendarView({ 
  events, 
  onAddEvent, 
  onDeleteEvent,
  accessToken = null,
  onSyncCalendar,
  isSyncing = false,
  lastSynced = null,
  onAutoSchedule,
  isAutoScheduling = false,
  aiBehavioralLearnings = [],
  extractedGmailTasks = [],
  onAnalyzeGmail,
  isAnalyzingGmail = false,
  onCategorizeEvents,
  isCategorizingEvents = false,
  onAddTask,
  calendarSyncError = null,
  onClearCalendarSyncError,
  gmailSyncError = null,
  onClearGmailSyncError
}: CalendarProps) {
  // We align with the user's screenshot year and date: default active date is June 27, 2026
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Focus hour blocks
  const slots = [
    { label: "08:00 AM - 10:00 AM", key: "slot-1", defaultStart: "08:00", defaultEnd: "10:00" },
    { label: "10:00 AM - 12:00 PM", key: "slot-2", defaultStart: "10:00", defaultEnd: "12:00" },
    { label: "12:00 PM - 02:00 PM", key: "slot-3", defaultStart: "12:00", defaultEnd: "14:00" },
    { label: "02:00 PM - 04:00 PM", key: "slot-4", defaultStart: "14:00", defaultEnd: "16:00" },
    { label: "04:00 PM - 06:00 PM", key: "slot-5", defaultStart: "16:00", defaultEnd: "18:00" },
    { label: "06:00 PM - 08:00 PM", key: "slot-6", defaultStart: "18:00", defaultEnd: "20:00" },
  ];

  const handleBookSlotClick = (slotLabel: string) => {
    setSelectedSlot(slotLabel);
    setNewEventTitle(`Focus Block: ${slotLabel.split(" - ")[0]}`);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    // Get date string of selected date
    const dateStr = selectedDate.toISOString().split("T")[0];
    const chosenSlot = slots.find(s => s.label === selectedSlot);
    
    let startIso = new Date(`${dateStr}T${chosenSlot?.defaultStart || "09:00"}:00`).toISOString();
    let endIso = new Date(`${dateStr}T${chosenSlot?.defaultEnd || "10:00"}:00`).toISOString();

    await onAddEvent(newEventTitle, startIso, endIso, newEventDesc);
    
    // Reset state
    setNewEventTitle("");
    setNewEventDesc("");
    setShowAddForm(false);
    setSelectedSlot(null);
  };

  const getEventForSlot = (slotLabel: string, targetDate: Date) => {
    return events.find(event => {
      const eventTime = new Date(event.start);
      if (
        eventTime.getFullYear() !== targetDate.getFullYear() ||
        eventTime.getMonth() !== targetDate.getMonth() ||
        eventTime.getDate() !== targetDate.getDate()
      ) {
        return false;
      }
      
      const hour = eventTime.getHours();
      const slotHour = parseInt(slotLabel.split(":")[0]);
      const slotIsPM = slotLabel.includes("PM") && slotHour !== 12;
      const adjustedSlotHour = slotIsPM ? slotHour + 12 : slotHour;
      
      return Math.abs(hour - adjustedSlotHour) < 1.5;
    });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const checkIfToday = (date: Date) => {
    // June 27, 2026 is designated as today to match the user's screenshot
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const handlePrev = () => {
    if (viewMode === "month") {
      const d = new Date(currentDate);
      d.setMonth(currentDate.getMonth() - 1);
      setCurrentDate(d);
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(currentDate.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(currentDate.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      const d = new Date(currentDate);
      d.setMonth(currentDate.getMonth() + 1);
      setCurrentDate(d);
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(currentDate.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(currentDate.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getHeaderTitle = () => {
    if (viewMode === "month") {
      return currentDate.toLocaleString("default", { month: "long", year: "numeric" });
    } else if (viewMode === "week") {
      const days = getDaysOfWeek(currentDate);
      const firstDay = days[0];
      const lastDay = days[6];
      if (firstDay.getMonth() === lastDay.getMonth()) {
        return `${firstDay.toLocaleString("default", { month: "long" })} ${firstDay.getFullYear()}`;
      } else {
        return `${firstDay.toLocaleString("default", { month: "short" })} – ${lastDay.toLocaleString("default", { month: "short" })} ${lastDay.getFullYear()}`;
      }
    } else {
      return currentDate.toLocaleString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
  };

  const getMonthCells = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      let dayLabel = `${d.getDate()}`;
      cells.push({
        date: d,
        isCurrentMonth: false,
        isToday: checkIfToday(d),
        dayLabel,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      let dayLabel = `${i}`;
      if (i === 1) {
        dayLabel = `${d.toLocaleString("default", { month: "short" })} 1`;
      }
      cells.push({
        date: d,
        isCurrentMonth: true,
        isToday: checkIfToday(d),
        dayLabel,
      });
    }

    // Next month padding
    const totalRemaining = 42 - cells.length;
    for (let i = 1; i <= totalRemaining; i++) {
      const d = new Date(year, month + 1, i);
      let dayLabel = `${i}`;
      if (i === 1) {
        dayLabel = `${d.toLocaleString("default", { month: "short" })} 1`;
      }
      cells.push({
        date: d,
        isCurrentMonth: false,
        isToday: checkIfToday(d),
        dayLabel,
      });
    }

    return cells;
  };

  const getDaysOfWeek = (date: Date) => {
    const currentDayOfWeek = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - currentDayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const renderMonthView = () => {
    const cells = getMonthCells();
    const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    return (
      <div className="flex-1 flex flex-col min-w-[500px] lg:min-w-0">
        {/* Weekday labels */}
        <div className="grid grid-cols-7 border-b border-white/5 pb-2 text-center">
          {weekDays.map(wd => (
            <span key={wd} className="text-[10px] font-black text-slate-500 tracking-wider">
              {wd}
            </span>
          ))}
        </div>

        {/* Calendar Grid cells */}
        <div className="grid grid-cols-7 grid-rows-6 flex-grow border-l border-t border-white/5 mt-3">
          {cells.map((cell, idx) => {
            const dayEvents = getEventsForDate(cell.date);
            const isSelected = selectedDate.getDate() === cell.date.getDate() &&
                               selectedDate.getMonth() === cell.date.getMonth() &&
                               selectedDate.getFullYear() === cell.date.getFullYear();
            
            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(cell.date)}
                className={`min-h-[85px] border-r border-b border-white/5 p-1 flex flex-col justify-between cursor-pointer transition relative group ${
                  cell.isCurrentMonth ? "bg-transparent" : "bg-white/[0.01]"
                } ${
                  isSelected ? "ring-1 ring-indigo-500/30 bg-indigo-500/[0.02]" : "hover:bg-white/[0.01]"
                }`}
              >
                {/* Day Header */}
                <div className="flex justify-center pt-1 shrink-0">
                  {cell.isToday ? (
                    <span className="w-5.5 h-5.5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shadow-lg shadow-blue-900/50">
                      {cell.date.getDate()}
                    </span>
                  ) : (
                    <span className={`text-[11px] font-bold ${
                      cell.isCurrentMonth ? "text-slate-300" : "text-slate-600"
                    }`}>
                      {cell.dayLabel}
                    </span>
                  )}
                </div>

                {/* Event list stack */}
                <div className="space-y-1 overflow-y-auto max-h-[60px] custom-scrollbar flex-1 mt-1.5 px-0.5">
                  {dayEvents.map(event => {
                    const isHoliday = event.title.toLowerCase().includes("muharram") || event.title.toLowerCase().includes("holiday") || event.title.toLowerCase().includes("ashura");
                    
                    if (isHoliday) {
                      return (
                        <div
                          key={event.id}
                          title={`${event.title} - ${event.description || ""}`}
                          className="bg-emerald-600/95 text-white rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wide truncate shadow-sm text-center border border-emerald-500"
                        >
                          {event.title}
                        </div>
                      );
                    }
                    
                    // Format time indicator
                    const startTime = new Date(event.start);
                    let hourLabel = startTime.getHours() % 12 || 12;
                    const ampm = startTime.getHours() >= 12 ? "pm" : "am";
                    const mins = startTime.getMinutes() ? `:${startTime.getMinutes()}` : "";
                    const timeStr = `${hourLabel}${mins}${ampm}`;

                    return (
                      <div
                        key={event.id}
                        title={`${timeStr} ${event.title} - ${event.description || ""}`}
                        className="flex items-center gap-1 text-[9px] font-bold text-slate-300 hover:text-white px-1 py-0.5 rounded hover:bg-white/5 truncate transition"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-[9px] text-blue-400 font-medium shrink-0">{timeStr}</span>
                        <span className="truncate">{event.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getDaysOfWeek(currentDate);

    return (
      <div className="flex-1 flex flex-col min-w-[500px] lg:min-w-0">
        <div className="grid grid-cols-7 border-b border-white/5 pb-2.5 text-center">
          {days.map((day, idx) => {
            const isToday = checkIfToday(day);
            const isSelected = selectedDate.getDate() === day.getDate() &&
                               selectedDate.getMonth() === day.getMonth() &&
                               selectedDate.getFullYear() === day.getFullYear();
            const dayName = day.toLocaleString("default", { weekday: "short" }).toUpperCase();
            const dayNum = day.getDate();

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(day)}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <span className="text-[10px] font-black text-slate-500 tracking-wider">
                  {dayName}
                </span>
                {isToday ? (
                  <span className="w-6.5 h-6.5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-blue-900/50">
                    {dayNum}
                  </span>
                ) : (
                  <span className={`w-6.5 h-6.5 flex items-center justify-center rounded-full text-xs font-bold transition ${
                    isSelected ? "bg-white/10 text-white" : "text-slate-400 group-hover:bg-white/5"
                  }`}>
                    {dayNum}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Week grid columns */}
        <div className="grid grid-cols-7 flex-grow border-l border-white/5 min-h-[350px] mt-3">
          {days.map((day, idx) => {
            const dayEvents = getEventsForDate(day);
            const isSelected = selectedDate.getDate() === day.getDate() &&
                               selectedDate.getMonth() === day.getMonth() &&
                               selectedDate.getFullYear() === day.getFullYear();

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`border-r border-b border-white/5 p-2 flex flex-col gap-2 cursor-pointer transition ${
                  isSelected ? "bg-indigo-500/[0.01]" : "hover:bg-white/[0.01]"
                }`}
              >
                {dayEvents.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center">
                    <span className="text-[9px] text-slate-600 font-medium italic">Unscheduled</span>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto max-h-[320px] custom-scrollbar flex-1">
                    {dayEvents.map(event => {
                      const isHoliday = event.title.toLowerCase().includes("muharram") || event.title.toLowerCase().includes("holiday") || event.title.toLowerCase().includes("ashura");
                      
                      const startTime = new Date(event.start);
                      let hourLabel = startTime.getHours() % 12 || 12;
                      const ampm = startTime.getHours() >= 12 ? "PM" : "AM";
                      const timeStr = `${hourLabel} ${ampm}`;

                      if (isHoliday) {
                        return (
                          <div
                            key={event.id}
                            className="bg-emerald-600 border border-emerald-500 text-white rounded-xl p-2 text-[9px] font-black leading-tight shadow-md text-center"
                          >
                            <p className="uppercase text-[7px] text-emerald-200">Holiday</p>
                            <p className="mt-0.5 truncate">{event.title}</p>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={event.id}
                          className="bg-indigo-500/10 border border-indigo-500/20 text-slate-200 rounded-xl p-2 text-[9px] font-bold leading-tight hover:border-indigo-500/40 transition"
                        >
                          <p className="text-indigo-400 font-bold uppercase text-[7px]">{timeStr}</p>
                          <p className="mt-0.5 truncate text-slate-200 font-black">{event.title}</p>
                          {event.description && (
                            <p className="text-[8px] text-slate-500 mt-0.5 truncate font-medium">{event.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div className="flex-1 flex flex-col space-y-3">
        <span className="text-[10px] font-black text-slate-500 tracking-wider block uppercase">
          Daily hour blocks for {selectedDate.toLocaleDateString("default", { month: "long", day: "numeric", year: "numeric" })}
        </span>

        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
          {slots.map(slot => {
            const bookedEvent = getEventForSlot(slot.label, selectedDate);
            
            return (
              <div
                key={slot.key}
                className={`border rounded-2xl p-4 flex items-center justify-between transition-all duration-200 ${
                  bookedEvent
                    ? "bg-indigo-500/10 border-indigo-500/20 shadow-md"
                    : "bg-transparent border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.01]"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white/5 text-slate-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{slot.label}</p>
                    
                    {bookedEvent ? (
                      <div className="mt-0.5 min-w-0">
                        <p className="text-xs md:text-sm font-bold text-slate-200 truncate">{bookedEvent.title}</p>
                        {bookedEvent.description && (
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{bookedEvent.description}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs md:text-sm font-bold text-slate-500 italic mt-0.5">Empty Slot - Available</p>
                    )}
                  </div>
                </div>

                {bookedEvent ? (
                  <button
                    onClick={() => onDeleteEvent(bookedEvent.id)}
                    className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 rounded-lg cursor-pointer transition"
                    title="Clear Scheduled Event"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleBookSlotClick(slot.label)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition flex items-center gap-1 shrink-0 shadow-lg"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Claim Slot</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-[1050px] mx-auto py-2 select-none">
      {/* Calendar View Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            <span>Google Calendar Board</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Claim empty slots or switch between Day, Week, and Month views to design your deep focus architecture.
          </p>
        </div>

        {/* Real-time Google Workspace Status & Syncer */}
        <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-2xl">
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">
              {accessToken ? "● Sync Active" : "○ Google Workspace Disconnected"}
            </span>
            <span className="text-[8px] text-slate-500 font-semibold">
              {lastSynced ? `Synced at ${lastSynced.toLocaleTimeString()}` : "Not Synced with Workspace"}
            </span>
          </div>
          {onSyncCalendar && (
            <button
              onClick={onSyncCalendar}
              disabled={isSyncing}
              className={`px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/20 hover:text-white text-indigo-300 text-xs font-bold rounded-xl transition duration-300 cursor-pointer flex items-center gap-1.5 ${
                isSyncing ? "opacity-50 cursor-not-allowed animate-pulse" : ""
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSyncing ? "Syncing..." : "Sync Calendar (2m Auto)"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Google Workspace Connection & Scope/Permission Notices */}
      {calendarSyncError && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-4 rounded-2xl text-xs space-y-2">
          <p className="font-bold flex items-center gap-2">
            <span className="text-amber-400 font-extrabold text-sm">⚠️ Google Calendar Sync Issue</span>
          </p>
          <p className="leading-relaxed">
            {calendarSyncError}
          </p>
          <div className="flex items-center gap-3 pt-1">
            {onSyncCalendar && (
              <button
                onClick={onSyncCalendar}
                className="px-3 py-1 bg-amber-500 text-black font-black rounded-lg hover:bg-amber-400 transition cursor-pointer"
              >
                Re-authorize & Sync
              </button>
            )}
            {onClearCalendarSyncError && (
              <button
                onClick={onClearCalendarSyncError}
                className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {gmailSyncError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-2xl text-xs space-y-2">
          <p className="font-bold flex items-center gap-2">
            <span className="text-red-400 font-extrabold text-sm">⚠️ Gmail Sync Issue</span>
          </p>
          <p className="leading-relaxed">
            {gmailSyncError}
          </p>
          <div className="flex items-center gap-3 pt-1">
            {onAnalyzeGmail && (
              <button
                onClick={onAnalyzeGmail}
                className="px-3 py-1 bg-red-500 text-white font-black rounded-lg hover:bg-red-600 transition cursor-pointer"
              >
                Re-authorize & Sync
              </button>
            )}
            {onClearGmailSyncError && (
              <button
                onClick={onClearGmailSyncError}
                className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {!accessToken && !calendarSyncError && !gmailSyncError && (
        <div className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-200 p-4 rounded-2xl text-xs space-y-1.5">
          <p className="font-bold flex items-center gap-2">
            <span className="text-indigo-400 font-extrabold text-sm">🔗 Connect Your Google Account</span>
          </p>
          <p className="leading-relaxed">
            To view your existing Google Calendar events and analyze your Gmail inbox for actionable tasks, please sync your Google Workspace. Click the button below and ensure you <strong>select all Calendar and Gmail permission checkboxes</strong> on the Google consent screen.
          </p>
          {onSyncCalendar && (
            <div className="pt-1">
              <button
                onClick={onSyncCalendar}
                className="px-4 py-1.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-500 transition cursor-pointer animate-pulse"
              >
                Connect Google Workspace
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI AUTONOMOUS COMMAND CENTER & BEHAVIORAL MEMORY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#121212]/50 border border-white/5 p-5 rounded-[24px] shadow-2xl">
        {/* Col 1: Agentic Commands */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-indigo-400 tracking-wider uppercase">
            Agentic AI Controls
          </h3>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            The AI uses dynamic pathing algorithms to find calendar gaps and match them with urgent tasks.
          </p>
          <div className="flex flex-col gap-2">
            {onAutoSchedule && (
              <button
                onClick={onAutoSchedule}
                disabled={isAutoScheduling || isSyncing}
                className={`w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/50 cursor-pointer transition ${
                  isAutoScheduling ? "opacity-60 cursor-wait" : ""
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>{isAutoScheduling ? "Scheduling Gaps..." : "Run Autonomous Scheduling"}</span>
              </button>
            )}
            {onAnalyzeGmail && (
              <button
                onClick={onAnalyzeGmail}
                disabled={isAnalyzingGmail || isSyncing}
                className={`w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  isAnalyzingGmail ? "opacity-60 cursor-wait" : ""
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isAnalyzingGmail ? "Analyzing Gmail..." : "Extract Gmail Tasks"}</span>
              </button>
            )}
            {onCategorizeEvents && (
              <button
                onClick={onCategorizeEvents}
                disabled={isCategorizingEvents || isSyncing}
                className={`w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  isCategorizingEvents ? "opacity-60 cursor-wait" : ""
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{isCategorizingEvents ? "Importing..." : "Import & Categorize Events"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Col 2: Active Behavioral Synapses */}
        <div className="space-y-3 border-t md:border-t-0 md:border-x border-white/5 pt-3 md:pt-0 md:px-4">
          <h3 className="text-[10px] font-black text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Cognitive Synapses</span>
          </h3>
          <p className="text-[10px] text-slate-500 leading-normal">
            Dynamic learning profile of how your focus architecture adapts from task completion behavior.
          </p>
          <div className="space-y-2 max-h-[110px] overflow-y-auto custom-scrollbar">
            {aiBehavioralLearnings.map((learned, idx) => (
              <div
                key={idx}
                className="p-2 bg-white/[0.01] border border-white/5 rounded-xl text-[9px] text-slate-400 flex items-start gap-1.5 leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                <span>{learned}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3: Unapproved Extracted Actionable Items */}
        <div className="space-y-3 pt-3 md:pt-0">
          <h3 className="text-[10px] font-black text-emerald-400 tracking-wider uppercase">
            Extracted Inbox Tasks ({extractedGmailTasks.length})
          </h3>
          <p className="text-[10px] text-slate-500 leading-normal">
            Extract actionable todo items from your unread Google Gmail emails.
          </p>
          <div className="space-y-2 max-h-[110px] overflow-y-auto custom-scrollbar">
            {extractedGmailTasks.length === 0 ? (
              <div className="h-[75px] bg-white/[0.01] border border-white/5 border-dashed rounded-xl flex items-center justify-center text-[9px] text-slate-500 text-center">
                No unapproved Gmail tasks found.<br />Click "Extract Gmail Tasks" above to scan.
              </div>
            ) : (
              extractedGmailTasks.map((task, idx) => {
                return (
                  <div
                    key={idx}
                    className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[9px] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-200 truncate">{task.title}</p>
                      <p className="text-emerald-400 text-[8px] font-semibold mt-0.5">
                        {task.category} • {task.priority}
                      </p>
                    </div>
                    {onAddTask && (
                      <button
                        onClick={() => {
                          onAddTask(
                            task.title,
                            task.category,
                            task.priority,
                            task.suggestedTimeline || "Today",
                            task.explanation || "Extracted from your unread Google Gmail emails.",
                            task.points || 25
                          );
                          alert(`Approved and added "${task.title}" to dashboard!`);
                        }}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[8px] cursor-pointer transition shrink-0"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

        {/* Sleek Google-Calendar styled Top Navbar */}
        <div className="flex items-center flex-wrap gap-2.5 bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-2xl shadow-xl">
          {/* Today Button */}
          <button
            onClick={handleToday}
            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-200 cursor-pointer transition"
          >
            Today
          </button>

          {/* Navigation Arrows */}
          <div className="flex items-center border border-white/10 rounded-lg overflow-hidden bg-white/5">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-white/5 text-slate-300 border-r border-white/10 cursor-pointer transition"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-white/5 text-slate-300 cursor-pointer transition"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Current date title */}
          <span className="text-xs font-black text-slate-200 tracking-wide px-1.5 min-w-[110px] text-center">
            {getHeaderTitle()}
          </span>

          <div className="h-5 w-[1px] bg-white/10" />

          {/* View Toggle Segmented Control */}
          <div className="flex items-center p-0.5 bg-white/5 border border-white/10 rounded-xl">
            {(["day", "week", "month"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition duration-150 cursor-pointer ${
                  viewMode === mode
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

      {/* Main Grid Viewport and Sidebar Scheduling Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* LEFT / CENTER VIEWPORT */}
        <div className="lg:col-span-3 bg-[#111111] border border-white/5 rounded-[28px] p-5 shadow-2xl overflow-x-auto min-h-[450px] flex flex-col">
          {viewMode === "month" && renderMonthView()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "day" && renderDayView()}
        </div>

        {/* RIGHT SIDEBAR PANEL - SCHEDULING PORTAL */}
        <div className="space-y-4">
          <span className="text-[10px] font-black text-slate-500 tracking-wider block">
            AGENDA & SCHEDULER
          </span>

          {/* Quick info card about selected date */}
          <div className="bg-[#121212] border border-white/5 rounded-[24px] p-4.5 space-y-3.5 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-200">
                  {selectedDate.toLocaleDateString("default", { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Selected Focus Target</p>
              </div>
            </div>

            {/* List of slots for this specific selected day */}
            <div className="border-t border-white/5 pt-3.5 space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
              {slots.map(slot => {
                const bookedEvent = getEventForSlot(slot.label, selectedDate);
                return (
                  <div 
                    key={slot.key}
                    className={`p-2.5 rounded-xl border text-[10px] flex items-center justify-between gap-2 ${
                      bookedEvent 
                        ? "bg-indigo-500/10 border-indigo-500/20 text-slate-200" 
                        : "bg-white/[0.01] border-white/5 text-slate-400 hover:border-white/10"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[8px] text-slate-500 tracking-wider uppercase">{slot.label.split(" - ")[0]}</p>
                      <p className="font-semibold truncate text-[11px] mt-0.5">
                        {bookedEvent ? bookedEvent.title : "Empty Available Slot"}
                      </p>
                    </div>

                    {bookedEvent ? (
                      <button 
                        onClick={() => onDeleteEvent(bookedEvent.id)}
                        className="p-1 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleBookSlotClick(slot.label)}
                        className="p-1 hover:bg-indigo-500/10 text-indigo-400 rounded transition cursor-pointer"
                        title="Claim Slot"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form to submit booking details */}
          {showAddForm ? (
            <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/5 rounded-[24px] p-5 space-y-4 shadow-2xl animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                <span>Book: {selectedSlot?.split(" - ")[0]}</span>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Slot Title</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Code Review or Gym Sprint"
                  required
                  className="w-full text-xs h-9 bg-white/5 border border-white/10 text-white rounded-xl px-2.5 outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Description / Context</label>
                <textarea
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="Goals or syllabus for this slot..."
                  className="w-full h-20 bg-white/5 border border-white/10 text-white rounded-xl p-2.5 text-xs outline-none focus:border-indigo-500 resize-none placeholder-slate-600"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 hover:bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer shadow-lg shadow-indigo-950/40"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-[#121212] border border-white/5 rounded-[24px] p-5 text-center space-y-3 shadow-2xl">
              <FileText className="w-8 h-8 text-slate-600 mx-auto stroke-[1.5]" />
              <p className="text-xs font-bold text-slate-300">Scheduler Idle</p>
              <p className="text-[10px] text-slate-500 leading-normal">
                Click any "+" or "Claim Slot" inside the calendar blocks or active agenda to claim structured deep work blocks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
