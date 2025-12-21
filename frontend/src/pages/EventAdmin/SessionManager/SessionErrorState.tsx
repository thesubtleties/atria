import { Text } from '@mantine/core';
import { Button } from '@/shared/components/buttons';
import styles from './styles/index.module.css';

type SessionErrorStateProps = {
  onRetry: () => void;
};

export const SessionErrorState = ({ onRetry }: SessionErrorStateProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.contentWrapper}>
        <section className={styles.mainContent}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Text c='red' size='lg' mb='md'>
              Error loading event information
            </Text>
            <Button variant='primary' onClick={onRetry}>
              Retry
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};
