import { ActionCard } from './ActionCard';
import styles from './styles/index.module.css';

export const NewUserLanding = () => {
  return (
    <div className={styles.container}>
      <h2>Are you here to</h2>
      <div className={styles.actions}>
        <ActionCard
          title="Make an Event?"
          description="Create your organization and start hosting events"
          to="/app/organizations/new"
        />
        <ActionCard
          title="Attend an Event?"
          description="Join an existing event"
          to="/app/events/join"
        />
      </div>
    </div>
  );
};
