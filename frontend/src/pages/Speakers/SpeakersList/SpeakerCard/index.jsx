// pages/Speakers/SpeakersList/SpeakerCard/index.jsx
import { Card, Avatar, Text, Group } from '@mantine/core';
import styles from './styles/index.module.css';

export default function SpeakerCard({ speaker }) {
  const { user_name, speaker_title, speaker_bio } = speaker;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section p="md">
        <Group justify="center">
          <Avatar
            size="xl"
            radius="xl"
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user_name}`}
          />
        </Group>
      </Card.Section>

      <Text ta="center" fw={500} size="lg" mt="md">
        {user_name}
      </Text>

      <Text ta="center" c="dimmed" size="sm">
        {speaker_title}
      </Text>

      <Text ta="center" size="sm" mt="md">
        {speaker_bio}
      </Text>
    </Card>
  );
}
