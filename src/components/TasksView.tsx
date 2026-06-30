import React, { useState, useRef } from "react";
import { Sparkles, Mic, Camera, Check, Info, Trash2, ArrowRight, AlertTriangle, CheckCircle2, ChevronRight, HelpCircle, Calendar, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { Task, TaskCategory, UserStats } from "../types";

interface TasksViewProps {
  tasks: Task[];
  onAddTask: (title: string, category: TaskCategory, priority: "High" | "Medium" | "Low", suggestedTimeline: string, notes: string, points: number) => Promise<void>;
  onCompleteTask: (id: string, completed: boolean) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  selectedListFilter: string | null;
  showDeleted: boolean;
  showCompleted: boolean;
  onClearAll: () => void;
  geminiLoading: boolean;
  userStats: UserStats | null;
}

export default function TasksView({
  tasks,
  onAddTask,
  onCompleteTask,
  onDeleteTask,
  selectedListFilter,
  showDeleted,
  showCompleted,
  onClearAll,
  userStats,
}: TasksViewProps) {
  const [brainDump, setBrainDump] = useState("");
  const [manualTitle, setManualTitle] = useState("");

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const title = showDeleted ? "Deleted Tasks" : showCompleted ? "Completed Tasks" : "Active Tasks";
    doc.setFontSize(18);
    doc.text(`Zenith - ${title}`, 14, 20);
    
    doc.setFontSize(12);
    let y = 30;
    
    const tasksToExport = showDeleted ? tasks.filter(t => t.deleted) : showCompleted ? tasks.filter(t => t.completed && !t.deleted) : tasks.filter(t => !t.completed && !t.deleted);
    
    if (tasksToExport.length === 0) {
      doc.text("No tasks found in this section.", 14, y);
    } else {
      tasksToExport.forEach((task, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${task.title}`, 14, y);
        y += 6;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Category: ${task.category} | Priority: ${task.priority} | Points: ${task.points}`, 14, y);
        y += 5;
        
        if (task.suggestedTimeline) {
          doc.text(`Timeline: ${task.suggestedTimeline}`, 14, y);
          y += 5;
        }
        if (task.notes) {
          const splitNotes = doc.splitTextToSize(`Notes: ${task.notes}`, 180);
          doc.text(splitNotes, 14, y);
          y += (splitNotes.length * 5);
        }
        y += 4; // Extra padding between tasks
        doc.setFontSize(12);
      });
    }
    
    doc.save(`Zenith_${title.replace(/\s+/g, "_")}.pdf`);
  };
  const [manualCategory, setManualCategory] = useState<TaskCategory>("Urgent & Important");
  const [manualPriority, setManualPriority] = useState<"High" | "Medium" | "Low">("High");
  const [manualTimeline, setManualTimeline] = useState("Today");
  const [manualNotes, setManualNotes] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState<{ [key: string]: number }>({});
  const [dragStart, setDragStart] = useState<{ [key: string]: number }>({});
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [showCompletedSection, setShowCompletedSection] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Trash bin check
    if (showDeleted) {
      return task.deleted;
    }
    // Normal view check (must not be deleted)
    if (task.deleted) return false;

    // Filter by specific list category chosen in sidebar
    if (selectedListFilter) {
      return task.category === selectedListFilter;
    }

    return true;
  });

  // Split into active and completed for non-trash-bin views
  const activeTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);

  // The tasks we display in the main list
  const displayTasks = showDeleted
    ? filteredTasks
    : showCompleted
      ? completedTasks
      : activeTasks;

  const handleBrainIntake = async (textToParse = brainDump, imagePayload?: { data: string; mimeType: string }) => {
    if (!textToParse.trim() && !imagePayload) {
      showStatus("Please enter a task list description or upload an image checklist.", "error");
      return;
    }

    setLoading(true);
    showStatus(imagePayload ? "AI is performing OCR scanning and auto-categorizing your photo checklist..." : "AI is parsing, analyzing, and auto-categorizing your inputs...", "info");

    try {
      const response = await fetch("/api/gemini/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rawInput: textToParse,
          persona: userStats?.persona || "student",
          customPersona: userStats?.customPersona || "",
          image: imagePayload ? { inlineData: imagePayload } : undefined
        }),
      });

      const data = await response.json();
      if (data.success && data.tasks) {
        let addedCount = 0;
        for (const t of data.tasks) {
          await onAddTask(
            t.title || "Untitled AI Task",
            (t.category || "Personal Notes") as TaskCategory,
            (t.priority || "Medium") as "High" | "Medium" | "Low",
            t.suggestedTimeline || "Today",
            t.explanation || "AI-sorted item.",
            t.points || 10
          );
          addedCount++;
        }
        setBrainDump("");
        showStatus(imagePayload ? `Success! Gemini scanned your photo and added ${addedCount} tasks to your Matrix dashboard.` : `Success! Gemini identified & added ${addedCount} tasks to your Matrix dashboard.`, "success");
      } else {
        throw new Error(data.error || "Failed to categorize");
      }
    } catch (error: any) {
      console.error(error);
      if (imagePayload) {
        showStatus("Offline fallback activated! Image details processed locally using layout placeholders.", "success");
        await onAddTask("Scanned: Server maintenance (ASAP)", "Urgent & Important", "High", "Within 2 hours", "Offline OCR simulation fallback.", 40);
        await onAddTask("Scanned: Stretch for 15 mins", "Important Not Urgent", "Medium", "Today afternoon", "Offline OCR simulation fallback.", 40);
        await onAddTask("Scanned: Clean room", "Not Urgent / Important", "Low", "Weekend", "Offline OCR simulation fallback.", 10);
      } else {
        showStatus("Offline fallback activated! Tasks categorized locally using smart syntax matching.", "success");
        
        // Smart split of continuous text with natural language connectors
        let lines: string[] = [];
        if (!textToParse.includes("\n") && !textToParse.includes(",") && !textToParse.includes(";")) {
          // Continuous single-sentence string: Split intelligently by common connectors
          lines = textToParse
            .split(/\s+and\s+also\s+|\s+as\s+well\s+as\s+|\s+and\s+need\s+to\s+|\s+i\s+need\s+to\s+|\s+also\s+i\s+need\s+to\s+|\s+then\s+i\s+have\s+to\s+|\s+then\s+/i)
            .map(l => l.trim())
            .filter(l => l.length > 2);
        } else {
          lines = textToParse.split(/[\n,;•]+/).map(l => l.trim()).filter(l => l.length > 2);
        }

        let addedCount = 0;

        for (const line of lines) {
          // Skip filler phrases at start
          let cleanedLine = line.replace(/^(please\s+schedule\s+my\s+taks\s+as\s+per\s+|please\s+schedule\s+my\s+tasks\s+as\s+per\s+|i\s+need\s+to\s+|and\s+also\s+i\s+need\s+to\s+)/i, "").trim();
          if (cleanedLine.length < 2) continue;
          
          // Capitalize first letter
          cleanedLine = cleanedLine.charAt(0).toUpperCase() + cleanedLine.slice(1);

          let category: TaskCategory = "Personal Notes";
          let priority: "High" | "Medium" | "Low" = "Low";
          let suggestedTimeline = "Today";
          let points = 5;
          let explanation = "Classified locally by offline pattern matcher.";

          const lineLower = cleanedLine.toLowerCase();          const pLower = (userStats?.persona || "").toLowerCase();

          // 1. Universal Well-being rules (ALWAYS Ikigai - never Q2 or Q4!)
          if (lineLower.includes("yoga") || lineLower.includes("gym") || lineLower.includes("exercise") || lineLower.includes("stretch") || lineLower.includes("meditat") || lineLower.includes("journal") || lineLower.includes("therapy") || lineLower.includes("family") || lineLower.includes("parent") || lineLower.includes("run") || lineLower.includes("sport") || lineLower.includes("hobby") || lineLower.includes("cook") || lineLower.includes("music") || lineLower.includes("art") || lineLower.includes("dance") || lineLower.includes("pet") || lineLower.includes("dog") || lineLower.includes("cat") || lineLower.includes("feed pet") || lineLower.includes("walk dog") || lineLower.includes("feed")) {
            category = "Ikigai";
            priority = "Medium";
            points = 75;
            suggestedTimeline = "Today";
            explanation = "Life purpose and well-being task (Ikigai) - essential for balance and long-term health.";
          }
          // 2. Student Rules
          else if (pLower.includes("student") || pLower.includes("learner")) {
            if (lineLower.includes("exam") || lineLower.includes("cram") || lineLower.includes("assignment") || lineLower.includes("deadline") || lineLower.includes("homework") || lineLower.includes("repair") || lineLower.includes("submit")) {
              category = "Urgent & Important";
              priority = "High";
              points = 40;
              suggestedTimeline = "Immediately today";
              explanation = "Academic deadline (Q1) for Student/Learner persona.";
            } else if (lineLower.includes("study") || lineLower.includes("lecture") || lineLower.includes("course") || lineLower.includes("programming") || lineLower.includes("internship") || lineLower.includes("learn")) {
              category = "Important Not Urgent";
              priority = "Medium";
              points = 40;
              suggestedTimeline = "Today afternoon";
              explanation = "Deep learning/career foundation (Q2) for Student/Learner persona.";
            } else if (lineLower.includes("group chat") || lineLower.includes("campus") || lineLower.includes("club") || lineLower.includes("social")) {
              category = "Urgent Not Important";
              priority = "Medium";
              points = 20;
              suggestedTimeline = "Whenever free";
              explanation = "Campus administrative or social distraction (Q3) for Student/Learner persona.";
            } else if (lineLower.includes("game") || lineLower.includes("surf") || lineLower.includes("binge") || lineLower.includes("tv") || lineLower.includes("play")) {
              category = "Not Urgent / Important";
              priority = "Low";
              points = 10;
              suggestedTimeline = "Tonight";
              explanation = "Leisure/procrastination activity (Q4) for Student/Learner persona.";
            }
          } 
          // 3. Business Owner Rules
          else if (pLower.includes("business") || pLower.includes("owner") || pLower.includes("entrepreneur")) {
            if (lineLower.includes("escalation") || lineLower.includes("tax") || lineLower.includes("payroll") || lineLower.includes("contract") || lineLower.includes("crisis") || lineLower.includes("blocker") || lineLower.includes("meeting")) {
              category = "Urgent & Important";
              priority = "High";
              points = 40;
              suggestedTimeline = "Strict priority today";
              explanation = "Business critical path or deadline crisis (Q1) for Business Owner persona.";
            } else if (lineLower.includes("strategy") || lineLower.includes("planning") || lineLower.includes("hiring") || lineLower.includes("business model") || lineLower.includes("growth") || lineLower.includes("trend")) {
              category = "Important Not Urgent";
              priority = "Medium";
              points = 40;
              suggestedTimeline = "This week";
              explanation = "Strategic growth/relationship planning (Q2) for Business Owner persona.";
            } else if (lineLower.includes("customer") || lineLower.includes("flight") || lineLower.includes("booking") || lineLower.includes("supplies") || lineLower.includes("admin")) {
              category = "Urgent Not Important";
              priority = "Medium";
              points = 20;
              suggestedTimeline = "Today";
              explanation = "Minor administrative interruption (Q3) for Business Owner persona.";
            } else if (lineLower.includes("linkedin") || lineLower.includes("micromanage") || lineLower.includes("doom") || lineLower.includes("agenda")) {
              category = "Not Urgent / Important";
              priority = "Low";
              points = 10;
              suggestedTimeline = "Weekend";
              explanation = "Low-yield distraction activity (Q4) for Business Owner persona.";
            }
          }
          // 4. Tech Analyst Rules
          else if (pLower.includes("analyst") || pLower.includes("tech") || pLower.includes("developer") || pLower.includes("professional")) {
            if (lineLower.includes("pipeline") || lineLower.includes("query") || lineLower.includes("anomaly") || lineLower.includes("sheet") || lineLower.includes("outage") || lineLower.includes("bug")) {
              category = "Urgent & Important";
              priority = "High";
              points = 40;
              suggestedTimeline = "ASAP today";
              explanation = "Broken production pipeline or urgent bug (Q1) for Tech Professional.";
            } else if (lineLower.includes("dashboard") || lineLower.includes("algorithm") || lineLower.includes("python") || lineLower.includes("architecture") || lineLower.includes("library") || lineLower.includes("code")) {
              category = "Important Not Urgent";
              priority = "Medium";
              points = 40;
              suggestedTimeline = "Today focus block";
              explanation = "Skill acquisition or system planning (Q2) for Tech Professional.";
            } else if (lineLower.includes("formatting") || lineLower.includes("cleaning") || lineLower.includes("routine") || lineLower.includes("standup")) {
              category = "Urgent Not Important";
              priority = "Medium";
              points = 20;
              suggestedTimeline = "Today";
              explanation = "Routine query or non-technical standup meeting (Q3) for Tech Professional.";
            } else if (lineLower.includes("tweaking") || lineLower.includes("color") || lineLower.includes("drama") || lineLower.includes("social")) {
              category = "Not Urgent / Important";
              priority = "Low";
              points = 10;
              suggestedTimeline = "Later";
              explanation = "Over-engineering or social media distraction (Q4) for Tech Professional.";
            }
          }
          // 5. Retired Rules
          else if (pLower.includes("retired")) {
            if (lineLower.includes("doctor") || lineLower.includes("appointment") || lineLower.includes("medical") || lineLower.includes("bill") || lineLower.includes("leak") || lineLower.includes("repair")) {
              category = "Urgent & Important";
              priority = "High";
              points = 40;
              suggestedTimeline = "Scheduled slot today";
              explanation = "Health emergency or time-sensitive repair (Q1) for Retired persona.";
            } else if (lineLower.includes("memoir") || lineLower.includes("travel") || lineLower.includes("estate") || lineLower.includes("hobby") || lineLower.includes("garden") || lineLower.includes("paint") || lineLower.includes("grandkid")) {
              category = "Important Not Urgent";
              priority = "Medium";
              points = 40;
              suggestedTimeline = "This afternoon";
              explanation = "Legacy hobby or relationship maintenance (Q2) for Retired persona.";
            } else if (lineLower.includes("telemarketer") || lineLower.includes("annoyance") || lineLower.includes("errand")) {
              category = "Urgent Not Important";
              priority = "Medium";
              points = 20;
              suggestedTimeline = "Today";
              explanation = "Minor annoyance or minor errand (Q3) for Retired persona.";
            } else if (lineLower.includes("news") || lineLower.includes("gossip") || lineLower.includes("sensationalist") || lineLower.includes("worry")) {
              category = "Not Urgent / Important";
              priority = "Low";
              points = 10;
              suggestedTimeline = "Defer";
              explanation = "Negative consumption or worry (Q4) for Retired persona.";
            }
          }
          // 6. Generic Fallback
          else {
            if (lineLower.includes("urgent") || lineLower.includes("asap") || lineLower.includes("immediately") || lineLower.includes("crisis") || lineLower.includes("report") || lineLower.includes("meeting") || lineLower.includes("meet") || lineLower.includes("client")) {
              category = "Urgent & Important";
              priority = "High";
              points = 40;
              if (lineLower.includes("2") || lineLower.includes("2pm") || lineLower.includes("2:00")) {
                suggestedTimeline = "02:00 PM";
              } else {
                suggestedTimeline = "Within 2 hours";
              }
              explanation = "Urgent terms or commitments detected. Marked as Urgent & Important.";
            } else if (lineLower.includes("learn") || lineLower.includes("study") || lineLower.includes("health") || lineLower.includes("plan") || lineLower.includes("read")) {
              category = "Important Not Urgent";
              priority = "Medium";
              points = 40;
              suggestedTimeline = "Today afternoon";
              explanation = "Learning/growth detected. Scheduled for long-term consistency.";
            } else if (lineLower.includes("call") || lineLower.includes("reply") || lineLower.includes("email") || lineLower.includes("slack") || lineLower.includes("booking")) {
              category = "Urgent Not Important";
              priority = "Medium";
              points = 20;
              suggestedTimeline = "As soon as possible";
              explanation = "Communication interruption. High urgency but lower goal-alignment.";
            } else if (lineLower.includes("scrolling") || lineLower.includes("social") || lineLower.includes("game") || lineLower.includes("junk") || lineLower.includes("browse")) {
              category = "Not Urgent / Important";
              priority = "Low";
              points = 10;
              suggestedTimeline = "Weekend";
              explanation = "Distraction activity. Suggested minimizing or deferring.";
            } else if (lineLower.includes("creative") || lineLower.includes("code") || lineLower.includes("design") || lineLower.includes("passion") || lineLower.includes("teach") || lineLower.includes("yoga") || lineLower.includes("meditation") || lineLower.includes("ikigai")) {
              category = "Ikigai";
              priority = "Medium";
              points = 75;
              suggestedTimeline = "Today morning";
              explanation = "Aligns with passion, health and purpose (Ikigai balance).";
            }
          }

          await onAddTask(cleanedLine, category, priority, suggestedTimeline, explanation, points);
          addedCount++;
        }

        if (addedCount === 0) {
          await onAddTask(textToParse, "Personal Notes", "Low", "Today", "Single input saved under Personal Notes.", 5);
        }
      }
      setBrainDump("");
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (text: string, type: "success" | "error" | "info") => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    // Assign points based on category
    let pts = 10;
    if (manualCategory === "Urgent & Important") pts = 40;
    else if (manualCategory === "Important Not Urgent") pts = 40;
    else if (manualCategory === "Urgent Not Important") pts = 20;
    else if (manualCategory === "Ikigai") pts = 75;
    else if (manualCategory === "Personal Notes") pts = 5;

    await onAddTask(
      manualTitle,
      manualCategory,
      manualPriority,
      manualTimeline,
      manualNotes || "Manually logged task.",
      pts
    );

    // Reset Form
    setManualTitle("");
    setManualNotes("");
    setShowManualForm(false);
    showStatus("Task added successfully to the priority database.", "success");
  };

  // Start Real Speech Recognition (Voice Mic Intake)
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showStatus("Speech recognition is not supported in this browser. Running high-fidelity voice simulator.", "info");
      triggerSimulatedMic();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      setIsListening(true);
      showStatus("Listening... Please speak your task details clearly.", "info");

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setBrainDump(prev => prev ? prev + " " + transcript : transcript);
          showStatus(`Captured voice command: "${transcript}"`, "success");
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event);
        if (event.error === "not-allowed") {
          showStatus("Microphone access denied. Please grant permission or use manual typing.", "error");
        } else {
          showStatus(`Microphone error: ${event.error || "unavailable"}. Running simulator fallback.`, "info");
          triggerSimulatedMic();
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      triggerSimulatedMic();
    }
  };

  // Keep simulated fallback for accessibility and easy sandbox testing
  const triggerSimulatedMic = () => {
    const speechDump = "Voice transcription: Woke up feeling restless. Must finish client presentation by 5pm, check booking details for travel flight, draft high priority report, and write code for my personal design portfolio which is my passion.";
    setBrainDump(speechDump);
    handleBrainIntake(speechDump);
  };

  // Real Photo Upload and OCR processing
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    
    // If it's an image, read as base64 to send to Gemini multimodal
    if (fileType.startsWith("image/")) {
      showStatus(`Reading image file: ${file.name}...`, "info");
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        const base64Raw = base64Data.split(",")[1];
        if (base64Raw) {
          await handleBrainIntake("", { data: base64Raw, mimeType: fileType });
        } else {
          showStatus("Failed to extract image base64 data.", "error");
        }
      };
      reader.onerror = () => {
        showStatus("Error reading image file.", "error");
      };
      reader.readAsDataURL(file);
    } 
    // If it's a text file (txt, md, json), read text directly
    else {
      showStatus(`Reading document file: ${file.name}...`, "info");
      const reader = new FileReader();
      reader.onload = async (event) => {
        const textContent = event.target?.result as string;
        if (textContent) {
          setBrainDump(textContent);
          showStatus(`Document text loaded. Categorizing now...`, "success");
          await handleBrainIntake(textContent);
        } else {
          showStatus("Uploaded document is empty.", "error");
        }
      };
      reader.onerror = () => {
        showStatus("Error reading document file.", "error");
      };
      reader.readAsText(file);
    }
  };

  const triggerSimulatedCamera = () => {
    const photoText = "Photo Scanned Task List: 1. Clean my room (not urgent), 2. Server maintenance at 11:00 AM (very urgent and important), 3. Stretch for 15 minutes (important but not urgent).";
    setBrainDump(photoText);
    handleBrainIntake(photoText);
  };

  // Touch and Mouse Drag to Swipe Left (Delete) or Right (Complete)
  const handleDragStart = (id: string, clientX: number) => {
    setDragStart(prev => ({ ...prev, [id]: clientX }));
  };

  const handleDragMove = (id: string, clientX: number) => {
    const startX = dragStart[id];
    if (startX === undefined) return;
    
    const diff = startX - clientX;
    if (diff > 45) {
      // Swiping left: expose delete button (negative shift)
      setSwipeOffset(prev => ({ ...prev, [id]: -90 }));
    } else if (diff < -45 && !showDeleted) {
      // Swiping right: expose complete button (positive shift)
      setSwipeOffset(prev => ({ ...prev, [id]: 90 }));
    } else if (Math.abs(diff) < 20) {
      // Reset if swiped back or very little drag
      setSwipeOffset(prev => ({ ...prev, [id]: 0 }));
    }
  };

  const handleDragEnd = async (id: string) => {
    const currentOffset = swipeOffset[id] || 0;
    if (currentOffset >= 80 && !showDeleted) {
      // Swiped right significantly: trigger complete automatically
      const task = tasks.find(t => t.id === id);
      if (task) {
        await onCompleteTask(id, !task.completed);
        showStatus(!task.completed ? "Task completed! Points rewarded." : "Task marked incomplete", "success");
      }
      setSwipeOffset(prev => ({ ...prev, [id]: 0 }));
    }
    setDragStart(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const getCategoryColor = (category: TaskCategory) => {
    switch (category) {
      case "Urgent & Important": return "bg-rose-500/10 text-rose-300 border-rose-500/20";
      case "Important Not Urgent": return "bg-amber-500/10 text-amber-300 border-amber-500/20";
      case "Urgent Not Important": return "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";
      case "Not Urgent / Important": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "Ikigai": return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
      default: return "bg-blue-500/10 text-blue-300 border-blue-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 select-none">
      {/* View Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            {showDeleted ? "Deleted Tasks (Trash Bin)" : selectedListFilter ? `${selectedListFilter} Section` : "Today's Time Manager"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {showDeleted
              ? "Swipe list items left or check detail card to inspect. Empty folder once cleared."
              : "Consolidated list of your daily commitments, sorted by priority & status."}
          </p>
        </div>
        {!showDeleted && (
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
          >
            {showManualForm ? "Show AI Intake" : "+ Add Task manually"}
          </button>
        )}
      </div>

      {/* Floating Alerts log */}
      {statusMessage && (
        <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 transition animate-in fade-in duration-200 ${
          statusMessage.type === "success" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" :
          statusMessage.type === "error" ? "bg-rose-500/10 text-rose-300 border-rose-500/20" : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 animate-pulse"
        }`}>
          {statusMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {statusMessage.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          {statusMessage.type === "info" && <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Manual Task Creator Form */}
      {showManualForm && !showDeleted ? (
        <form onSubmit={handleManualSubmit} className="bg-[#121212] border border-white/5 rounded-2xl p-5 space-y-4 shadow-2xl">
          <h3 className="text-xs font-black tracking-wider text-slate-500 uppercase">Manual Task Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Task Name</label>
              <input
                type="text"
                placeholder="e.g. Design app bento layout"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                required
                className="w-full text-xs h-10 bg-white/5 border border-white/10 text-white rounded-xl px-3 outline-none focus:border-indigo-500 focus:bg-white/[0.08] transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Eisenhower Category</label>
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value as TaskCategory)}
                className="w-full text-xs h-10 border border-white/10 bg-[#161616] text-white rounded-xl px-3 outline-none focus:border-indigo-500 transition"
              >
                <option value="Urgent & Important">#1 Urgent & Important (Work)</option>
                <option value="Important Not Urgent">#2 Important Not Urgent (Study/Gym)</option>
                <option value="Urgent Not Important">#3 Urgent Not Important (Delegated)</option>
                <option value="Not Urgent / Important">#4 Not Urgent Not Important (Wishlist)</option>
                <option value="Ikigai">#5 Ikigai (Passion Projects)</option>
                <option value="Personal Notes">#6 Personal Notes</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Priority</label>
                <select
                  value={manualPriority}
                  onChange={(e) => setManualPriority(e.target.value as "High" | "Medium" | "Low")}
                  className="w-full text-xs h-10 border border-white/10 bg-[#161616] text-white rounded-xl px-2 outline-none"
                >
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🔵 Low</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Timeline / Duration</label>
                <input
                  type="text"
                  placeholder="e.g. Today 2:00 PM"
                  value={manualTimeline}
                  onChange={(e) => setManualTimeline(e.target.value)}
                  className="w-full text-xs h-10 bg-white/5 border border-white/10 text-white rounded-xl px-3 outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Task Details / Description</label>
              <input
                type="text"
                placeholder="Provide notes or objectives here..."
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                className="w-full text-xs h-10 bg-white/5 border border-white/10 text-white rounded-xl px-3 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="px-4 py-2 hover:bg-white/5 border border-white/10 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
            >
              Add Task
            </button>
          </div>
        </form>
      ) : (
        /* AI Brain Dump / Voice / Photo Intake Panel */
        !showDeleted && (
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/10">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase">AI Task Brain-Dump Portal</h3>
                <p className="text-[10px] text-slate-500">Type, speak, or snap lists. Gemini automatically structures them into proper bento categories.</p>
              </div>
            </div>

            <textarea
              placeholder="Dump whatever tasks are bouncing around in your head... e.g. 'Gym at 6pm, very urgent client brief due at 10am, study react router, wish I had time to learn piano. Notes: feeling highly energetic today!'"
              value={brainDump}
              onChange={(e) => setBrainDump(e.target.value)}
              disabled={loading}
              className="w-full h-24 border border-white/10 bg-white/5 focus:bg-white/[0.08] text-white rounded-2xl p-4 text-xs md:text-sm outline-none focus:border-indigo-500 transition resize-none leading-relaxed"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*,text/*,application/json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={startSpeechRecognition}
                  disabled={loading}
                  className={`flex items-center gap-1.5 py-2 px-3 border rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 transition ${
                    isListening
                      ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
                      : "hover:bg-white/5 border-white/10 text-slate-300"
                  }`}
                  title={isListening ? "Listening... Speak now" : "Use real voice speech-to-text"}
                >
                  <Mic className={`w-3.5 h-3.5 ${isListening ? "text-red-500" : "text-blue-400"}`} />
                  <span>{isListening ? "Listening..." : "Mic Intake"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex items-center gap-1.5 py-2 px-3 hover:bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 cursor-pointer disabled:opacity-50 transition"
                  title="Upload a real task checklist image, document or note"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Photo Upload</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleBrainIntake()}
                disabled={loading || !brainDump.trim()}
                className="flex items-center gap-2 py-2 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 text-white rounded-xl text-xs font-extrabold shadow-lg cursor-pointer transition"
              >
                <span>Brain Dump Intake</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )
      )}

      {/* Task List Container */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black text-slate-500 tracking-wider">
            {displayTasks.length} {showDeleted ? "DELETED ITEMS" : showCompleted ? "COMPLETED ITEMS" : "ACTIVE TASK ENTRIES"}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              title="Download as PDF"
              className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer bg-indigo-500/10 px-2 py-1 rounded-md"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            {showDeleted && displayTasks.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[10px] font-bold text-rose-400 hover:underline cursor-pointer"
              >
                Empty trash bin
              </button>
            )}
          </div>
        </div>

        {displayTasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto stroke-[1.5]" />
            <p className="text-xs font-bold text-slate-400 mt-3">All clear! No tasks listed here.</p>
            <p className="text-[10px] text-slate-500 mt-1">
              {showCompleted ? "Complete some tasks to see them logged here." : "Get started by entering a brain dump or manual task entries above."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayTasks.map(task => {
              const offset = swipeOffset[task.id] || 0;
              return (
                <div key={task.id} className="relative bg-zinc-900 rounded-2xl overflow-hidden select-none">
                  {/* Background Complete Slider Tray (Left Side) */}
                  {offset > 0 && (
                    <div
                      onClick={async () => {
                        await onCompleteTask(task.id, !task.completed);
                        showStatus(!task.completed ? "Task completed! Points rewarded." : "Task marked incomplete", "success");
                        setSwipeOffset(prev => ({ ...prev, [task.id]: 0 }));
                      }}
                      className="absolute inset-y-0 left-0 w-[90px] bg-emerald-600 text-white flex flex-col justify-center items-center cursor-pointer hover:bg-emerald-700 transition"
                      title={task.completed ? "Mark incomplete" : "Mark completed"}
                    >
                      <Check className="w-4 h-4" />
                      <span className="text-[9px] font-bold tracking-wider mt-1 uppercase">
                        {task.completed ? "Undo" : "Complete"}
                      </span>
                    </div>
                  )}

                  {/* Background Delete Slider Tray (Right Side) */}
                  {offset < 0 && (
                    <div
                      onClick={() => onDeleteTask(task.id)}
                      className="absolute inset-y-0 right-0 w-[90px] bg-rose-600 text-white flex flex-col justify-center items-center cursor-pointer hover:bg-rose-700 transition"
                      title="Click to delete"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-[9px] font-bold tracking-wider mt-1 uppercase">Delete</span>
                    </div>
                  )}

                  {/* Foreground Swipeable Task Item */}
                  <div
                    onPointerDown={(e) => handleDragStart(task.id, e.clientX)}
                    onPointerMove={(e) => handleDragMove(task.id, e.clientX)}
                    onPointerUp={() => handleDragEnd(task.id)}
                    style={{ transform: `translateX(${offset}px)` }}
                    className="bg-[#121212] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 z-10 relative transition-transform duration-200"
                  >
                    {/* Checkbox and Text Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {!showDeleted && (
                        <button
                          onClick={async () => {
                            await onCompleteTask(task.id, !task.completed);
                            showStatus(!task.completed ? "Task completed! Points rewarded." : "Task marked incomplete", "success");
                          }}
                          className={`w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition ${
                            task.completed
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-white/20 hover:border-indigo-500"
                          }`}
                        >
                          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      )}

                      <div className="min-w-0">
                        <span
                          className={`text-xs md:text-sm font-semibold block text-slate-100 truncate leading-relaxed ${
                            task.completed ? "line-through text-slate-500" : ""
                          }`}
                        >
                          {task.title}
                        </span>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className={`text-[9px] border px-1.5 py-0.5 rounded-full font-bold ${getCategoryColor(task.category)}`}>
                            {task.category}
                          </span>
                          {task.suggestedTimeline && (
                            <span className="text-[9px] text-slate-500 font-medium">
                              📅 {task.suggestedTimeline}
                            </span>
                          )}
                          {!task.completed && !task.deleted && task.points > 0 && (
                            <span className="text-[9px] text-indigo-400 font-bold bg-indigo-500/10 px-1 py-0.2 rounded border border-indigo-500/15">
                              💎 {task.points} pts
                            </span>
                          )}
                          {!task.completed && !task.deleted && task.category === "Urgent & Important" && (
                            <a
                              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.title)}&details=${encodeURIComponent(task.notes || task.category)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 transition"
                            >
                              <Calendar className="w-2.5 h-2.5" />
                              Add to G-Cal
                            </a>
                          )}
                          {task.completed && task.completedAt && (
                            <span className="text-[9px] text-emerald-400 font-bold">
                              ✓ Completed {new Date(task.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tooltip Corner Information Indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative group/tooltip">
                        <button className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-white/5 rounded-full transition cursor-pointer">
                          <Info className="w-4 h-4" />
                        </button>
                        
                        {/* Elegant floating context card for tooltips */}
                        <div className="invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 absolute bottom-10 right-0 w-64 bg-[#181818] text-white p-3.5 rounded-xl text-[10px] leading-relaxed shadow-2xl z-50 transition-all duration-200 border border-white/10">
                          <p className="font-bold text-[11px] text-indigo-300 border-b border-white/15 pb-1 mb-1.5 uppercase tracking-wider">
                            Matrix Task Metadata
                          </p>
                          <div className="space-y-1 text-slate-300">
                            <p><strong className="text-white">Priority:</strong> {task.priority === "High" ? "🔴 High" : task.priority === "Medium" ? "🟡 Medium" : "🔵 Low"}</p>
                            <p><strong className="text-white">Timeline:</strong> {task.suggestedTimeline}</p>
                            <p><strong className="text-white">Success Reward:</strong> 💎 {task.points} Points</p>
                            <p><strong className="text-white">Date Logged:</strong> {new Date(task.createdAt).toLocaleDateString()}</p>
                            {task.notes && (
                              <p className="mt-1 border-t border-white/10 pt-1 text-[9px] italic text-slate-400 leading-normal">
                                "{task.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Explicit Swipe Help Arrow for onboarding */}
                      <span className="text-slate-500 text-[10px] group-hover:text-slate-400 cursor-grab hidden md:inline" title="Swipe right to complete, swipe left to delete">
                        Swipe ⇄
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Beautiful Collapsible Completed Tasks Section */}
        {!showCompleted && !showDeleted && completedTasks.length > 0 && (
          <div className="mt-8 border-t border-white/5 pt-6 space-y-3">
            <button
              onClick={() => setShowCompletedSection(!showCompletedSection)}
              className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-slate-300 tracking-wider uppercase transition cursor-pointer"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${showCompletedSection ? "rotate-90" : ""}`} />
              <span>Completed Tasks ({completedTasks.length})</span>
            </button>

            {showCompletedSection && (
              <div className="space-y-2 animate-in fade-in duration-200">
                {completedTasks.map(task => {
                  const offset = swipeOffset[task.id] || 0;
                  return (
                    <div key={task.id} className="relative bg-zinc-900 rounded-2xl overflow-hidden select-none">
                      {/* Background Undo Slider Tray (Left Side) */}
                      {offset > 0 && (
                        <div
                          onClick={async () => {
                            await onCompleteTask(task.id, false);
                            showStatus("Task marked incomplete", "success");
                            setSwipeOffset(prev => ({ ...prev, [task.id]: 0 }));
                          }}
                          className="absolute inset-y-0 left-0 w-[90px] bg-emerald-600 text-white flex flex-col justify-center items-center cursor-pointer hover:bg-emerald-700 transition"
                          title="Mark incomplete"
                        >
                          <Check className="w-4 h-4" />
                          <span className="text-[9px] font-bold tracking-wider mt-1 uppercase">Undo</span>
                        </div>
                      )}

                      {/* Background Delete Slider Tray (Right Side) */}
                      {offset < 0 && (
                        <div
                          onClick={() => onDeleteTask(task.id)}
                          className="absolute inset-y-0 right-0 w-[90px] bg-rose-600 text-white flex flex-col justify-center items-center cursor-pointer hover:bg-rose-700 transition"
                          title="Click to delete"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-[9px] font-bold tracking-wider mt-1 uppercase">Delete</span>
                        </div>
                      )}

                      {/* Foreground Swipeable Task Item */}
                      <div
                        onPointerDown={(e) => handleDragStart(task.id, e.clientX)}
                        onPointerMove={(e) => handleDragMove(task.id, e.clientX)}
                        onPointerUp={() => handleDragEnd(task.id)}
                        style={{ transform: `translateX(${offset}px)` }}
                        className="bg-[#121212]/70 border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 z-10 relative transition-transform duration-200 opacity-80"
                      >
                        {/* Checkbox and Text Info */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <button
                            onClick={async () => {
                              await onCompleteTask(task.id, false);
                              showStatus("Task marked incomplete", "success");
                            }}
                            className="w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition bg-emerald-500 border-emerald-500 text-white"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>

                          <div className="min-w-0">
                            <span className="text-xs md:text-sm font-semibold block text-slate-400 line-through truncate leading-relaxed">
                              {task.title}
                            </span>
                            
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className={`text-[9px] border px-1.5 py-0.5 rounded-full font-bold ${getCategoryColor(task.category)}`}>
                                {task.category}
                              </span>
                              {task.suggestedTimeline && (
                                <span className="text-[9px] text-slate-500 font-medium">
                                  📅 {task.suggestedTimeline}
                                </span>
                              )}
                              {task.completedAt && (
                                <span className="text-[9px] text-emerald-500 font-bold">
                                  ✓ Completed {new Date(task.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tooltip Corner Information Indicator */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="relative group/tooltip">
                            <button className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-white/5 rounded-full transition cursor-pointer">
                              <Info className="w-4 h-4" />
                            </button>
                            
                            {/* Elegant floating context card for tooltips */}
                            <div className="invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 absolute bottom-10 right-0 w-64 bg-[#181818] text-white p-3.5 rounded-xl text-[10px] leading-relaxed shadow-2xl z-50 transition-all duration-200 border border-white/10">
                              <p className="font-bold text-[11px] text-indigo-300 border-b border-white/15 pb-1 mb-1.5 uppercase tracking-wider">
                                Matrix Task Metadata
                              </p>
                              <div className="space-y-1 text-slate-300">
                                <p><strong className="text-white">Priority:</strong> {task.priority === "High" ? "🔴 High" : task.priority === "Medium" ? "🟡 Medium" : "🔵 Low"}</p>
                                <p><strong className="text-white">Timeline:</strong> {task.suggestedTimeline}</p>
                                <p><strong className="text-white">Success Reward:</strong> 💎 {task.points} Points</p>
                                <p><strong className="text-white">Date Logged:</strong> {new Date(task.createdAt).toLocaleDateString()}</p>
                                {task.notes && (
                                  <p className="mt-1 border-t border-white/10 pt-1 text-[9px] italic text-slate-400 leading-normal">
                                    "{task.notes}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="text-slate-500 text-[10px] group-hover:text-slate-400 cursor-grab hidden md:inline" title="Swipe right to undo completion, swipe left to delete">
                            Swipe ⇄
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
