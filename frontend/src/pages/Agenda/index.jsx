import { AgendaView } from './AgendaView';
import styles from './styles/index.module.css';

export const AgendaPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.agendaSection}>
        <AgendaView />
      </div>
    </div>
  );
};
