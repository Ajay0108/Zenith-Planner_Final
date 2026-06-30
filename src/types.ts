export type TaskCategory =
  | "Urgent & Important"
  | "Important Not Urgent"
  | "Urgent Not Important"
  | "Not Urgent / Important"
  | "Ikigai"
  | "Personal Notes";

export interface Task {
  id: string;
  userId: string;
  title: string;
  category: TaskCategory;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
  completedAt?: string;
  deleted: boolean;
  deletedAt?: string;
  suggestedTimeline: string;
  notes: string;
  points: number;
  createdAt: string;
}

export type RankName =
  | "Restless Mind"
  | "Steady Anchor"
  | "Focus Alchemist"
  | "Zenith Architect";

export interface UserStats {
  userId: string;
  email: string;
  name: string;
  totalPoints: number;
  streak: number;
  pomoClicks: number;
  pomoDuration: number; // in minutes
  breakClicks: number;
  breakDuration: number; // in minutes
  rank: RankName;
  lastLogin?: string;
  persona?: string;       // focus persona (e.g., student, business, analyst, retired, other)
  customPersona?: string; // custom manually entered occupation
  dailyPoints?: Record<string, number>; // Points earned per day (YYYY-MM-DD)
}

export interface HabitDay {
  dateString: string; // YYYY-MM-DD
  status: "complete" | "miss" | "none";
  note?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO date string
  end: string;   // ISO date string
  description?: string;
}

export interface GmailMessage {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  read: boolean;
}
