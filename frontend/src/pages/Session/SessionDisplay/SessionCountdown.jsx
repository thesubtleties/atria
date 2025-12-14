import { useEffect, useState } from 'react';
import { Text, Stack } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import styles from './styles/index.module.css';

export const SessionCountdown = ({ startTime }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const difference = start - now;

      if (difference <= 0) {
        return 'Starting soon...';
      }

      // Calculate days, hours, minutes
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      return `${days}d ${hours}h ${minutes}m`;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every minute
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);

    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <div className={styles.countdownContainer}>
      <Stack align='center' spacing='md'>
        <IconClock size={48} stroke={1.5} />
        <Text size='xl' weight={500}>
          Session starts in
        </Text>
        <Text size='xxl' weight={700}>
          {timeLeft}
        </Text>
      </Stack>
    </div>
  );
};
