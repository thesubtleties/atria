import { format, parseISO, addDays } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';

interface SessionTimeResult {
  eventTime: string;
  userTime: string | null;
  showUserTime: boolean;
  timezone: string;
  eventTimezone?: string;
}

export const formatSessionTime = (
  timeStr: string,
  eventStartDate: string,
  dayNumber: number,
  eventTimezone: string,
): SessionTimeResult => {
  if (!timeStr || !eventStartDate || !dayNumber || !eventTimezone) {
    return { eventTime: '', userTime: null, showUserTime: false, timezone: '' };
  }

  try {
    // Calculate session date from event start + day offset
    const sessionDate = addDays(parseISO(eventStartDate), dayNumber - 1);
    const dateStr = format(sessionDate, 'yyyy-MM-dd');

    // Combine date + time for full datetime string in event timezone
    const dateTimeStr = `${dateStr}T${timeStr}`;

    // Parse the datetime string in the context of the event timezone
    // This creates a Date object that represents this time in the event's timezone
    const dateInEventTz = toDate(dateTimeStr, { timeZone: eventTimezone });

    // Format time without timezone abbreviation
    const eventTime = formatInTimeZone(dateInEventTz, eventTimezone, 'h:mm a');
    const eventTz = formatInTimeZone(dateInEventTz, eventTimezone, 'zzz');

    // Get user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // If same timezone, only show once
    if (userTimezone === eventTimezone) {
      return {
        eventTime,
        userTime: null,
        showUserTime: false,
        timezone: eventTz,
      };
    }

    // Format in user's timezone (without tz abbreviation)
    const userTime = formatInTimeZone(dateInEventTz, userTimezone, 'h:mm a');
    const userTz = formatInTimeZone(dateInEventTz, userTimezone, 'zzz');

    return {
      eventTime,
      userTime,
      showUserTime: true,
      timezone: userTz, // User's timezone abbreviation
      eventTimezone: eventTz, // Event's timezone abbreviation (for hover)
    };
  } catch (error) {
    console.error('Error formatting session time:', error);
    return { eventTime: timeStr, userTime: null, showUserTime: false, timezone: '' };
  }
};

export const getTimezoneAbbr = (dateTimeStr: string, timezone: string): string => {
  try {
    return formatInTimeZone(dateTimeStr, timezone, 'zzz');
  } catch (error) {
    console.error('Error getting timezone abbreviation:', error);
    return '';
  }
};
