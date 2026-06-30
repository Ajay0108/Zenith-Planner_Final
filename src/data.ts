import { CalendarEvent, GmailMessage, HabitDay, Task } from "./types";

export const initialCalendarEvents: CalendarEvent[] = [
  {
    id: "e-sc1",
    title: "SQL Practice Round",
    start: "2026-06-23T09:00:00.000Z",
    end: "2026-06-23T11:00:00.000Z",
    description: "Database querying techniques and interview questions practice."
  },
  {
    id: "e-sc2",
    title: "Hackathon Phase 1",
    start: "2026-06-23T14:00:00.000Z",
    end: "2026-06-23T16:00:00.000Z",
    description: "Initial brain-storming, scoping, and environment setup."
  },
  {
    id: "e-sc3",
    title: "Python Coding Basics",
    start: "2026-06-23T18:30:00.000Z",
    end: "2026-06-23T20:30:00.000Z",
    description: "Variables, structures, loops, and basic module functions review."
  },
  {
    id: "e-sc4",
    title: "Python Problem Solving",
    start: "2026-06-24T09:00:00.000Z",
    end: "2026-06-24T11:00:00.000Z",
    description: "LeetCode medium challenges and logic optimizations."
  },
  {
    id: "e-sc5",
    title: "Hackathon Phase 2",
    start: "2026-06-24T14:00:00.000Z",
    end: "2026-06-24T16:00:00.000Z",
    description: "Component construction, dark theme UI, and state integrations."
  },
  {
    id: "e-sc6",
    title: "Turing Mock Practice & Review",
    start: "2026-06-24T18:30:00.000Z",
    end: "2026-06-24T20:30:00.000Z",
    description: "Interactive mock trial sessions with focus coaches."
  },
  {
    id: "e-sc7",
    title: "Quick Revision (SQL & Python)",
    start: "2026-06-25T09:00:00.000Z",
    end: "2026-06-25T11:00:00.000Z",
    description: "Refining queries, standard libraries, and common algos."
  },
  {
    id: "e-sc8",
    title: "Hackathon Wrap-up",
    start: "2026-06-25T12:30:00.000Z",
    end: "2026-06-25T14:30:00.000Z",
    description: "Final features checkout, build check, and performance test."
  },
  {
    id: "e-sc9",
    title: "Muharram/Ashura (tentative)",
    start: "2026-06-26T00:00:00.000Z",
    end: "2026-06-26T23:59:59.000Z",
    description: "Public Holiday"
  }
];

export const initialGmailMessages: GmailMessage[] = [
  {
    id: "m1",
    from: "Google AI Studio Team <noreply@google.com>",
    subject: "Your Time Management Applet is Live!",
    snippet: "Congratulations! Your full-stack time management dashboard has been successfully deployed with Google Gemini integrations.",
    date: "10:42 AM",
    read: false,
  },
  {
    id: "m2",
    from: "Alex Johnson <alex.j@work.com>",
    subject: "Feedback on Eisenhower Matrix layout",
    snippet: "Hey, the new bento box representation of tasks with Ikigai classification looks exceptionally minimalist. Let's launch!",
    date: "Yesterday",
    read: true,
  },
  {
    id: "m3",
    from: "Fitbit Weekly Digest <weekly@fitbit.com>",
    subject: "Your focus heart-rate analysis",
    snippet: "Your resting heart rate dropped during your deep focus work sessions. Keep up the Pomodoro breathing rhythm!",
    date: "Jun 24",
    read: true,
  }
];

export const publicHolidays = [
  { date: "Oct 12", name: "National Day Break", tooltip: "National Day Holiday" },
  { date: "Oct 28", name: "Seasonal Festival", tooltip: "Seasonal Festival" },
  { date: "Nov 05", name: "Mid-Term Break", tooltip: "Mid-Term Break" },
  { date: "Nov 11", name: "Memorial Day", tooltip: "Memorial Day" },
  { date: "Dec 22", name: "Winter Solstice", tooltip: "Winter Solstice" },
];

export const initialHabits: HabitDay[] = [
  { dateString: "2026-06-26", status: "complete", note: "Gym session completed! Feeling strong." },
  { dateString: "2026-06-25", status: "complete", note: "Woke up early, drank water, read 10 pages." },
  { dateString: "2026-06-24", status: "miss", note: "Felt exhausted, skipped meditation." },
  { dateString: "2026-06-23", status: "complete", note: "Cleaned room and stayed focused for 4 pomodoros." },
  { dateString: "2026-06-22", status: "miss", note: "Ate junk food after client call stress." },
  { dateString: "2026-06-21", status: "complete", note: "Solid rest day but completed stretching." },
  { dateString: "2026-06-20", status: "complete", note: "Studied CSS grids and react transitions." },
  { dateString: "2026-06-19", status: "complete", note: "Perfect productivity score!" },
  { dateString: "2026-06-18", status: "miss", note: "Got distracted scrolling on social media." },
  { dateString: "2026-06-17", status: "complete", note: "Finished quarterly task board preparation." },
  { dateString: "2026-06-16", status: "complete", note: "Walked 10k steps and replied to all emails." },
  { dateString: "2026-06-15", status: "miss", note: "Forgot to journal before bedtime." },
  { dateString: "2026-06-14", status: "complete", note: "Read 20 pages and finished presentation." },
  { dateString: "2026-06-13", status: "complete", note: "Felt very productive, 6 pomodoros!" },
  { dateString: "2026-06-12", status: "complete", note: "Woke up at 6am on the dot." }
];

export const initialTasksList = (userId: string): Task[] => [
  {
    id: "init-1",
    userId,
    title: "Finish AI Integration Module",
    category: "Urgent & Important",
    priority: "High",
    completed: false,
    deleted: false,
    suggestedTimeline: "10:00 AM - 12:00 PM",
    notes: "Code review and bug fixing for the new AI features.",
    points: 40,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "init-2",
    userId,
    title: "Pay Electricity Bill",
    category: "Urgent Not Important",
    priority: "Medium",
    completed: false,
    deleted: false,
    suggestedTimeline: "Today 05:00 PM",
    notes: "Pay via online portal before due date.",
    points: 20,
    createdAt: new Date().toISOString()
  },
  {
    id: "init-3",
    userId,
    title: "Read 'Atomic Habits'",
    category: "Important Not Urgent",
    priority: "Low",
    completed: false,
    deleted: false,
    suggestedTimeline: "Weekend",
    notes: "Read chapters 4 and 5.",
    points: 40,
    createdAt: new Date().toISOString()
  },
  {
    id: "init-4",
    userId,
    title: "Call Internet Provider",
    category: "Not Urgent / Important",
    priority: "Medium",
    completed: false,
    deleted: false,
    suggestedTimeline: "Tomorrow",
    notes: "Ask about upgrading the bandwidth plan.",
    points: 10,
    createdAt: new Date().toISOString()
  },
  {
    id: "init-5",
    userId,
    title: "Learn UI/UX Prototyping",
    category: "Ikigai",
    priority: "High",
    completed: false,
    deleted: false,
    suggestedTimeline: "Today 4:00 PM",
    notes: "Create high-fidelity mockups for the new dashboard.",
    points: 75,
    createdAt: new Date().toISOString()
  },
  // --- Completed Tasks for Stats ---
  {
    id: "init-comp-1",
    userId,
    title: "Morning Workout",
    category: "Important Not Urgent",
    priority: "High",
    completed: true,
    deleted: false,
    suggestedTimeline: "07:00 AM",
    notes: "30 mins cardio + weights.",
    points: 50,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 1.5).toISOString()
  },
  {
    id: "init-comp-2",
    userId,
    title: "Team Sync Meeting",
    category: "Urgent & Important",
    priority: "High",
    completed: true,
    deleted: false,
    suggestedTimeline: "Yesterday 11:00 AM",
    notes: "Discussed Q3 deliverables.",
    points: 30,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 1.1).toISOString()
  },
  {
    id: "init-comp-3",
    userId,
    title: "Grocery Shopping",
    category: "Urgent Not Important",
    priority: "Medium",
    completed: true,
    deleted: false,
    suggestedTimeline: "Yesterday Evening",
    notes: "Bought vegetables, milk, eggs.",
    points: 20,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 1.2).toISOString()
  },
  {
    id: "init-comp-4",
    userId,
    title: "Fix Login Bug",
    category: "Urgent & Important",
    priority: "High",
    completed: true,
    deleted: false,
    suggestedTimeline: "Today Morning",
    notes: "Fixed the blur issue on the login screen.",
    points: 50,
    createdAt: new Date(Date.now() - 36000000).toISOString(),
    completedAt: new Date(Date.now() - 3600000).toISOString()
  },
  // --- Deleted Tasks ---
  {
    id: "init-del-1",
    userId,
    title: "Watch random YouTube videos",
    category: "Not Urgent / Important",
    priority: "Low",
    completed: false,
    deleted: true,
    suggestedTimeline: "Anytime",
    notes: "Removed to save time.",
    points: 0,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];
