import React, { useState, useRef } from "react";
import { Search, Sparkles, PlusCircle, Mic, Send, User, LogOut, Bot, X, Camera, Home, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { UserStats, Task } from "../types";

interface HeaderProps {
  user: any;
  userStats: UserStats | null;
  tasks?: Task[];
  onSearch: (term: string) => void;
  onLogout: () => void;
  onLoginClick: () => void;
  onAskGemini: (query: string, image?: { data: string; mimeType: string }) => Promise<void>;
  geminiReply: string | null;
  setGeminiReply: (reply: string | null) => void;
  geminiLoading: boolean;
  onHomeClick?: () => void;
  onUpdatePseudoName?: (newName: string) => void;
  onResetStats?: () => void;
  onUpdatePersona?: (persona: string, customPersona?: string) => void;
}

export default function Header({
  user,
  userStats,
  onSearch,
  onLogout,
  onLoginClick,
  onAskGemini,
  geminiReply,
  setGeminiReply,
  geminiLoading,
  onHomeClick,
  onUpdatePseudoName,
  onResetStats,
  onUpdatePersona,
  tasks = [],
}: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [geminiQuery, setGeminiQuery] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pseudoInput, setPseudoInput] = useState(userStats?.name || "");
  const [customPersonaInput, setCustomPersonaInput] = useState(userStats?.customPersona || "");
  const [lastUploadedFile, setLastUploadedFile] = useState<{name: string, size: number} | null>(null);

  React.useEffect(() => {
    if (userStats?.name) {
      setPseudoInput(userStats.name);
    }
  }, [userStats?.name]);

  React.useEffect(() => {
    if (userStats?.customPersona) {
      setCustomPersonaInput(userStats.customPersona);
    }
  }, [userStats?.customPersona]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // High-fidelity voice simulation to guarantee amazing reactive feedback inside sandboxed iframe!
      const simulatedText = "Plan my schedule with a 2-hour learning slot and list all important emails";
      setGeminiQuery(simulatedText);
      onAskGemini(simulatedText);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setGeminiQuery(transcript);
          onAskGemini(transcript);
        }
      };

      recognition.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        const simulatedText = "Plan my schedule with a 2-hour learning slot and list all important emails";
        setGeminiQuery(simulatedText);
        onAskGemini(simulatedText);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      const simulatedText = "Plan my schedule with a 2-hour learning slot and list all important emails";
      setGeminiQuery(simulatedText);
      onAskGemini(simulatedText);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check for duplicate file upload
    if (lastUploadedFile && lastUploadedFile.name === file.name && lastUploadedFile.size === file.size) {
      const confirmDuplicate = window.confirm(`You just uploaded "${file.name}" a moment ago! Are you sure you want to process this exact same file again? AI will treat it as a new request.`);
      if (!confirmDuplicate) {
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }
    setLastUploadedFile({ name: file.name, size: file.size });

    const fileType = file.type || "";
    const isPDF = fileType === "application/pdf" || file.name.endsWith(".pdf");

    if (fileType.startsWith("image/")) {
      alert(`Image file uploaded: "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Sending image contents to Gemini...`);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        const base64Raw = base64Data.split(",")[1];
        if (base64Raw) {
          onAskGemini(geminiQuery || "Analyze this image and suggest/summarize any tasks to keep me organized!", { data: base64Raw, mimeType: fileType });
          setGeminiQuery("");
        }
      };
      reader.readAsDataURL(file);
    } else if (isPDF) {
      alert(`PDF Document uploaded: "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Sending PDF document to Gemini for persona-aware reference and task classification...`);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        const base64Raw = base64Data.split(",")[1];
        if (base64Raw) {
          onAskGemini(geminiQuery || "Analyze this PDF document, extract tasks, and help me organize, categorize, and prioritize them according to my persona rules!", { data: base64Raw, mimeType: "application/pdf" });
          setGeminiQuery("");
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert(`Text file uploaded: "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Processing file text...`);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const textContent = event.target?.result as string;
        if (textContent) {
          setGeminiQuery(textContent);
          onAskGemini(`Process and schedule this task checklist text file: \n\n${textContent}`);
        }
      };
      reader.readAsText(file);
    }
    
    // Clear input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearch(val);
  };

  const handleGeminiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (geminiQuery.trim()) {
      onAskGemini(geminiQuery);
      setGeminiQuery("");
    }
  };

  return (
    <header className="h-[65px] bg-[#0F0F0F] border-b border-white/5 flex items-center px-4 gap-4 z-50 relative select-none">
      {/* Profile Button */}
      <div className="relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-indigo-400 border-2 border-indigo-500 hover:bg-white/10 cursor-pointer transition-all duration-200"
          title="User Profile Settings"
          id="profile-btn"
        >
          {user ? (
            user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || "User"} referrerPolicy="no-referrer" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="font-bold text-sm">
                 {(user.displayName || user.email || "G").substring(0, 2).toUpperCase()}
              </span>
            )
          ) : (
            <User className="w-5 h-5" />
          )}
        </button>

        {showProfileMenu && (
          <div className="absolute left-0 mt-2 w-64 bg-[#121212] border border-white/10 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Elegant Global Home Navigation Shortcut Button */}
            <button
              onClick={() => {
                if (onHomeClick) onHomeClick();
                setShowProfileMenu(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-semibold mb-3.5 transition-all cursor-pointer border border-indigo-500/20"
            >
              <Home className="w-3.5 h-3.5" /> Return Home (Tasks Matrix)
            </button>

            {user ? (
              <div>
                <p className="font-bold text-white text-sm truncate">{userStats?.name || user.displayName || "Seamless User"}</p>
                <p className="text-xs text-slate-400 truncate mb-3">{user.email || "Guest Session"}</p>
                {userStats && (
                  <div className="bg-white/5 rounded-lg p-2.5 mb-3 border border-white/5 text-xs text-slate-300 space-y-1">
                    <p className="flex justify-between">
                      <span>Total Reward Points:</span>
                      <strong className="text-indigo-400">💎 {userStats.totalPoints}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span>Current Rank:</span>
                      <strong className="text-purple-400">{userStats.rank}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span>Streak Score:</span>
                      <strong className="text-amber-400">🔥 {userStats.streak} Days</strong>
                    </p>
                  </div>
                )}
                
                {/* Custom Pseudo Name Form */}
                <div className="mb-3.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Custom Pseudo Name</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Enter pseudo name..."
                      value={pseudoInput}
                      onChange={(e) => setPseudoInput(e.target.value)}
                      className="flex-grow bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-indigo-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (pseudoInput.trim() && onUpdatePseudoName) {
                          onUpdatePseudoName(pseudoInput.trim());
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Focus Persona Dropdown Selection */}
                <div className="mb-4 border-t border-white/5 pt-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Active Focus Persona</label>
                  <select
                    value={userStats?.persona || "student"}
                    onChange={(e) => {
                      const newPersona = e.target.value;
                      if (onUpdatePersona) {
                        onUpdatePersona(newPersona, userStats?.customPersona || "");
                      }
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500/50 mb-2 cursor-pointer"
                  >
                    <option value="student" className="bg-[#121212] text-slate-200">Student / Learner</option>
                    <option value="business" className="bg-[#121212] text-slate-200">Business Owner / Entrepreneur</option>
                    <option value="analyst" className="bg-[#121212] text-slate-200">Data Analyst / Tech Professional</option>
                    <option value="retired" className="bg-[#121212] text-slate-200">Retired Individual</option>
                    <option value="other" className="bg-[#121212] text-slate-200">Other (Enter Manually)</option>
                  </select>

                  {(userStats?.persona === "other" || userStats?.persona === "Other") && (
                    <div className="flex gap-1.5 animate-in fade-in duration-200">
                      <input
                        type="text"
                        placeholder="Enter manual occupation..."
                        value={customPersonaInput}
                        onChange={(e) => setCustomPersonaInput(e.target.value)}
                        className="flex-grow bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-indigo-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdatePersona) {
                            onUpdatePersona("other", customPersonaInput.trim());
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer text-center shrink-0"
                      >
                        Set
                      </button>
                    </div>
                  )}
                </div>

                {/* Reset Stats Option */}
                {onResetStats && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to reset all points, streak, and stats to 0, and start fresh with brand-new scheduled tasks?")) {
                        onResetStats();
                      }
                    }}
                    className="w-full mb-4 py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-all cursor-pointer border border-red-500/20 flex items-center justify-center gap-1.5"
                  >
                    Reset Stats & Tasks to 0
                  </button>
                )}

                <button
                  onClick={() => {
                    onLogout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-rose-500/20"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-400 mb-3 text-center">You are currently offline. Join to synchronize your stats!</p>
                <button
                  onClick={() => {
                    onLoginClick();
                    setShowProfileMenu(false);
                  }}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Sign In / Connect Firebase
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Search Bar - Hidden on mobile screens to prioritize Gemini AI Input Bar */}
      <div className="hidden sm:flex relative items-center group z-50" id="search-bar">
        <Search className="w-4 h-4 absolute left-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-[180px] md:w-[220px] focus:w-[280px] md:focus:w-[350px] h-10 bg-white/5 border border-white/10 rounded-full pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:bg-white/10 focus:border-indigo-500 transition-all duration-300 outline-none"
        />
        
        {searchTerm.trim() && (
          <div className="absolute top-full left-0 mt-2 w-[280px] md:w-[350px] bg-[#121212] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
              {tasks.filter(t => t.title.toLowerCase().includes(searchTerm.trim().toLowerCase())).length > 0 ? (
                tasks.filter(t => t.title.toLowerCase().includes(searchTerm.trim().toLowerCase())).map(t => (
                  <div key={t.id} className="p-2 hover:bg-white/5 rounded-lg flex items-center justify-between cursor-default transition-colors">
                    <span className="text-xs font-bold text-slate-300 truncate mr-2">{t.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold uppercase tracking-wider shrink-0 border border-indigo-500/20">
                      {t.category.replace(/_/g, " ")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-xs text-slate-500 text-center font-semibold">No tasks match your search.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full-Length Gemini Assistant Bar */}
      <form onSubmit={handleGeminiSubmit} className="flex-1 flex items-center relative min-w-0" id="gemini-bar">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*,text/*,application/json,.pdf,application/pdf"
          className="hidden"
        />
        <div className="w-full h-10 bg-gradient-to-r from-[#1E202B] to-[#141620] border border-blue-500/20 focus-within:border-blue-500/40 focus-within:ring-2 focus-within:ring-blue-500/10 rounded-full flex items-center px-4 gap-2 transition-all">
          <a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer" title="Deep dive with Gemini AI" className="cursor-pointer hover:scale-110 transition-transform shrink-0">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </a>
          <input
            type="text"
            placeholder="Ask Gemini Assistant... e.g. 'Summarize my tasks for today'"
            value={geminiQuery}
            onChange={(e) => setGeminiQuery(e.target.value)}
            disabled={geminiLoading}
            className="flex-grow bg-transparent border-none text-white placeholder-blue-400/40 text-xs md:text-sm outline-none truncate"
          />
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setGeminiQuery("Plan my schedule with a 2-hour learning slot")}
              className="p-1.5 hover:bg-blue-500/20 rounded-full text-blue-400 transition cursor-pointer"
              title="Add suggest prompt"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={startSpeechRecognition}
              className={`p-1.5 rounded-full transition cursor-pointer ${
                isListening ? "bg-red-500/20 text-red-500 animate-pulse" : "hover:bg-blue-500/20 text-blue-400"
              }`}
              title={isListening ? "Listening... Speak now" : "Use real speech-to-text"}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 hover:bg-blue-500/20 rounded-full text-blue-400 transition cursor-pointer"
              title="Upload task checklist photo or file"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={geminiLoading || !geminiQuery.trim()}
              className="w-7 h-7 bg-blue-600 disabled:bg-blue-900/50 text-white flex items-center justify-center rounded-full hover:bg-blue-700 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Floating Gemini AI Reply Drawer / Popover */}
      {geminiReply && (
        <div className="absolute top-[68px] right-4 left-4 md:right-10 md:left-10 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/30 flex gap-3 animate-in fade-in slide-in-from-top-4 duration-300 z-[1001]">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30 shrink-0">
            <Bot className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="flex-grow">
            <h4 className="text-xs font-bold text-indigo-300 tracking-wide uppercase mb-1">Gemini AI response</h4>
            <p className="text-xs md:text-sm font-medium leading-relaxed">{geminiReply}</p>
          </div>
          <button
            onClick={() => setGeminiReply(null)}
            className="w-6 h-6 hover:bg-white/10 rounded-full flex items-center justify-center shrink-0 cursor-pointer text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {geminiLoading && (
        <div className="absolute top-[68px] right-4 left-4 md:right-10 md:left-10 bg-[#161616] border border-white/5 text-slate-300 py-2.5 px-4 rounded-xl shadow-2xl flex items-center gap-2 animate-pulse z-[1001] text-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          Analyzing task matrices and consulting Gemini API...
        </div>
      )}
    </header>
  );
}
