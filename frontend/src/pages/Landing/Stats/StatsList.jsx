import { Group } from '@mantine/core';
import { StatItem } from './StatItem';

const STATS_DATA = [
  { value: '1000+', label: 'Events Hosted' },
  { value: '50K+', label: 'Active Users' },
  { value: '99%', label: 'Satisfaction Rate' },
];

export const StatsList = () => (
  <Group justify="center" gap="xl">
    {STATS_DATA.map((stat) => (
      <StatItem key={stat.label} value={stat.value} label={stat.label} />
    ))}
  </Group>
);
