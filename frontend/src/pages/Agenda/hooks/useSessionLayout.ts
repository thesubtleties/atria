import { useMemo } from 'react';
import type { Session } from '@/types/events';

type SessionRow = Session[];

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;

  // Handle "3:00 PM" format
  const parts = timeStr.split(' ');
  const time = parts[0] || '';
  const period = parts[1];
  const timeParts = time.split(':').map(Number);
  const hours = timeParts[0] ?? 0;
  const minutes = timeParts[1] ?? 0;

  let totalHours = hours;
  if (period === 'PM' && hours !== 12) {
    totalHours += 12;
  } else if (period === 'AM' && hours === 12) {
    totalHours = 0;
  }

  return totalHours * 60 + minutes;
}

function organizeTimeSlots(sessions: Session[]): SessionRow[] {
  // Sort ALL sessions strictly by start time
  const sorted = [...sessions].sort((a, b) => {
    return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
  });

  const rows: SessionRow[] = [];
  let currentTimeSlot: number | null = null;
  let currentSessions: Session[] = [];

  // Group all concurrent sessions
  sorted?.forEach((session) => {
    const sessionStartTime = timeToMinutes(session.start_time);

    if (currentTimeSlot !== sessionStartTime) {
      if (currentSessions.length > 0) {
        // Organize current sessions into balanced rows
        const organizedRows = balanceSessionRows(currentSessions);
        rows.push(...organizedRows);
      }
      currentSessions = [session];
      currentTimeSlot = sessionStartTime;
    } else {
      currentSessions.push(session);
    }
  });

  // Handle the last group
  if (currentSessions.length > 0) {
    const organizedRows = balanceSessionRows(currentSessions);
    rows.push(...organizedRows);
  }

  return rows;
}

function balanceSessionRows(sessions: Session[]): SessionRow[] {
  if (sessions.length <= 4) {
    return [sessions];
  }

  // For 5 sessions: split into 3-2
  if (sessions.length === 5) {
    return [sessions.slice(0, 3), sessions.slice(3)];
  }

  // For 6 sessions: split into 3-3
  if (sessions.length === 6) {
    return [sessions.slice(0, 3), sessions.slice(3)];
  }

  // For 7 sessions: split into 4-3
  if (sessions.length === 7) {
    return [sessions.slice(0, 4), sessions.slice(4)];
  }

  // For 8 or more: split into rows of 4 until remainder
  const rows: SessionRow[] = [];
  for (let i = 0; i < sessions.length; i += 4) {
    rows.push(sessions.slice(i, Math.min(i + 4, sessions.length)));
  }

  return rows;
}

type UseSessionLayoutResult = {
  rows: SessionRow[];
  getSessionWidth: (rowIndex: number) => string;
  isKeynote: (session: Session) => boolean;
};

export function useSessionLayout(sessions: Session[]): UseSessionLayoutResult {
  const rows = useMemo(() => {
    return organizeTimeSlots(sessions);
  }, [sessions]);

  const getSessionWidth = (rowIndex: number): string => {
    const row = rows[rowIndex];
    if (!row || row.length === 0) return '100%';
    return `${100 / row.length}%`;
  };

  return {
    rows,
    getSessionWidth,
    isKeynote: (session: Session) => session?.session_type === 'keynote',
  };
}
