// pages/Session/SessionSpeakers/index.jsx
import { Card, Group, Button, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { move } from '@dnd-kit/helpers';
import { 
  useGetSessionSpeakersQuery,
  useRemoveSessionSpeakerMutation,
  useReorderSessionSpeakerMutation 
} from '@/app/features/sessions/api';
import { AddSpeakerModal } from '@/shared/components/modals/session/AddSpeakerModal';
import { SpeakerCard } from './SpeakerCard';
import styles from './styles/index.module.css';

// Draggable speaker wrapper component
const DraggableSpeakerCard = ({ id, speaker, canEdit, onRemove }) => {
  const { ref, isDragging } = useSortable({ 
    id,
    type: 'speaker',
    accept: ['speaker'],
  });

  return (
    <div
      ref={ref}
      className={`${styles.speakerWrapper} ${isDragging ? styles.dragging : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: canEdit ? (isDragging ? 'grabbing' : 'grab') : 'default',
      }}
    >
      <SpeakerCard 
        speaker={speaker} 
        canEdit={canEdit}
        onRemove={onRemove}
      />
    </div>
  );
};

export const SessionSpeakers = ({ sessionId, canEdit }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { data: speakersData, isLoading } = useGetSessionSpeakersQuery({
    sessionId,
  });
  const [removeSpeaker] = useRemoveSessionSpeakerMutation();
  const [reorderSpeaker] = useReorderSessionSpeakerMutation();

  // The API returns paginated data with session_speakers array
  const speakers = Array.isArray(speakersData?.session_speakers)
    ? speakersData?.session_speakers
    : [];

  // Local state for drag and drop
  const [localSpeakers, setLocalSpeakers] = useState([]);

  // Initialize local speakers with stable IDs
  useEffect(() => {
    setLocalSpeakers(speakers.map(speaker => `speaker-${speaker.user_id}`));
  }, [speakers]);

  const handleRemoveSpeaker = async (userId) => {
    try {
      await removeSpeaker({ sessionId, userId }).unwrap();
    } catch (error) {
      console.error('Failed to remove speaker:', error);
    }
  };

  // Handle drag operations
  const handleDragOver = (event) => {
    if (!canEdit) return;
    
    setLocalSpeakers((current) => {
      const result = move(current, event);
      if (result) {
        return result;
      }
      return current;
    });
  };

  const handleDragEnd = async (event) => {
    if (!canEdit) return;
    
    const { operation } = event;
    if (!operation) return;

    const draggedId = operation.source.id;
    const draggedSpeaker = speakers.find(s => `speaker-${s.user_id}` === draggedId);
    
    if (!draggedSpeaker) {
      console.error('Could not find speaker with id:', draggedId);
      return;
    }

    // Find new position
    const newIndex = localSpeakers.indexOf(draggedId);
    if (newIndex === -1) return;

    // Calculate new order (1-based)
    const newOrder = newIndex + 1;
    
    try {
      // The API will return all speakers in their new order
      await reorderSpeaker({
        sessionId,
        userId: draggedSpeaker.user_id,
        order: newOrder
      }).unwrap();
    } catch (error) {
      console.error('Failed to reorder speaker:', error);
      // Revert the local state on error
      setLocalSpeakers(speakers.map(speaker => `speaker-${speaker.user_id}`));
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
          <DragDropProvider
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {localSpeakers.map((speakerId) => {
              const speaker = speakers.find(s => `speaker-${s.user_id}` === speakerId);
              if (!speaker) return null;
              
              return (
                <DraggableSpeakerCard
                  key={speakerId}
                  id={speakerId}
                  speaker={speaker}
                  canEdit={canEdit}
                  onRemove={handleRemoveSpeaker}
                />
              );
            })}
          </DragDropProvider>
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
