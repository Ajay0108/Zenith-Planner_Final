import React, { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

const STEPS = [
  { id: "profile-btn", title: "Your Profile & Persona", content: "Manage your cognitive rank, check your streak, and switch personas to adjust how the AI categorizes your tasks." },
  { id: "search-bar", title: "Universal Search", content: "Quickly find any task across your entire planner by searching its title or category." },
  { id: "gemini-bar", title: "Gemini AI Assistant", content: "Type commands, upload images/documents, or use voice-to-text. The AI will automatically extract and schedule tasks for you." },
  { id: "sidebar-nav", title: "Navigation Panel", content: "Switch between your Tasks, Dashboard Analytics, Pomodoro Timer, and Habit Tracker." },
];

export default function WalkthroughOverlay({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateRect = () => {
      const el = document.getElementById(STEPS[currentStep].id);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    // Give it a tiny delay to ensure DOM is rendered (like sidebar animation)
    const timeout = setTimeout(updateRect, 300);
    return () => {
      window.removeEventListener("resize", updateRect);
      clearTimeout(timeout);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!targetRect) {
    // Fallback if element not found: show a centered modal
    return (
      <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
        <div className="bg-[#121212] border border-indigo-500/30 p-6 rounded-2xl max-w-sm text-center">
          <h3 className="text-lg font-bold text-white mb-2">{STEPS[currentStep].title}</h3>
          <p className="text-sm text-slate-400 mb-6">{STEPS[currentStep].content}</p>
          <div className="flex justify-between">
            <button onClick={onComplete} className="text-xs font-bold text-slate-500 hover:text-white">Skip Tour</button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button onClick={handleBack} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5">Back</button>
              )}
              <button onClick={handleNext} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white flex items-center gap-1">
                {currentStep < STEPS.length - 1 ? "Next" : "Finish"} <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate position for tooltip (try to put it below, if no space put it above)
  const isBottomHalf = targetRect.bottom > window.innerHeight / 2;
  
  const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    left: Math.max(10, Math.min(window.innerWidth - 320, targetRect.left + (targetRect.width / 2) - 160)),
    top: isBottomHalf ? targetRect.top - 180 : targetRect.bottom + 20,
    zIndex: 10000,
  };

  const highlightStyle: React.CSSProperties = {
    position: "absolute",
    left: targetRect.left - 4,
    top: targetRect.top - 4,
    width: targetRect.width + 8,
    height: targetRect.height + 8,
    borderRadius: "12px",
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.75)",
    pointerEvents: "none",
    zIndex: 9998,
    transition: "all 0.3s ease-in-out",
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* Overlay highlight */}
      <div style={highlightStyle} />
      
      {/* Tooltip */}
      <div 
        style={tooltipStyle}
        className="w-[320px] bg-[#161616] border border-indigo-500/50 rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-black text-indigo-400">{STEPS[currentStep].title}</h3>
          <button onClick={onComplete} className="text-slate-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mb-5">
          {STEPS[currentStep].content}
        </p>
        
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentStep ? "bg-indigo-400" : "bg-white/10"}`} />
            ))}
          </div>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
               <button 
                onClick={handleBack}
                className="px-2.5 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold text-slate-300 hover:bg-white/5 flex items-center gap-1 transition-colors"
               >
                 <ChevronLeft className="w-3 h-3" /> Back
               </button>
            )}
            <button 
              onClick={handleNext}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold text-white flex items-center gap-1 transition-colors"
            >
              {currentStep < STEPS.length - 1 ? "Next" : "Got it!"} {currentStep < STEPS.length - 1 && <ChevronRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <button onClick={onComplete} className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 hover:text-white transition-colors">
          Skip full tour
        </button>
      </div>
    </div>
  );
}
