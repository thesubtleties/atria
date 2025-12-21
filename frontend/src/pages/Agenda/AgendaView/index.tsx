// src/pages/Agenda/AgendaView/index.tsx
import { useSessionLayout } from '../hooks/useSessionLayout';
import { SessionCard } from '../SessionCard';
import type { Session } from '@/types/events';
import styles from './styles/index.module.css';

type AgendaViewProps = {
  sessions: Session[];
  eventStartDate: string;
  eventTimezone: string;
  isOrgView: boolean;
  orgId?: string | undefined;
  eventId?: string | undefined;
};

export const AgendaView = ({
  sessions,
  eventStartDate,
  eventTimezone,
  isOrgView,
  orgId,
  eventId,
}: AgendaViewProps) => {
  const { rows, getSessionWidth, isKeynote } = useSessionLayout(sessions);

  return (
    <div className={styles.container}>
      <div className={styles.glassmorphicWrapper}>
        <div className={styles.agendaGrid}>
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.sessionRow}>
              {row.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  eventStartDate={eventStartDate}
                  eventTimezone={eventTimezone}
                  isOrgView={isOrgView}
                  orgId={orgId}
                  eventId={eventId}
                  style={{
                    width: isKeynote(session) ? '100%' : getSessionWidth(rowIndex),
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgendaView;
