import { Stack, Text } from '@mantine/core';

export const TestimonialContent = ({ quote, author, role }) => (
  <Stack spacing="md">
    <Text size="xl" style={{ fontStyle: 'italic' }}>
      "{quote}"
    </Text>
    <Stack spacing={0}>
      <Text fw={700}>{author}</Text>
      <Text size="sm" c="dimmed">
        {role}
      </Text>
    </Stack>
  </Stack>
);
