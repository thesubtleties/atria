import { useEffect, useState } from 'react';
import { Text, Stack } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';

type SessionCountdownProps = {
  startTime: string;
};

export const SessionCountdown = ({ startTime }: SessionCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = (): string => {
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
    <div className={cn(styles.countdownContainer)}>
      <Stack align='center' gap='md'>
        <IconClock size={48} stroke={1.5} />
        <Text size='xl' fw={500}>
          Session starts in
        </Text>
        <Text size='xl' fw={700}>
          {timeLeft}
        </Text>
      </Stack>
    </div>
  );
};
