import React from "react";
import { Mail, CheckCircle2, Circle, AlertCircle, Trash, RefreshCw, XCircle } from "lucide-react";
import { GmailMessage } from "../types";

interface NotificationsProps {
  messages: GmailMessage[];
  onMarkRead: (id: string, read: boolean) => void;
  onDeleteMessage: (id: string) => void;
  onSyncGmail: () => void;
  isSyncing: boolean;
  syncError: string | null;
  onClearError: () => void;
}

export default function NotificationsView({
  messages,
  onMarkRead,
  onDeleteMessage,
  onSyncGmail,
  isSyncing,
  syncError,
  onClearError,
}: NotificationsProps) {
  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 select-none animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            <span>Google Inbox & Notifications</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review important communication alerts and inbox messages synced from your Google Account.
          </p>
        </div>

        {/* ✅ SYNC GMAIL BUTTON */}
        <button
          onClick={onSyncGmail}
          disabled={isSyncing}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            isSyncing
              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 cursor-not-allowed"
              : "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 cursor-pointer"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync Gmail"}
        </button>
      </div>

      {/* ✅ ERROR BANNER */}
      {syncError && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300">{syncError}</p>
          </div>
          <button onClick={onClearError} className="text-rose-400 hover:text-rose-300 shrink-0">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="bg-[#121212] border border-white/5 rounded-[24px] shadow-2xl overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
          <span className="text-[10px] font-black text-slate-500 tracking-wider">
            GMAIL INBOX ({unreadCount} UNREAD)
          </span>
          {unreadCount > 0 && (
            <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/10 rounded-full font-bold">
              New Alerts Available
            </span>
          )}
        </div>

        {isSyncing ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-indigo-400 mx-auto animate-spin stroke-[1.5]" />
            <p className="text-xs font-bold text-slate-400 mt-3">Syncing Gmail...</p>
            <p className="text-[10px] text-slate-500 mt-1">Fetching your unread messages from Google.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-10 h-10 text-slate-700 mx-auto stroke-[1.5]" />
            <p className="text-xs font-bold text-slate-400 mt-3">No messages found</p>
            <p className="text-[10px] text-slate-500 mt-1">Click "Sync Gmail" above to fetch your unread emails.</p>
            <button
              onClick={onSyncGmail}
              className="mt-4 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition cursor-pointer flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Gmail Now
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.02]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  if (!msg.read) {
                    onMarkRead(msg.id, true);
                    window.open("https://mail.google.com/", "_blank");
                  } else {
                    onMarkRead(msg.id, !msg.read);
                  }
                }}
                className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition cursor-pointer group ${
                  msg.read ? "hover:bg-white/[0.01]" : "bg-indigo-500/5 hover:bg-indigo-500/10 px-3 -mx-3 rounded-xl"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1 shrink-0">
                    {msg.read ? (
                      <Circle className="w-3 h-3 text-slate-600 stroke-[1.5]" />
                    ) : (
                      <Circle className="w-3 h-3 text-indigo-400 fill-indigo-400 animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1 truncate">
                      <span className="text-xs font-bold text-slate-300 truncate">
                        {msg.from}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        • {msg.date}
                      </span>
                    </div>

                    <p className={`text-xs mt-0.5 truncate ${msg.read ? "text-slate-400" : "text-indigo-300 font-bold"}`}>
                      {msg.subject}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 truncate leading-relaxed">
                      {msg.snippet}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wellness & Habit check notifications */}
      <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex items-start gap-3 shadow-2xl">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide">Focus Coach Alert</h4>
          <p className="text-[11px] text-amber-400 leading-relaxed mt-1">
            "An empty mind is a restless mind. Claim a learning slot today in your Calendar and complete at least one 25-minute Pomodoro block to achieve Steady Anchor status."
          </p>
        </div>
      </div>
    </div>
  );
}
