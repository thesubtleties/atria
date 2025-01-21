// pages/Session/SessionSpeakers/SpeakerCard/index.jsx
import { Card, Text, Group, Avatar, ActionIcon } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import styles from './styles/index.module.css';

export const SpeakerCard = ({ speaker, canEdit }) => {
  return (
    <Card className={styles.card}>
      <Group noWrap align="flex-start">
        <Avatar src={speaker.image_url} size="lg" radius="md" />
        <div style={{ flex: 1 }}>
          <Text size="lg" weight={500}>
            {speaker.full_name}
          </Text>
          {speaker.title && (
            <Text size="sm" c="dimmed">
              {speaker.title}
            </Text>
          )}
          {speaker.speaker_bio && (
            <Text size="sm" c="dimmed" lineClamp={2}>
              {speaker.speaker_bio}
            </Text>
          )}
        </div>
        {canEdit && (
          <ActionIcon variant="subtle">
            <IconPencil size={16} />
          </ActionIcon>
        )}
      </Group>
    </Card>
  );
};
