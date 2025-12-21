import { Text } from '@mantine/core';
import styles from './styles/index.module.css';

export const SessionEmptyState = () => {
  return (
    <div className={styles.container}>
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.contentWrapper}>
        <section className={styles.mainContent}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Text size='lg' c='dimmed' mb='md'>
              Configure your event dates first
            </Text>
            <Text size='sm' c='dimmed'>
              {`Please set your event's start date and duration in the Event Settings to manage sessions.`}
            </Text>
          </div>
        </section>
      </div>
    </div>
  );
};
