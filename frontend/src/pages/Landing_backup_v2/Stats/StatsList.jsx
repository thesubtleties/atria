import { Group, Stack } from '@mantine/core';
import { StatItem } from './StatItem';
import { useMediaQuery } from '@mantine/hooks';

const STATS_DATA = [
  { value: '1000+', label: 'Events Hosted' },
  { value: '50K+', label: 'Active Users' },
  { value: '99%', label: 'Satisfaction Rate' },
];

export const StatsList = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <>
      {isMobile ? (
        <Stack align="center" gap="md">
          {STATS_DATA.map((stat) => (
            <StatItem
              key={stat.label}
              value={stat.value}
              label={stat.label}
              w="100%"
              fz="lg"
            />
          ))}
        </Stack>
      ) : (
        <Group justify="center" gap="xl">
          {STATS_DATA.map((stat) => (
            <StatItem
              key={stat.label}
              value={stat.value}
              label={stat.label}
              fz="xl"
            />
          ))}
        </Group>
      )}
    </>
  );
};
