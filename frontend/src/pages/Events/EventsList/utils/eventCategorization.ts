import { parseISO, startOfDay, endOfDay } from 'date-fns';
import type { Event } from '@/types/events';

type CategorizedEvents = {
  live: Event[];
  upcoming: Event[];
  past: Event[];
};

/**
 * Categorizes events into live, upcoming, and past
 */
export const categorizeEvents = (events: Event[]): CategorizedEvents => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const categorized: CategorizedEvents = {
    live: [],
    upcoming: [],
    past: [],
  };

  events.forEach((event) => {
    const startDate = parseISO(event.start_date);
    const endDate = parseISO(event.end_date);

    // Check if event is happening today
    if (startDate <= todayEnd && endDate >= todayStart) {
      categorized.live.push(event);
    }
    // Check if event is in the future
    else if (startDate > now) {
      categorized.upcoming.push(event);
    }
    // Otherwise it's in the past
    else {
      categorized.past.push(event);
    }
  });

  // Sort events within each category
  // Live: by start time (earliest first)
  categorized.live.sort(
    (a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime(),
  );

  // Upcoming: by start date (soonest first)
  categorized.upcoming.sort(
    (a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime(),
  );

  // Past: by end date (most recent first)
  categorized.past.sort((a, b) => parseISO(b.end_date).getTime() - parseISO(a.end_date).getTime());

  return categorized;
};

type EventStatusLabel = 'Live Now' | 'Coming Soon' | 'Ended';

/**
 * Get a status label for an event based on its dates
 */
export const getEventStatusLabel = (event: Event): EventStatusLabel => {
  const now = new Date();
  const startDate = parseISO(event.start_date);
  const endDate = parseISO(event.end_date);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (startDate <= todayEnd && endDate >= todayStart) {
    return 'Live Now';
  } else if (startDate > now) {
    return 'Coming Soon';
  } else {
    return 'Ended';
  }
};
