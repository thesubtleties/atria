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
import { SPEAKER_ROLE_ORDER, formatSpeakerRole } from '@/shared/constants/speakerRoles';
import styles from './styles/index.module.css';

// Draggable speaker wrapper component - now includes role for scoped dragging
const DraggableSpeakerCard = ({ id, speaker, canEdit, onRemove, role, variant = 'flow', isLast }) => {
  // Only enable drag-and-drop if canEdit is true
  const { ref, isDragging } = canEdit 
    ? useSortable({ 
        id,
        type: `speaker-${role}`, // Unique type per role
        accept: [`speaker-${role}`], // Only accept same role
      })
    : { ref: null, isDragging: false };

  const wrapperProps = canEdit ? { ref } : {};

  return (
    <div
      {...wrapperProps}
      className={`${styles.speakerWrapper} ${isDragging ? styles.dragging : ''} ${variant === 'flow' && !isLast ? styles.withDivider : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: canEdit ? (isDragging ? 'grabbing' : 'grab') : 'default',
      }}
    >
      <SpeakerCard 
        speaker={speaker} 
        canEdit={canEdit}
        onRemove={onRemove}
        variant={variant}
      />
    </div>
  );
};

export const SessionSpeakers = ({ sessionId, canEdit, variant = 'flow' }) => {
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

  // Group speakers by role
  const speakersByRole = SPEAKER_ROLE_ORDER.reduce((acc, role) => {
    const roleSpeakers = speakers.filter((s) => s.role === role);
    if (roleSpeakers.length > 0) {
      acc[role] = roleSpeakers;
    }
    return acc;
  }, {});

  // Local state for drag and drop - organized by role
  const [localSpeakersByRole, setLocalSpeakersByRole] = useState({});

  // Initialize local speakers with stable IDs per role
  useEffect(() => {
    const speakersByRoleLocal = {};
    Object.entries(speakersByRole).forEach(([role, roleSpeakers]) => {
      speakersByRoleLocal[role] = roleSpeakers.map(speaker => `speaker-${speaker.user_id}`);
    });
    setLocalSpeakersByRole(speakersByRoleLocal);
  }, [speakers]);

  const handleRemoveSpeaker = async (userId) => {
    try {
      await removeSpeaker({ sessionId, userId }).unwrap();
    } catch (error) {
      console.error('Failed to remove speaker:', error);
    }
  };

  // Handle drag operations for a specific role
  const handleDragOver = (role) => (event) => {
    if (!canEdit) return;
    
    setLocalSpeakersByRole((current) => {
      const currentRoleSpeakers = current[role] || [];
      const result = move(currentRoleSpeakers, event);
      if (result) {
        return {
          ...current,
          [role]: result
        };
      }
      return current;
    });
  };

  const handleDragEnd = (role) => async (event) => {
    if (!canEdit) return;
    
    const { operation } = event;
    if (!operation) return;

    const draggedId = operation.source.id;
    const draggedSpeaker = speakers.find(s => `speaker-${s.user_id}` === draggedId);
    
    if (!draggedSpeaker) {
      console.error('Could not find speaker with id:', draggedId);
      return;
    }

    // Find new position within the role group
    const roleSpeakerIds = localSpeakersByRole[role] || [];
    const newIndex = roleSpeakerIds.indexOf(draggedId);
    if (newIndex === -1) return;

    // Calculate new order relative to other speakers in the same role
    const roleSpeakers = speakersByRole[role] || [];
    const baseOrder = speakers.indexOf(roleSpeakers[0]) + 1;
    const newOrder = baseOrder + newIndex;
    
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
      const speakersByRoleLocal = {};
      Object.entries(speakersByRole).forEach(([r, roleSpeakers]) => {
        speakersByRoleLocal[r] = roleSpeakers.map(speaker => `speaker-${speaker.user_id}`);
      });
      setLocalSpeakersByRole(speakersByRoleLocal);
    }
  };

  if (isLoading) return null;

  return (
    <div className={styles.speakersSection}>
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>
          Speakers ({speakers.length})
        </h3>
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

      {speakers.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          No speakers assigned yet
        </Text>
      ) : (
        <div className={styles.speakers}>
          {Object.entries(speakersByRole).map(([role, roleSpeakers]) => {
            const roleSpeakerIds = localSpeakersByRole[role] || [];
            return (
              <div key={role} className={styles.roleGroup}>
                <h4 className={styles.roleTitle}>{formatSpeakerRole(role)}</h4>
                <div className={`${styles.speakersRow} ${variant === 'flow' ? styles.flowRow : ''}`}>
                  <DragDropProvider
                    onDragOver={handleDragOver(role)}
                    onDragEnd={handleDragEnd(role)}
                  >
                    {roleSpeakerIds.map((speakerId, index) => {
                      const speaker = speakers.find(s => `speaker-${s.user_id}` === speakerId);
                      if (!speaker) return null;
                      
                      return (
                        <DraggableSpeakerCard
                          key={speakerId}
                          id={speakerId}
                          speaker={speaker}
                          canEdit={canEdit}
                          onRemove={handleRemoveSpeaker}
                          role={role}
                          variant={variant}
                          isLast={index === roleSpeakerIds.length - 1}
                        />
                      );
                    })}
                  </DragDropProvider>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddSpeakerModal
        sessionId={sessionId}
        opened={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
};
