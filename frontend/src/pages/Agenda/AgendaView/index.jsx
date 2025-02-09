// src/pages/Agenda/AgendaView/index.jsx
import { useSessionLayout } from '../hooks/useSessionLayout';
import { SessionCard } from '../SessionCard';
import styles from './styles/index.module.css';

export const AgendaView = ({ sessions, isOrgView, orgId, eventId }) => {
  const { rows, getSessionWidth, getSessionHeight, getSessionTop, isKeynote } =
    useSessionLayout(sessions);

  return (
    <div className={styles.container}>
      <div className={styles.agendaGrid}>
        {rows.map((row, rowIndex) => {
          const rowTop = getSessionTop(row[0]);

          return (
            <div
              key={rowIndex}
              className={styles.sessionRow}
              style={{
                top: rowTop,
              }}
            >
              {row.map((session) => (
                <SessionCard
                  key={session.id}
                  {...session}
                  isOrgView={isOrgView}
                  orgId={orgId}
                  eventId={eventId}
                  style={{
                    width: isKeynote(session)
                      ? '100%'
                      : getSessionWidth(rowIndex),
                    height: getSessionHeight(session),
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgendaView;
