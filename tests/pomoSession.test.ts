import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPomoSession,
  recordPomoClick,
  recordPomoDuration,
  clearPomoSession,
  buildHourlyChartData,
  PomoSessionData
} from '../src/lib/pomoSession';

describe('pomoSession library', () => {
  beforeEach(() => {
    // Clear session storage mock
    sessionStorage.clear();
  });

  it('getPomoSession returns empty structure initially', () => {
    const session = getPomoSession();
    expect(session.pomoClicks).toBe(0);
    expect(session.breakClicks).toBe(0);
    expect(session.pomoDuration).toBe(0);
    expect(session.breakDuration).toBe(0);
    expect(session.hourlyFocus).toEqual({});
    expect(session.hourlyBreak).toEqual({});
  });

  it('recordPomoClick correctly increments clicks', () => {
    recordPomoClick(false); // Focus
    let session = getPomoSession();
    expect(session.pomoClicks).toBe(1);
    expect(session.breakClicks).toBe(0);

    recordPomoClick(true); // Break
    session = getPomoSession();
    expect(session.pomoClicks).toBe(1);
    expect(session.breakClicks).toBe(1);
  });

  it('recordPomoDuration correctly increments durations', () => {
    recordPomoDuration(false, 300); // 5 minutes focus
    let session = getPomoSession();
    expect(session.pomoDuration).toBe(5);

    recordPomoDuration(true, 600); // 10 minutes break
    session = getPomoSession();
    expect(session.breakDuration).toBe(10);
  });

  it('buildHourlyChartData handles empty session', () => {
    const session = getPomoSession();
    const data = buildHourlyChartData(session);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].hour).toBe("08:00");
    expect(data[0].focus).toBe(0);
  });

  it('buildHourlyChartData handles populated session', () => {
    const hour = String(new Date().getHours());
    recordPomoDuration(false, 300); // 5 mins focus

    const session = getPomoSession();
    const data = buildHourlyChartData(session);
    
    // Find the current hour in chart
    const currentHourStr = `${hour.padStart(2, "0")}:00`;
    const hourData = data.find(d => d.hour === currentHourStr);
    
    expect(hourData).toBeDefined();
    expect(hourData?.focus).toBe(5);
  });
});
