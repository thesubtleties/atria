import { Stack, Text } from '@mantine/core';

export const StatItem = ({ value, label }) => (
  <Stack align="center" spacing="xs">
    <Text size="xl" fw={700}>
      {value}
    </Text>
    <Text size="sm" c="dimmed">
      {label}
    </Text>
  </Stack>
);
