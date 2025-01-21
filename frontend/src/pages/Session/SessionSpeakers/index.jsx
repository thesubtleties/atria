// pages/Session/SessionSpeakers/index.jsx
import { Card, Group, Button, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useGetSessionSpeakersQuery } from '@/app/features/sessions/api';
import { AddSpeakerModal } from '@/shared/components/modals/session/AddSpeakerModal';
import { SpeakerCard } from './SpeakerCard';
import styles from './styles/index.module.css';

export const SessionSpeakers = ({ sessionId, canEdit }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const { data: speakersData, isLoading } = useGetSessionSpeakersQuery({
    sessionId,
  });

  // Ensure we have an array of speakers
  const speakers = Array.isArray(speakersData?.speakers)
    ? speakersData?.speakers
    : [];

  if (isLoading) return null;

  return (
    <div className={styles.speakersSection}>
      <div className={styles.speakersContainer}>
        <div className={styles.header}>
          <Text size="md" weight={500}>
            Speakers ({speakers.length})
          </Text>
          {canEdit && (
            <Button
              onClick={() => setShowAddModal(true)}
              variant="subtle"
              size="sm"
              p={0}
              className={styles.addButton}
            >
              <IconPlus size={16} />
            </Button>
          )}
        </div>

        <div className={styles.speakersGrid}>
          {speakers.map((speaker) => (
            <SpeakerCard key={speaker.id} speaker={speaker} canEdit={canEdit} />
          ))}
        </div>
      </div>

      <AddSpeakerModal
        sessionId={sessionId}
        opened={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
};
