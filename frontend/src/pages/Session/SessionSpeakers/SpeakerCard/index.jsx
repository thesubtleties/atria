// pages/Session/SessionSpeakers/SpeakerCard/index.jsx
import { Card, Text, Group, Avatar, ActionIcon } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import styles from './styles/index.module.css';

export const SpeakerCard = ({ speaker, canEdit, onRemove }) => {
  return (
    <Card className={styles.card}>
      <Group wrap="nowrap" align="flex-start">
        <Avatar src={speaker.image_url} size="lg" radius="md" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="lg" fw={500}>
            {speaker.speaker_name || speaker.full_name}
          </Text>
          {(speaker.title || speaker.company_name) && (
            <Text size="sm" c="dimmed">
              {speaker.title}
              {speaker.title && speaker.company_name && ' @ '}
              {speaker.company_name}
            </Text>
          )}
          {speaker.role && (
            <div className={`${styles.roleTag} ${styles[speaker.role.toLowerCase()]}`}>
              {speaker.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
          )}
          {speaker.speaker_bio && (
            <Text size="sm" c="dimmed" lineClamp={2}>
              {speaker.speaker_bio}
            </Text>
          )}
        </div>
        {canEdit && (
          <Group gap={4}>
            <ActionIcon 
              variant="subtle" 
              color="red"
              onClick={() => onRemove && onRemove(speaker.user_id)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        )}
      </Group>
    </Card>
  );
};
