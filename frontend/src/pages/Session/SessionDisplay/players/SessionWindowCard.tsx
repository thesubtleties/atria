import { Stack, Text } from '@mantine/core';
import { IconClock, IconCheck } from '@tabler/icons-react';
import { cn } from '@/lib/cn';
import { formatSessionTime } from '@/shared/utils/timezone';
import styles from '../styles/index.module.css';

type SessionWindowCardProps = {
  windowState: 'pre' | 'post';
  sessionStartTime?: string | undefined;
  eventStartDate?: string | undefined;
  dayNumber?: number | undefined;
  eventTimezone?: string | undefined;
  visibilityMinutes?: number | null | undefined;
};

/**
 * SessionWindowCard - Placeholder card for when session visibility window is closed
 *
 * Pre-session: Shows "Session starts at X (Y event time). Room opens Z minutes before."
 * Post-session (no VOD): Shows check icon with "Thanks for attending" message
 */
export const SessionWindowCard = ({
  windowState,
  sessionStartTime,
  eventStartDate,
  dayNumber,
  eventTimezone,
  visibilityMinutes,
}: SessionWindowCardProps) => {
  // Format session start time with dual timezone display (like Agenda)
  const startTimes =
    sessionStartTime && eventStartDate && dayNumber && eventTimezone ?
      formatSessionTime(sessionStartTime, eventStartDate, dayNumber, eventTimezone)
    : null;

  if (windowState === 'pre') {
    return (
      <div className={cn(styles.messageContainer)}>
        <Stack align='center' gap='lg' style={{ width: '100%', maxWidth: '500px' }}>
          {/* Clock icon with soft purple glass */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconClock size={36} stroke={1.5} color='#8B5CF6' />
          </div>

          <Text size='xl' fw={600} style={{ color: 'var(--color-text-primary)' }}>
            Session Not Yet Available
          </Text>

          <Stack gap='xs' align='center'>
            {startTimes && (
              <Text size='sm' ta='center' style={{ color: 'var(--color-text-primary)' }}>
                Session starts at {startTimes.userTime || startTimes.eventTime}{' '}
                {startTimes.timezone}
                {startTimes.showUserTime && (
                  <Text span size='sm' style={{ color: 'var(--color-text-secondary)' }}>
                    {' '}
                    ({startTimes.eventTime} {startTimes.eventTimezone})
                  </Text>
                )}
              </Text>
            )}
            {visibilityMinutes ?
              <Text size='sm' ta='center' style={{ color: 'var(--color-text-secondary)' }}>
                Room opens {visibilityMinutes} minutes before
              </Text>
            : null}
          </Stack>

          <Text size='xs' ta='center' style={{ color: 'var(--color-text-muted)' }}>
            Please check back closer to the start time
          </Text>
        </Stack>
      </div>
    );
  }

  // Post-session state (no VOD available)
  return (
    <div className={cn(styles.messageContainer)}>
      <Stack align='center' gap='lg' style={{ width: '100%', maxWidth: '500px' }}>
        {/* Check icon with soft golden glass (from logo #FFD666) */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'rgba(255, 214, 102, 0.15)',
            border: '1px solid rgba(255, 214, 102, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconCheck size={36} stroke={2} color='#E5A800' />
        </div>

        <Text size='xl' fw={600} style={{ color: 'var(--color-text-primary)' }}>
          Thanks for Attending!
        </Text>

        <Text
          size='sm'
          ta='center'
          style={{ color: 'var(--color-text-secondary)', maxWidth: '400px' }}
        >
          This session has ended. Thank you for joining us.
        </Text>
      </Stack>
    </div>
  );
};
