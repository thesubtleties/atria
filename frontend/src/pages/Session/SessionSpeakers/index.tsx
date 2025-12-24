import { Button, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { move } from '@dnd-kit/helpers';
import {
  useGetSessionSpeakersQuery,
  useRemoveSessionSpeakerMutation,
  useReorderSessionSpeakerMutation,
} from '@/app/features/sessions/api';
import { AddSpeakerModal } from '@/shared/components/modals/session/AddSpeakerModal';
import { SpeakerCard } from './SpeakerCard';
import { SPEAKER_ROLE_ORDER, formatSpeakerRole } from '@/shared/constants/speakerRoles';
import { cn } from '@/lib/cn';
import type { DragOverEvent, DragEndEvent } from '@/types';
import styles from './styles/index.module.css';

type SessionSpeaker = {
  user_id: number;
  role: string;
  speaker_name?: string;
  full_name?: string;
  title?: string;
  company_name?: string;
  speaker_bio?: string;
  image_url?: string;
  social_links?: {
    linkedin?: string;
    website?: string;
  };
  user?: {
    id: number;
  };
};

type DraggableSpeakerCardProps = {
  id: string;
  speaker: SessionSpeaker;
  canEdit: boolean | undefined;
  onRemove: (userId: number) => Promise<void>;
  role: string;
  variant?: 'flow' | 'grid';
  isLast: boolean;
};

// Draggable speaker wrapper component - now includes role for scoped dragging
const DraggableSpeakerCard = ({
  id,
  speaker,
  canEdit,
  onRemove,
  role,
  variant = 'flow',
  isLast,
}: DraggableSpeakerCardProps) => {
  // Call useSortable unconditionally
  const sortableResult = useSortable({
    id,
    index: 0, // Index is required but we manage position separately
    type: `speaker-${role}`, // Unique type per role
    accept: [`speaker-${role}`], // Only accept same role
  });

  // Only use the sortable result if canEdit is true
  const { ref, isDragging } = canEdit ? sortableResult : { ref: null, isDragging: false };

  const wrapperProps = canEdit ? { ref } : {};

  return (
    <div
      {...wrapperProps}
      className={cn(
        styles.speakerWrapper,
        isDragging && styles.dragging,
        variant === 'flow' && !isLast && styles.withDivider,
      )}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor:
          canEdit ?
            isDragging ? 'grabbing'
            : 'grab'
          : 'default',
      }}
    >
      <SpeakerCard speaker={speaker} canEdit={canEdit} onRemove={onRemove} variant={variant} />
    </div>
  );
};

type SessionSpeakersProps = {
  sessionId: string | number | undefined;
  eventId?: number;
  canEdit: boolean | undefined;
  variant?: 'flow' | 'grid';
  preloadedSpeakers?: SessionSpeaker[];
};

type SpeakersByRole = Record<string, SessionSpeaker[]>;
type SpeakerIdsByRole = Record<string, string[]>;

export const SessionSpeakers = ({
  sessionId,
  eventId,
  canEdit,
  variant = 'flow',
  preloadedSpeakers,
}: SessionSpeakersProps) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [removeSpeaker] = useRemoveSessionSpeakerMutation();
  const [reorderSpeaker] = useReorderSessionSpeakerMutation();

  // Normalize sessionId to number
  const numericSessionId = typeof sessionId === 'string' ? Number(sessionId) : sessionId;

  // If preloadedSpeakers is provided, use it directly (SessionManager case)
  // Otherwise fetch the data (Session detail page case)
  const { data: speakersData, isLoading } = useGetSessionSpeakersQuery(
    { sessionId: numericSessionId as number },
    { skip: !!preloadedSpeakers || !numericSessionId },
  );

  // Use preloaded speakers if available, otherwise use fetched data
  const speakers = useMemo((): SessionSpeaker[] => {
    return (
      preloadedSpeakers ||
      (speakersData as { session_speakers?: SessionSpeaker[] })?.session_speakers ||
      []
    );
  }, [preloadedSpeakers, speakersData]);

  // Group speakers by role
  const speakersByRole = useMemo((): SpeakersByRole => {
    return SPEAKER_ROLE_ORDER.reduce<SpeakersByRole>((acc, role) => {
      const roleSpeakers = speakers.filter((s) => s.role === role);
      if (roleSpeakers.length > 0) {
        acc[role] = roleSpeakers;
      }
      return acc;
    }, {});
  }, [speakers]);

  // Local state for drag and drop - organized by role
  const [localSpeakersByRole, setLocalSpeakersByRole] = useState<SpeakerIdsByRole>({});

  // Initialize local speakers with stable IDs per role
  useEffect(() => {
    const speakersByRoleLocal: SpeakerIdsByRole = {};
    Object.entries(speakersByRole).forEach(([role, roleSpeakers]) => {
      speakersByRoleLocal[role] = roleSpeakers.map((speaker) => `speaker-${speaker.user_id}`);
    });
    setLocalSpeakersByRole(speakersByRoleLocal);
  }, [speakersByRole]);

  const handleRemoveSpeaker = async (userId: number) => {
    try {
      await removeSpeaker({ sessionId: numericSessionId as number, userId }).unwrap();
    } catch (error) {
      console.error('Failed to remove speaker:', error);
    }
  };

  // Handle drag operations for a specific role
  const handleDragOver = (role: string) => (event: DragOverEvent) => {
    if (!canEdit) return;

    setLocalSpeakersByRole((current) => {
      const currentRoleSpeakers = current[role] || [];
      const result = move(currentRoleSpeakers, event);
      if (result) {
        return {
          ...current,
          [role]: result as string[],
        };
      }
      return current;
    });
  };

  const handleDragEnd = (role: string) => async (event: DragEndEvent) => {
    if (!canEdit) return;

    const { operation } = event;
    if (!operation?.source?.id) return;

    const draggedId = operation.source.id as string;
    const draggedSpeaker = speakers.find((s) => `speaker-${s.user_id}` === draggedId);

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
    const baseOrder = speakers.indexOf(roleSpeakers[0] as SessionSpeaker) + 1;
    const newOrder = baseOrder + newIndex;

    try {
      // The API will return all speakers in their new order
      await reorderSpeaker({
        sessionId: numericSessionId as number,
        userId: draggedSpeaker.user_id,
        order: newOrder,
      }).unwrap();
    } catch (error) {
      console.error('Failed to reorder speaker:', error);
      // Revert the local state on error
      const speakersByRoleLocal: SpeakerIdsByRole = {};
      Object.entries(speakersByRole).forEach(([r, roleSpeakers]) => {
        speakersByRoleLocal[r] = roleSpeakers.map((speaker) => `speaker-${speaker.user_id}`);
      });
      setLocalSpeakersByRole(speakersByRoleLocal);
    }
  };

  if (isLoading) return null;

  return (
    <div className={cn(styles.speakersSection)}>
      <div className={cn(styles.header)}>
        <h3 className={cn(styles.headerTitle)}>Speakers ({speakers.length})</h3>
        {canEdit && (
          <Button
            onClick={() => setShowAddModal(true)}
            variant='subtle'
            size='sm'
            p={0}
            className={cn(styles.addButton)}
          >
            <IconPlus size={16} />
          </Button>
        )}
      </div>

      {speakers.length === 0 ?
        <Text size='sm' c='dimmed' ta='center' py='xl'>
          No speakers assigned yet
        </Text>
      : <div className={cn(styles.speakers)}>
          {Object.entries(speakersByRole).map(([role]) => {
            const roleSpeakerIds = localSpeakersByRole[role] || [];
            return (
              <div key={role} className={cn(styles.roleGroup)}>
                <h4 className={cn(styles.roleTitle)}>{formatSpeakerRole(role)}</h4>
                <div className={cn(styles.speakersRow, variant === 'flow' && styles.flowRow)}>
                  <DragDropProvider
                    onDragOver={handleDragOver(role)}
                    onDragEnd={handleDragEnd(role)}
                  >
                    {roleSpeakerIds.map((speakerId, index) => {
                      const speaker = speakers.find((s) => `speaker-${s.user_id}` === speakerId);
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
      }

      <AddSpeakerModal
        sessionId={numericSessionId as number}
        eventId={eventId}
        opened={showAddModal}
        onClose={() => setShowAddModal(false)}
        currentSpeakers={speakers.map((s) => ({
          user_id: s.user_id,
          full_name: s.full_name || s.speaker_name || 'Unknown',
          avatar_url: s.image_url ?? undefined,
          role: s.role,
        }))}
      />
    </div>
  );
};
