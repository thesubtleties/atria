// src/pages/Agenda/DateNavigation/index.jsx
import styles from './styles/index.module.css';
import PropTypes from 'prop-types';
import { format, addDays } from 'date-fns';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

export const DateNavigation = ({
  startDate,
  dayCount,
  currentDay,
  onDateChange,
}) => {
  const dates = Array.from({ length: dayCount }, (_, i) =>
    addDays(new Date(startDate), i + 1)
  );

  const currentDate = dates[currentDay - 1];

  return (
    <div className={styles.dateNavigation}>
      <div className={styles.dayNumber}>Day {currentDay}</div>
      <div className={styles.dateSelector}>
        <button
          className={styles.navButton}
          onClick={() => onDateChange(currentDay - 1)}
          disabled={currentDay === 1}
          aria-label="Previous day"
        >
          <IconChevronLeft size={20} stroke={1.5} />
        </button>
        <div className={styles.currentDate}>
          {format(currentDate, 'MMMM d, yyyy')}
        </div>
        <button
          className={styles.navButton}
          onClick={() => onDateChange(currentDay + 1)}
          disabled={currentDay === dayCount}
          aria-label="Next day"
        >
          <IconChevronRight size={20} stroke={1.5} />
        </button>
      </div>
    </div>
  );
};

DateNavigation.propTypes = {
  startDate: PropTypes.string.isRequired,
  dayCount: PropTypes.number.isRequired,
  currentDay: PropTypes.number.isRequired,
  onDateChange: PropTypes.func.isRequired,
};
