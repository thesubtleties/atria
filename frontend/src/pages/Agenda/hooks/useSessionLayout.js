import { useMemo } from 'react';

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;

  // Handle "3:00 PM" format
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);

  let totalHours = hours;
  if (period === 'PM' && hours !== 12) {
    totalHours += 12;
  } else if (period === 'AM' && hours === 12) {
    totalHours = 0;
  }

  return totalHours * 60 + minutes;
}

function organizeTimeSlots(sessions) {
  // Sort ALL sessions strictly by start time
  const sorted = [...sessions].sort((a, b) => {
    return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
  });

  const rows = [];
  let currentTimeSlot = null;
  let currentSessions = [];

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

function balanceSessionRows(sessions) {
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
  const rows = [];
  for (let i = 0; i < sessions.length; i += 4) {
    rows.push(sessions.slice(i, Math.min(i + 4, sessions.length)));
  }

  return rows;
}

export function useSessionLayout(sessions) {
  const rows = useMemo(() => {
    return organizeTimeSlots(sessions);
  }, [sessions]);

  const getSessionWidth = (rowIndex) => {
    const row = rows[rowIndex];
    if (!row || row.length === 0) return '100%';
    // Add console.log to debug
    console.log('Width calc:', {
      rowIndex,
      rowLength: row.length,
      width: `${100 / row.length}%`,
    });
    return `${100 / row.length}%`;
  };

  function getSessionHeight(session) {
    if (!session?.start_time || !session?.end_time) {
      console.warn('Missing time data for session:', session);
      return 'auto'; // fallback height
    }

    const startMinutes = timeToMinutes(session.start_time);
    const endMinutes = timeToMinutes(session.end_time);

    // Add validation
    if (isNaN(startMinutes) || isNaN(endMinutes)) {
      console.warn('Invalid time format:', {
        start: session.start_time,
        end: session.end_time,
      });
      return 'auto';
    }

    const durationMinutes = endMinutes - startMinutes;
    return `${durationMinutes * 2}px`;
  }

  const getSessionTop = (session) => {
    if (!session?.start_time) return '0px';
    const dayStart = timeToMinutes('09:00');
    const sessionStart = timeToMinutes(session.start_time);
    const offsetMinutes = sessionStart - dayStart;
    // Add console.log to debug
    console.log('Top calc:', {
      session: session.title,
      sessionStart,
      dayStart,
      offset: offsetMinutes,
      top: `${offsetMinutes * 2}px`,
    });
    return `${offsetMinutes * 2}px`;
  };

  return {
    rows,
    getSessionWidth,
    getSessionHeight,
    getSessionTop,
    isKeynote: (session) => session?.session_type === 'KEYNOTE',
  };
}
