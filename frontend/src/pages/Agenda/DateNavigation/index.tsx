// src/pages/Agenda/DateNavigation/index.tsx
import styles from './styles/index.module.css';
import { format, addDays } from 'date-fns';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { parseDateOnly } from '@/shared/hooks/formatDate';

type DateNavigationProps = {
  startDate: string;
  dayCount: number;
  currentDay: number;
  onDateChange: (day: number) => void;
};

export const DateNavigation = ({
  startDate,
  dayCount,
  currentDay,
  onDateChange,
}: DateNavigationProps) => {
  const parsedStartDate = parseDateOnly(startDate);
  if (!parsedStartDate) {
    return null;
  }
  const dates = Array.from({ length: dayCount }, (_, i) => addDays(parsedStartDate, i));

  const currentDate = dates[currentDay - 1];
  if (!currentDate) {
    return null;
  }

  return (
    <div className={styles.dateNavigation}>
      <div className={styles.dayNumber}>Day {currentDay}</div>
      <div className={styles.dateSelector}>
        <button
          className={styles.navButton}
          onClick={() => onDateChange(currentDay - 1)}
          disabled={currentDay === 1}
          aria-label='Previous day'
        >
          <IconChevronLeft size={20} stroke={1.5} />
        </button>
        <div className={styles.currentDate}>{format(currentDate, 'MMMM d, yyyy')}</div>
        <button
          className={styles.navButton}
          onClick={() => onDateChange(currentDay + 1)}
          disabled={currentDay === dayCount}
          aria-label='Next day'
        >
          <IconChevronRight size={20} stroke={1.5} />
        </button>
      </div>
    </div>
  );
};
