import React, { useState } from "react";
import { Info, Plus, Sparkles, Check, Trash } from "lucide-react";
import { Task, TaskCategory } from "../types";

interface MatrixViewProps {
  tasks: Task[];
  personalNotes: string;
  onUpdateNotes: (notes: string) => void;
  onAddTask: (title: string, category: TaskCategory, priority: "High" | "Medium" | "Low", suggestedTimeline: string, notes: string, points: number) => Promise<void>;
  onCompleteTask: (id: string, completed: boolean) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export default function MatrixView({
  tasks,
  personalNotes,
  onUpdateNotes,
  onAddTask,
  onCompleteTask,
  onDeleteTask,
}: MatrixViewProps) {
  const [quickInput, setQuickInput] = useState<{ [key: string]: string }>({});
  const [activeInputCategory, setActiveInputCategory] = useState<TaskCategory | null>(null);

  const categories: {
    number: string;
    id: TaskCategory;
    title: string;
    colorClass: string;
    bulletColor: string;
    tooltip: string;
    priority: "High" | "Medium" | "Low";
    pts: number;
  }[] = [
    {
      number: "#1",
      id: "Urgent & Important",
      title: "Urgent & Important",
      colorClass: "border-red-200 hover:shadow-red-50/50",
      bulletColor: "bg-red-500",
      tooltip: "Tasks that require immediate attention and have significant consequences if not finished. Do these first.",
      priority: "High",
      pts: 40,
    },
    {
      number: "#2",
      id: "Important Not Urgent",
      title: "Important Not Urgent",
      colorClass: "border-emerald-200 hover:shadow-emerald-50/50",
      bulletColor: "bg-emerald-500",
      tooltip: "Activities that help you achieve long-term goals. Schedule these into your calendar.",
      priority: "Medium",
      pts: 40,
    },
    {
      number: "#3",
      id: "Urgent Not Important",
      title: "Urgent Not Important",
      colorClass: "border-amber-200 hover:shadow-amber-50/50",
      bulletColor: "bg-amber-500",
      tooltip: "Interruptions that feel pressing but don't align with your goals. Delegate these if possible.",
      priority: "Medium",
      pts: 20,
    },
    {
      number: "#4",
      id: "Not Urgent / Important",
      title: "Not Urgent Not Important",
      colorClass: "border-slate-200 hover:shadow-slate-50/50",
      bulletColor: "bg-slate-400",
      tooltip: "Time-wasting activities and distractions. Aim to eliminate or minimize these.",
      priority: "Low",
      pts: 10,
    },
    {
      number: "#5",
      id: "Ikigai",
      title: "Ikigai",
      colorClass: "border-purple-200 hover:shadow-purple-50/50",
      bulletColor: "bg-purple-500",
      tooltip: "Tasks that align with your passion, mission, vocation, and profession. Your life purpose.",
      priority: "Medium",
      pts: 75,
    },
    {
      number: "#6",
      id: "Personal Notes",
      title: "Personal Notes",
      colorClass: "border-blue-200 hover:shadow-blue-50/50",
      bulletColor: "bg-blue-500",
      tooltip: "Low priority tasks, general reminders, or offline fallbacks.",
      priority: "Low",
      pts: 5,
    },
  ];

  const handleQuickAddSubmit = async (e: React.FormEvent, category: TaskCategory, priority: "High" | "Medium" | "Low", pts: number) => {
    e.preventDefault();
    const title = quickInput[category];
    if (!title || !title.trim()) return;

    await onAddTask(
      title.trim(),
      category,
      priority,
      "Today",
      "Quickly logged from Matrix view bento.",
      pts
    );

    setQuickInput(prev => ({ ...prev, [category]: "" }));
    setActiveInputCategory(null);
  };

  const handleQuickInputChange = (category: TaskCategory, value: string) => {
    setQuickInput(prev => ({ ...prev, [category]: value }));
  };

  const getCategoryTasks = (category: TaskCategory) => {
    return tasks.filter(t => t.category === category && !t.completed && !t.deleted);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 select-none">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-white">Priority Matrix Bento Grid</h1>
        <p className="text-xs text-slate-500 mt-1">
          Based on the classic Eisenhower model fused with Ikigai lifestyle categorization.
        </p>
      </div>

      {/* The Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const categoryTasks = getCategoryTasks(cat.id);
          const isAdding = activeInputCategory === cat.id;

          // Compute custom dark theme borders
          let borderTheme = "border-white/5 hover:border-slate-500/30";
          if (cat.id === "Urgent & Important") borderTheme = "border-red-500/20 hover:border-red-500/35 hover:shadow-red-500/5";
          if (cat.id === "Important Not Urgent") borderTheme = "border-emerald-500/20 hover:border-emerald-500/35 hover:shadow-emerald-500/5";
          if (cat.id === "Urgent Not Important") borderTheme = "border-amber-500/20 hover:border-amber-500/35 hover:shadow-amber-500/5";
          if (cat.id === "Not Urgent / Important") borderTheme = "border-slate-500/20 hover:border-slate-500/35 hover:shadow-slate-500/5";
          if (cat.id === "Ikigai") borderTheme = "border-purple-500/20 hover:border-purple-500/35 hover:shadow-purple-500/5";
          if (cat.id === "Personal Notes") borderTheme = "border-blue-500/20 hover:border-blue-500/35 hover:shadow-blue-500/5";

          return (
            <div
              key={cat.id}
              className={`bg-[#121212] border rounded-[24px] p-5 shadow-2xl hover:shadow-xl transition-all duration-300 flex flex-col min-h-[260px] relative group ${borderTheme}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-500">{cat.number}</span>
                  <span
                    className="text-xs font-extrabold text-slate-300 uppercase tracking-wider cursor-help"
                    title={cat.tooltip}
                  >
                    {cat.title}
                  </span>
                </div>

                <div className="relative group/tooltip">
                  <Info className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400 transition cursor-pointer" />
                  <div className="invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 absolute bottom-6 right-0 w-52 bg-[#161616] border border-white/10 text-slate-300 p-2.5 rounded-lg text-[10px] leading-relaxed shadow-2xl z-50 transition-all">
                    {cat.tooltip}
                  </div>
                </div>
              </div>

              {/* Task list bullets */}
              <div className="flex-grow overflow-y-auto space-y-2 pr-1 max-h-[160px]">
                {categoryTasks.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic text-center py-8">
                    Empty slot. No active tasks.
                  </p>
                ) : (
                  categoryTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group/item flex items-center justify-between text-xs py-1.5 border-b border-white/[0.02] last:border-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${cat.bulletColor}`} />
                        <span className="text-slate-300 font-medium truncate">{task.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button
                          onClick={() => onCompleteTask(task.id, true)}
                          className="p-1 hover:bg-emerald-500/10 rounded text-emerald-400 cursor-pointer"
                          title="Complete Task"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 hover:bg-rose-500/10 rounded text-rose-400 cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Inline task creator */}
              {isAdding ? (
                <form
                  onSubmit={(e) => handleQuickAddSubmit(e, cat.id, cat.priority, cat.pts)}
                  className="mt-3"
                >
                  <input
                    type="text"
                    placeholder="Press Enter to save..."
                    autoFocus
                    value={quickInput[cat.id] || ""}
                    onChange={(e) => handleQuickInputChange(cat.id, e.target.value)}
                    className="w-full text-xs h-9 bg-white/5 border border-white/10 text-white rounded-xl px-2.5 outline-none focus:border-indigo-500 transition"
                  />
                  <div className="flex justify-end gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setActiveInputCategory(null)}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      Save Task
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setActiveInputCategory(cat.id)}
                  className="mt-4 text-[10px] font-bold text-slate-500 hover:text-indigo-400 hover:bg-white/5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition border border-dashed border-white/5 group-hover:border-indigo-500/40 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>ADD TASK</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Note to Self Box */}
      <div className="bg-[#121212] border border-dashed border-white/10 rounded-[24px] p-5 flex flex-col min-h-[160px] relative shadow-2xl mt-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-500">📝</span>
            <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Note to Self
            </span>
          </div>
          
          <div className="relative group/tooltip">
            <Info className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400 cursor-pointer" />
            <div className="invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 absolute bottom-6 right-0 w-52 bg-[#161616] border border-white/10 text-slate-300 p-2.5 rounded-lg text-[10px] leading-relaxed shadow-2xl z-50 transition-all">
              A free-writing space for your quick thoughts, self-reflection, or ideas for later.
            </div>
          </div>
        </div>

        <textarea
          value={personalNotes}
          onChange={(e) => onUpdateNotes(e.target.value)}
          placeholder="Write down reflections, quick reminders, ideas, or stream of consciousness here..."
          className="flex-grow w-full bg-transparent resize-none text-xs text-slate-300 leading-relaxed outline-none border-none placeholder-slate-600 focus:placeholder-slate-400"
        />
      </div>
    </div>
  );
}
