import { SessionCard } from './SessionCard';
import styles from './styles/index.module.css';

export const AgendaPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.agendaSection}>
        <SessionCard />
      </div>
    </div>
  );
};
