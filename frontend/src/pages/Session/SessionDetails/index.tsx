import { Text, Group, Divider, ActionIcon } from '@mantine/core';
import { IconEdit, IconClock, IconCalendar } from '@tabler/icons-react';
import { useState } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { EditSessionModal } from '@/shared/components/modals/session/EditSessionModal';
import { formatSessionTime } from '@/shared/utils/timezone';
import type { SessionDetail, EventDetail } from '@/types/events';
import type { SessionStatus } from '@/types/enums';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type SessionWithLocation = SessionDetail & {
  location?: string;
};

type SessionDetailsProps = {
  session: SessionWithLocation;
  event: EventDetail | undefined;
  canEdit: boolean | undefined;
  onStatusChange?: (status: SessionStatus) => Promise<void>;
  onUpdate?: (updates: Partial<SessionDetail>) => Promise<void>;
};

export const SessionDetails = ({ session, event, canEdit }: SessionDetailsProps) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const getSessionDate = (): string => {
    if (!event?.start_date || !session.day_number) return '';
    // Calculate session date from event start + day offset
    const sessionDate = addDays(parseISO(event.start_date), session.day_number - 1);
    return format(sessionDate, 'MMMM d, yyyy');
  };

  // Format session times with timezone conversion
  const getFormattedTimes = (): { start: string; end: string; timezone: string } => {
    if (!session.start_time || !session.end_time || !event?.start_date || !event?.timezone) {
      return { start: '', end: '', timezone: '' };
    }

    const startTimes = formatSessionTime(
      session.start_time,
      event.start_date,
      session.day_number,
      event.timezone,
    );

    const endTimes = formatSessionTime(
      session.end_time,
      event.start_date,
      session.day_number,
      event.timezone,
    );

    return {
      start: startTimes.userTime || startTimes.eventTime,
      end: endTimes.userTime || endTimes.eventTime,
      timezone: startTimes.timezone, // Use timezone from start time
    };
  };

  const formattedTimes = getFormattedTimes();

  return (
    <div className={cn(styles.detailsSection)}>
      <Group gap='xl' className={cn(styles.detailsGrid)}>
        {/* Type - moved to first position */}
        <div className={cn(styles.typeTag, styles[session.session_type.toLowerCase()])}>
          {session.session_type.replace(/_/g, ' ')}
        </div>

        <Divider orientation='vertical' />

        {/* Date */}
        <Group gap='xs' align='center'>
          <IconCalendar size={16} stroke={1.5} color='#8B5CF6' />
          <Text size='sm' c='dimmed'>
            {getSessionDate()}
          </Text>
        </Group>

        <Divider orientation='vertical' />

        {/* Time */}
        <Group gap='xs' align='center'>
          <IconClock size={16} stroke={1.5} color='#8B5CF6' />
          <Text size='sm' c='dimmed'>
            {formattedTimes.start} - {formattedTimes.end} {formattedTimes.timezone}
          </Text>
          <Text size='xs' c='dimmed'>
            ({session.formatted_duration})
          </Text>
        </Group>

        {session.location && (
          <>
            <Divider orientation='vertical' />
            <Group gap='xs'>
              <Text size='xs' c='dimmed'>
                Location:
              </Text>
              <Text size='sm'>{session.location}</Text>
            </Group>
          </>
        )}

        {canEdit && (
          <ActionIcon
            size='sm'
            variant='subtle'
            onClick={() => setShowEditModal(true)}
            className={cn(styles.editButton)}
          >
            <IconEdit size={14} />
          </ActionIcon>
        )}
      </Group>

      <EditSessionModal
        session={session}
        opened={showEditModal}
        onClose={() => setShowEditModal(false)}
        isEditing={true}
      />
    </div>
  );
};
