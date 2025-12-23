import { useState, useEffect, useMemo } from 'react';
import { Textarea, Stack, Group, Title, Text, ActionIcon, Badge, Modal, Menu } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconGripVertical,
  IconDots,
  IconMessageCircle,
} from '@tabler/icons-react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { useSortable } from '@dnd-kit/react/sortable';
import { Button } from '@/shared/components/buttons';
import { useUpdateEventMutation } from '@/app/features/events/api';
import { icebreakersSchema } from '../schemas/eventSettingsSchemas';
import { cn } from '@/lib/cn';
import type { Event, ApiError, DragOverEvent, DragEndEvent } from '@/types';
import styles from './styles.module.css';
import parentStyles from '../styles/index.module.css';

type Icebreaker = {
  message: string;
  _id: string;
};

type IcebreakerFormValues = {
  message: string;
};

type ModalState = {
  open: boolean;
  mode: 'create' | 'edit';
  id: string | null;
};

type DesktopIcebreakerCardProps = {
  id: string;
  message: string;
  icebreakerId: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
};

type DraggableIcebreakerProps = {
  id: string;
  message: string;
  icebreakerId: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
  isMobile: boolean | undefined;
};

type NetworkingSectionProps = {
  event: Event | undefined;
  eventId: number;
};

// Desktop Icebreaker Card Component
const DesktopIcebreakerCard = ({
  id,
  message,
  icebreakerId,
  onEdit,
  onDelete,
  canDelete,
}: DesktopIcebreakerCardProps) => {
  const { ref, isDragging } = useSortable({ id, index: 0 });

  return (
    <div
      ref={ref}
      className={cn(styles.desktopCard, isDragging && styles.dragging)}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <Group
        align='center'
        justify='space-between'
        wrap='nowrap'
        className={cn(styles.desktopCardInner)}
      >
        <Group wrap='nowrap' gap='md' align='center'>
          <div className={cn(styles.desktopCardIcon)}>
            <IconMessageCircle size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <Text className={cn(styles.desktopMessageText)}>{message}</Text>
        </Group>

        <Menu position='bottom-end' withinPortal>
          <Menu.Target>
            <ActionIcon variant='subtle' className={cn(styles.desktopMenuButton)}>
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => onEdit(icebreakerId)}>
              Edit
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrash size={16} />}
              onClick={() => onDelete(icebreakerId)}
              disabled={!canDelete}
              color='red'
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </div>
  );
};

// Draggable Icebreaker Card Component (Mobile)
const DraggableIcebreaker = ({
  id,
  message,
  icebreakerId,
  onEdit,
  onDelete,
  canDelete,
  isMobile,
}: DraggableIcebreakerProps) => {
  const { ref, isDragging } = useSortable({ id, index: 0 });

  return (
    <div
      ref={ref}
      className={cn(styles.draggableCard, isDragging && styles.dragging)}
      style={{
        cursor:
          isMobile ? 'default'
          : isDragging ? 'grabbing'
          : 'grab',
      }}
    >
      <div className={cn(styles.cardInner)}>
        <div className={cn(styles.cardHeader)}>
          {!isMobile && (
            <div className={cn(styles.dragHandleWrapper)}>
              <ActionIcon
                variant='subtle'
                size='lg'
                className={cn(styles.dragHandle)}
                style={{ cursor: 'grab' }}
              >
                <IconGripVertical size={20} />
              </ActionIcon>
            </div>
          )}
          <Menu position='bottom-end' withinPortal>
            <Menu.Target>
              <ActionIcon variant='subtle' className={cn(styles.menuButton)}>
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => onEdit(icebreakerId)}>
                Edit
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={16} />}
                onClick={() => onDelete(icebreakerId)}
                disabled={!canDelete}
                color='red'
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
        <div className={cn(styles.cardBody)}>
          <Text className={cn(styles.messageText)}>{message}</Text>
        </div>
      </div>
    </div>
  );
};

const NetworkingSection = ({ event, eventId }: NetworkingSectionProps) => {
  const [updateEvent, { isLoading }] = useUpdateEventMutation();
  const [hasChanges, setHasChanges] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // State for icebreakers with stable IDs
  const [icebreakers, setIcebreakers] = useState<Icebreaker[]>(() => {
    const initialIcebreakers = event?.icebreakers || [];
    return initialIcebreakers.map((message, index) => ({
      message,
      _id: `ice-${Date.now()}-${index}`,
    }));
  });

  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    mode: 'create',
    id: null,
  });

  // Local state for drag and drop
  const [localIcebreakers, setLocalIcebreakers] = useState<Record<string, string[]>>({});

  // ID generation counter
  const [nextIcebreakerId, setNextIcebreakerId] = useState(1);

  const form = useForm<IcebreakerFormValues>({
    initialValues: {
      message: '',
    },
    validate: zodResolver(icebreakersSchema),
  });

  // Create lookup map
  const icebreakerLookup = useMemo(() => {
    const lookup: Record<string, Icebreaker> = {};
    icebreakers.forEach((icebreaker) => {
      lookup[icebreaker._id] = icebreaker;
    });
    return lookup;
  }, [icebreakers]);

  // Initialize local items for drag and drop (only on mount or when items added/removed)
  useEffect(() => {
    const icebreakerIds = icebreakers.map((ice) => ice._id);
    setLocalIcebreakers({ default: icebreakerIds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [icebreakers.length]);

  // Track changes
  useEffect(() => {
    const icebreakersMessages = icebreakers.map((ice) => ice.message);
    const changed =
      JSON.stringify(icebreakersMessages) !== JSON.stringify(event?.icebreakers || []);
    setHasChanges(changed);
  }, [icebreakers, event]);

  const handleAddIcebreaker = () => {
    form.reset();
    setModalState({ open: true, mode: 'create', id: null });
  };

  const handleEditIcebreaker = (icebreakerId: string) => {
    const icebreaker = icebreakerLookup[icebreakerId];
    if (icebreaker) {
      form.setValues({ message: icebreaker.message });
      setModalState({ open: true, mode: 'edit', id: icebreakerId });
    }
  };

  const handleSaveIcebreaker = (values: IcebreakerFormValues) => {
    if (modalState.mode === 'create') {
      const newIcebreaker: Icebreaker = {
        message: values.message,
        _id: `ice-${Date.now()}-${nextIcebreakerId}`,
      };
      setIcebreakers([...icebreakers, newIcebreaker]);
      setNextIcebreakerId(nextIcebreakerId + 1);
    } else {
      const updated = icebreakers.map((ice) =>
        ice._id === modalState.id ? { ...ice, message: values.message } : ice,
      );
      setIcebreakers(updated);
    }
    setModalState({ open: false, mode: 'create', id: null });
  };

  const handleDeleteIcebreaker = (icebreakerId: string) => {
    if (icebreakers.length <= 1) {
      notifications.show({
        title: 'Warning',
        message: 'You must have at least one icebreaker message',
        color: 'yellow',
      });
      return;
    }
    setIcebreakers(icebreakers.filter((ice) => ice._id !== icebreakerId));
  };

  // Drag handlers
  const handleDragOver = (dragEvent: DragOverEvent) => {
    setLocalIcebreakers((items) => move(items, dragEvent));
  };

  const handleDragEnd = (dragEvent: DragEndEvent) => {
    const { operation } = dragEvent;
    if (!operation?.source) return;

    const draggedId = operation.source.id;
    const draggedIcebreaker = icebreakerLookup[draggedId];

    if (!draggedIcebreaker) {
      console.error('Could not find icebreaker with id:', draggedId);
      return;
    }

    const newOrder = localIcebreakers.default || [];
    const newIcebreakers = newOrder
      .map((id) => icebreakerLookup[id])
      .filter(Boolean) as Icebreaker[];

    setIcebreakers(newIcebreakers);
  };

  const handleSubmit = async () => {
    if (icebreakers.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'You must have at least one icebreaker message',
        color: 'red',
      });
      return;
    }

    try {
      const icebreakersForApi = icebreakers.map((ice) => ice.message);

      await updateEvent({
        id: eventId,
        icebreakers: icebreakersForApi,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Icebreaker messages updated successfully',
        color: 'green',
      });
      setHasChanges(false);
    } catch (error) {
      const apiError = error as ApiError;
      notifications.show({
        title: 'Error',
        message: apiError.data?.message || 'Failed to update icebreakers',
        color: 'red',
      });
    }
  };

  const handleReset = () => {
    const timestamp = Date.now();
    const resetIcebreakers = (event?.icebreakers || []).map((message, index) => ({
      message,
      _id: `ice-${timestamp}-${index}`,
    }));
    setIcebreakers(resetIcebreakers);

    const resetIds = resetIcebreakers.map((ice) => ice._id);
    setLocalIcebreakers({ default: resetIds });

    setNextIcebreakerId(resetIcebreakers.length + 1);

    setHasChanges(false);
  };

  return (
    <>
      <div className={cn(parentStyles.section, styles.glassSection)}>
        <h3 className={cn(parentStyles.sectionTitle)}>Networking Settings</h3>
        <Text c='dimmed' size='sm' mb='xl'>
          Configure icebreaker messages to help attendees start conversations
        </Text>

        <Stack gap='lg'>
          <div>
            <Group
              justify={isMobile ? 'center' : 'space-between'}
              mb='md'
              className={cn(styles.sectionHeader)}
            >
              <div className={isMobile ? cn(styles.mobileCenter) : cn(styles.desktopLeft)}>
                <Title order={4} className={cn(styles.subsectionTitle)}>
                  Icebreaker Messages
                </Title>
                <Text size='sm' c='dimmed' mt='xs'>
                  Pre-written messages attendees can use to start conversations
                </Text>
              </div>
              <Button
                variant='primary'
                onClick={handleAddIcebreaker}
                className={isMobile ? cn(styles.centerButton) : ''}
              >
                <IconPlus size={16} />
                Add Message
              </Button>
            </Group>

            <Text className={cn(styles.dragHint)}>Press down on cards and drag to reorder</Text>

            <DragDropProvider onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
              <div className={cn(styles.draggableList)}>
                {icebreakers.length === 0 ?
                  <div className={cn(styles.emptyState)}>
                    <Text c='dimmed' ta='center'>
                      No icebreaker messages added yet
                    </Text>
                  </div>
                : localIcebreakers.default?.map((id) => {
                    const icebreaker = icebreakerLookup[id];
                    if (!icebreaker) return null;

                    return isMobile ?
                        <DraggableIcebreaker
                          key={id}
                          id={id}
                          message={icebreaker.message}
                          icebreakerId={id}
                          onEdit={handleEditIcebreaker}
                          onDelete={handleDeleteIcebreaker}
                          canDelete={icebreakers.length > 1}
                          isMobile={isMobile}
                        />
                      : <DesktopIcebreakerCard
                          key={id}
                          id={id}
                          message={icebreaker.message}
                          icebreakerId={id}
                          onEdit={handleEditIcebreaker}
                          onDelete={handleDeleteIcebreaker}
                          canDelete={icebreakers.length > 1}
                        />;
                  })
                }
              </div>
            </DragDropProvider>

            <Group justify='space-between' mt='md'>
              <Badge variant='light' size='lg' radius='sm' className={cn(styles.countBadge)}>
                {icebreakers.length} icebreaker
                {icebreakers.length !== 1 ? 's' : ''}
              </Badge>
              {icebreakers.length < 1 && (
                <Text size='sm' c='red'>
                  At least one icebreaker message is required
                </Text>
              )}
            </Group>
          </div>

          {hasChanges && (
            <Group justify='flex-end' mt='xl'>
              <Button variant='secondary' onClick={handleReset}>
                Cancel
              </Button>
              <Button variant='primary' onClick={handleSubmit} disabled={isLoading}>
                Save Changes
              </Button>
            </Group>
          )}
        </Stack>
      </div>

      {/* Icebreaker Modal */}
      <Modal
        opened={modalState.open}
        onClose={() => setModalState({ open: false, mode: 'create', id: null })}
        title={modalState.mode === 'create' ? 'Add Icebreaker Message' : 'Edit Icebreaker Message'}
        size='lg'
        lockScroll={false}
        classNames={{
          content: styles.modalContent ?? '',
          header: styles.modalHeader ?? '',
        }}
      >
        <form onSubmit={form.onSubmit(handleSaveIcebreaker)}>
          <Stack>
            <Textarea
              label='Message'
              description='Write a friendly message that attendees can use to start conversations'
              placeholder="Hi! I noticed we're both interested in similar sessions. Would you like to connect?"
              minRows={3}
              required
              classNames={{ input: styles.formTextarea ?? '' }}
              {...form.getInputProps('message')}
            />
            <Group justify='flex-end'>
              <Button
                variant='secondary'
                onClick={() => setModalState({ open: false, mode: 'create', id: null })}
              >
                Cancel
              </Button>
              <Button variant='primary' type='submit'>
                {modalState.mode === 'create' ? 'Add' : 'Update'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
};

export default NetworkingSection;
