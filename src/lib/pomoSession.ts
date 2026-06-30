/**
 * pomoSession.ts
 * ─────────────────────────────────────────────────────────────────
 * Single source of truth for the current browser session's Pomodoro
 * data. Uses sessionStorage so data:
 *   ✅ Persists across page refreshes within the same tab
 *   ✅ Is cleared automatically when the browser/tab closes
 *   ✅ Can be explicitly cleared on logout
 * ─────────────────────────────────────────────────────────────────
 */

const SESSION_KEY = "pomo_session_data";

export interface PomoSessionData {
  pomoClicks: number;      // Focus sessions completed
  pomoDuration: number;    // Total focus minutes
  breakClicks: number;     // Break sessions completed
  breakDuration: number;   // Total leisure minutes
  /** Map of hour string ("0"–"23") → total minutes focused in that hour */
  hourlyFocus: Record<string, number>;
  /** Map of hour string ("0"–"23") → total leisure minutes in that hour */
  hourlyBreak: Record<string, number>;
}

const EMPTY: PomoSessionData = {
  pomoClicks: 0,
  pomoDuration: 0,
  breakClicks: 0,
  breakDuration: 0,
  hourlyFocus: {},
  hourlyBreak: {},
};

/** Read current session data (always fresh from sessionStorage) */
export function getPomoSession(): PomoSessionData {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return { ...EMPTY, hourlyFocus: {}, hourlyBreak: {} };
    return JSON.parse(raw) as PomoSessionData;
  } catch {
    return { ...EMPTY, hourlyFocus: {}, hourlyBreak: {} };
  }
}

/** Record just a click (when user starts a session) */
export function recordPomoClick(isBreak: boolean): PomoSessionData {
  const current = getPomoSession();
  const updated: PomoSessionData = isBreak
    ? { ...current, breakClicks: current.breakClicks + 1 }
    : { ...current, pomoClicks: current.pomoClicks + 1 };
  
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

/** Record elapsed duration (when user pauses, resets, or finishes) */
export function recordPomoDuration(isBreak: boolean, elapsedSeconds: number): PomoSessionData {
  const current = getPomoSession();
  const elapsedMins = elapsedSeconds / 60; // Keep accurate decimals internally
  const hour = String(new Date().getHours()); // "0" – "23"

  const updated: PomoSessionData = isBreak
    ? {
        ...current,
        breakDuration: current.breakDuration + elapsedMins,
        hourlyBreak: {
          ...current.hourlyBreak,
          [hour]: (current.hourlyBreak[hour] ?? 0) + elapsedMins,
        },
      }
    : {
        ...current,
        pomoDuration: current.pomoDuration + elapsedMins,
        hourlyFocus: {
          ...current.hourlyFocus,
          [hour]: (current.hourlyFocus[hour] ?? 0) + elapsedMins,
        },
      };

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

/** Wipe all session data (call on logout) */
export function clearPomoSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Build the 24-hour histogram data for the Dashboard bar chart.
 * Returns an array of { hour: "08:00", focus: 25, leisure: 10 }
 * covering every hour that has any activity, padded with a few
 * surrounding hours for visual context.
 */
export function buildHourlyChartData(
  session: PomoSessionData
): { hour: string; focus: number; leisure: number }[] {
  // Collect all hours that appear in focus or leisure maps
  const allHourNums = new Set<number>();

  Object.keys(session.hourlyFocus).forEach((h) => allHourNums.add(Number(h)));
  Object.keys(session.hourlyBreak).forEach((h) => allHourNums.add(Number(h)));

  // If no data yet, return a default empty spread (8 AM – 6 PM)
  if (allHourNums.size === 0) {
    return [8, 10, 12, 14, 16, 18].map((h) => ({
      hour: `${String(h).padStart(2, "0")}:00`,
      focus: 0,
      leisure: 0,
    }));
  }

  // Expand the range ±1 hour for visual padding
  const min = Math.max(0, Math.min(...allHourNums) - 1);
  const max = Math.min(23, Math.max(...allHourNums) + 1);

  const result: { hour: string; focus: number; leisure: number }[] = [];
  for (let h = min; h <= max; h++) {
    result.push({
      hour: `${String(h).padStart(2, "0")}:00`,
      focus: session.hourlyFocus[String(h)] ?? 0,
      leisure: session.hourlyBreak[String(h)] ?? 0,
    });
  }
  return result;
}
