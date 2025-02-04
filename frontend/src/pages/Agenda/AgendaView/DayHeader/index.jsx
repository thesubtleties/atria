import { Text } from '@mantine/core';
import styles from './styles/index.module.css';

export const DayHeader = ({ dayNumber }) => {
  return (
    <Text size="lg" weight={500} className={styles.header}>
      Day {dayNumber}
    </Text>
  );
};
