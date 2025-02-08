// src/pages/Agenda/AgendaView/index.jsx
import { useSessionLayout } from './hooks/useSessionLayout';
import { SessionCard } from './SessionCard';
import { useEffect } from 'react';
import styles from './styles/index.module.css';

// src/pages/Agenda/AgendaView/index.jsx
export const AgendaView = ({ sessions }) => {
  const { rows, getSessionWidth, getSessionHeight, getSessionTop, isKeynote } =
    useSessionLayout(sessions);
  // useEffect(() => {
  //   console.log(
  //     'Session data:',
  //     sessions.map((session) => ({
  //       title: session.title,
  //       start: session.start_time,
  //       end: session.end_time,
  //       type: session.session_type,
  //     }))
  //   );
  // }, [sessions]);

  return (
    <div className={styles.container}>
      <div className={styles.agendaGrid}>
        {rows.map((row, rowIndex) => {
          const rowTop = getSessionTop(row[0]); // Get top position from first session in row
          console.log(`Row ${rowIndex} top:`, rowTop);

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
