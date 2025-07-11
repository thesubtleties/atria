// pages/Session/SessionSpeakers/index.jsx
import { Card, Group, Button, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState, useRef } from 'react';
import { 
  useGetSessionSpeakersQuery,
  useRemoveSessionSpeakerMutation,
  useReorderSessionSpeakerMutation 
} from '@/app/features/sessions/api';
import { AddSpeakerModal } from '@/shared/components/modals/session/AddSpeakerModal';
import { SpeakerCard } from './SpeakerCard';
import styles from './styles/index.module.css';

export const SessionSpeakers = ({ sessionId, canEdit }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedSpeaker, setDraggedSpeaker] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const draggedOverRef = useRef(null);
  
  const { data: speakersData, isLoading } = useGetSessionSpeakersQuery({
    sessionId,
  });
  const [removeSpeaker] = useRemoveSessionSpeakerMutation();
  const [reorderSpeaker] = useReorderSessionSpeakerMutation();

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

  const handleDragStart = (e, speaker, index) => {
    if (!canEdit) return;
    setDraggedSpeaker({ speaker, index });
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight delay to allow the drag image to be captured
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedSpeaker(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (!canEdit || !draggedSpeaker) return;
    
    e.dataTransfer.dropEffect = 'move';
    
    // Only update if we're over a different index
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
      draggedOverRef.current = index;
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the container entirely
    if (e.currentTarget === e.target) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (!canEdit || !draggedSpeaker || draggedSpeaker.index === targetIndex) {
      return;
    }

    const { speaker, index: sourceIndex } = draggedSpeaker;
    
    // Calculate the new order position (1-based)
    const newOrder = targetIndex + 1;
    
    try {
      // The API will return all speakers in their new order
      await reorderSpeaker({
        sessionId,
        userId: speaker.user_id,
        order: newOrder
      }).unwrap();
    } catch (error) {
      console.error('Failed to reorder speaker:', error);
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
          speakers.map((speaker, index) => (
            <div
              key={speaker.user_id}
              draggable={canEdit}
              onDragStart={(e) => handleDragStart(e, speaker, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`${styles.speakerWrapper} ${
                dragOverIndex === index && draggedSpeaker?.index !== index
                  ? styles.dragOver
                  : ''
              }`}
              style={{
                cursor: canEdit ? 'move' : 'default',
                transition: 'transform 0.2s ease',
                transform: dragOverIndex === index && draggedSpeaker?.index !== index
                  ? draggedSpeaker.index < index
                    ? 'translateY(-10px)'
                    : 'translateY(10px)'
                  : 'translateY(0)'
              }}
            >
              <SpeakerCard 
                speaker={speaker} 
                canEdit={canEdit}
                onRemove={handleRemoveSpeaker}
              />
            </div>
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
