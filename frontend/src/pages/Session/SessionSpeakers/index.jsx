// pages/Session/SessionSpeakers/index.jsx
import { Card, Group, Button, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { 
  useGetSessionSpeakersQuery,
  useRemoveSessionSpeakerMutation 
} from '@/app/features/sessions/api';
import { AddSpeakerModal } from '@/shared/components/modals/session/AddSpeakerModal';
import { SpeakerCard } from './SpeakerCard';
import styles from './styles/index.module.css';

export const SessionSpeakers = ({ sessionId, canEdit }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const { data: speakersData, isLoading } = useGetSessionSpeakersQuery({
    sessionId,
  });
  const [removeSpeaker] = useRemoveSessionSpeakerMutation();

  // The API returns paginated data with session_speakers array
  const speakers = Array.isArray(speakersData?.session_speakers)
    ? speakersData?.session_speakers
    : [];

  const handleRemoveSpeaker = async (userId) => {
    try {
      await removeSpeaker({ sessionId, userId }).unwrap();
    } catch (error) {
      console.error('Failed to remove speaker:', error);
    }
  };

  if (isLoading) return null;

  return (
    <div className={styles.speakersSection}>
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
        {speakers.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No speakers assigned yet
          </Text>
        ) : (
          speakers.map((speaker) => (
            <SpeakerCard 
              key={speaker.user_id} 
              speaker={speaker} 
              canEdit={canEdit}
              onRemove={handleRemoveSpeaker}
            />
          ))
        )}
      </div>

      <AddSpeakerModal
        sessionId={sessionId}
        opened={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
};
