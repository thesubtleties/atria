import { useState, useEffect, useMemo } from 'react';
import { 
  Textarea, 
  Stack, 
  Group, 
  Title,
  Text,
  ActionIcon,
  Badge,
  Modal,
  Menu
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import { 
  IconPlus, 
  IconTrash, 
  IconEdit,
  IconGripVertical,
  IconDots
} from '@tabler/icons-react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { useSortable } from '@dnd-kit/react/sortable';
import { Button } from '@/shared/components/buttons';
import { useUpdateEventMutation } from '@/app/features/events/api';
import { icebreakersSchema } from '../schemas/eventSettingsSchemas';
import styles from './styles.module.css';
import parentStyles from '../styles/index.module.css';

// Draggable Icebreaker Card Component
const DraggableIcebreaker = ({ id, message, icebreakerId, onEdit, onDelete, canDelete, isMobile }) => {
  const { ref, isDragging } = useSortable({ 
    id,
    type: 'icebreaker',
    accept: ['icebreaker'],
  });

  return (
    <div
      ref={ref}
      className={`${styles.draggableCard} ${isDragging ? styles.dragging : ''}`}
      style={{ 
        cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab')
      }}
    >
      <div className={styles.cardInner}>
        <div className={styles.cardHeader}>
          {!isMobile && (
            <div className={styles.dragHandleWrapper}>
              <ActionIcon 
                variant="subtle" 
                size="lg" 
                className={styles.dragHandle}
                style={{ cursor: 'grab' }}
              >
                <IconGripVertical size={20} />
              </ActionIcon>
            </div>
          )}
          <div style={{ flex: 1 }} />
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" className={styles.menuButton}>
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit size={16} />}
                onClick={() => onEdit(icebreakerId)}
              >
                Edit
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={16} />}
                onClick={() => onDelete(icebreakerId)}
                disabled={!canDelete}
                color="red"
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
        <div className={styles.cardBody}>
          <Text className={styles.messageText}>
            {message}
          </Text>
        </div>
      </div>
    </div>
  );
};

const NetworkingSection = ({ event, eventId }) => {
  const [updateEvent, { isLoading }] = useUpdateEventMutation();
  const [hasChanges, setHasChanges] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // State for icebreakers with stable IDs
  const [icebreakers, setIcebreakers] = useState(() => {
    const initialIcebreakers = event?.icebreakers || [];
    return initialIcebreakers.map((message, index) => ({
      message,
      _id: `ice-${Date.now()}-${index}` // Stable ID
    }));
  });
  
  const [modalState, setModalState] = useState({ open: false, mode: 'create', id: null });
  
  // Local state for drag and drop
  const [localIcebreakers, setLocalIcebreakers] = useState({});
  
  // ID generation counter
  const [nextIcebreakerId, setNextIcebreakerId] = useState(1);

  const form = useForm({
    initialValues: {
      message: '',
    },
    resolver: zodResolver(icebreakersSchema),
  });

  // Create lookup map
  const icebreakerLookup = useMemo(() => {
    const lookup = {};
    icebreakers.forEach(icebreaker => {
      lookup[icebreaker._id] = icebreaker;
    });
    return lookup;
  }, [icebreakers]);

  // Initialize local items for drag and drop (only on mount or when items added/removed)
  useEffect(() => {
    const icebreakerIds = icebreakers.map(ice => ice._id);
    setLocalIcebreakers({ default: icebreakerIds });
  }, [icebreakers.length]); // Only re-run when count changes

  // Track changes
  useEffect(() => {
    // Compare without _id field
    const icebreakersMessages = icebreakers.map(ice => ice.message);
    const changed = JSON.stringify(icebreakersMessages) !== JSON.stringify(event?.icebreakers || []);
    setHasChanges(changed);
  }, [icebreakers, event]);

  const handleAddIcebreaker = () => {
    form.reset();
    setModalState({ open: true, mode: 'create', id: null });
  };

  const handleEditIcebreaker = (icebreakerId) => {
    const icebreaker = icebreakerLookup[icebreakerId];
    if (icebreaker) {
      form.setValues({ message: icebreaker.message });
      setModalState({ open: true, mode: 'edit', id: icebreakerId });
    }
  };

  const handleSaveIcebreaker = (values) => {
    if (modalState.mode === 'create') {
      const newIcebreaker = {
        message: values.message,
        _id: `ice-${Date.now()}-${nextIcebreakerId}`
      };
      setIcebreakers([...icebreakers, newIcebreaker]);
      setNextIcebreakerId(nextIcebreakerId + 1);
    } else {
      const updated = icebreakers.map(ice => 
        ice._id === modalState.id ? { ...ice, message: values.message } : ice
      );
      setIcebreakers(updated);
    }
    setModalState({ open: false, mode: 'create', id: null });
  };

  const handleDeleteIcebreaker = (icebreakerId) => {
    if (icebreakers.length <= 1) {
      notifications.show({
        title: 'Warning',
        message: 'You must have at least one icebreaker message',
        color: 'yellow',
      });
      return;
    }
    setIcebreakers(icebreakers.filter(ice => ice._id !== icebreakerId));
  };

  // Drag handlers
  const handleDragOver = (event) => {
    setLocalIcebreakers((items) => move(items, event));
  };

  const handleDragEnd = (event) => {
    const { operation } = event;
    if (!operation) return;

    const draggedId = operation.source.id;
    const draggedIcebreaker = icebreakerLookup[draggedId];
    
    if (!draggedIcebreaker) {
      console.error('Could not find icebreaker with id:', draggedId);
      return;
    }

    // Find new position based on the current order in localIcebreakers
    const newOrder = localIcebreakers.default || [];
    const newIcebreakers = newOrder.map(id => icebreakerLookup[id]).filter(Boolean);
    
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
      // Strip _id fields before sending to API
      const icebreakersForApi = icebreakers.map(ice => ice.message);
      
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
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to update icebreakers',
        color: 'red',
      });
    }
  };

  const handleReset = () => {
    // Re-add stable IDs when resetting
    const timestamp = Date.now();
    const resetIcebreakers = (event?.icebreakers || []).map((message, index) => ({
      message,
      _id: `ice-${timestamp}-${index}`
    }));
    setIcebreakers(resetIcebreakers);
    
    // Reset the local drag state with new IDs
    const resetIds = resetIcebreakers.map(ice => ice._id);
    setLocalIcebreakers({ default: resetIds });
    
    // Reset the ID counter
    setNextIcebreakerId(resetIcebreakers.length + 1);
    
    setHasChanges(false);
  };

  return (
    <>
      <div className={`${parentStyles.section} ${styles.glassSection}`}>
        <h3 className={parentStyles.sectionTitle}>Networking Settings</h3>
        <Text c="dimmed" size="sm" mb="xl">
          Configure icebreaker messages to help attendees start conversations
        </Text>
        
        <Stack spacing="lg">
              <div>
                <Group justify={isMobile ? "center" : "space-between"} mb="md" className={styles.sectionHeader}>
                  <div className={isMobile ? styles.mobileCenter : ""}>
                    <Title order={4} className={styles.subsectionTitle}>Icebreaker Messages</Title>
                    <Text size="sm" c="dimmed" mt="xs">
                      Pre-written messages attendees can use to start conversations
                    </Text>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleAddIcebreaker}
                    className={isMobile ? styles.centerButton : ""}
                  >
                    <IconPlus size={16} />
                    Add Message
                  </Button>
                </Group>
                
                <Text className={styles.dragHint}>Press down on cards and drag to reorder</Text>

                <DragDropProvider onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                  <div className={styles.draggableList}>
                    {icebreakers.length === 0 ? (
                      <div className={styles.emptyState}>
                        <Text c="dimmed" ta="center">
                          No icebreaker messages added yet
                        </Text>
                      </div>
                    ) : (
                      localIcebreakers.default?.map((id) => {
                        const icebreaker = icebreakerLookup[id];
                        if (!icebreaker) return null;
                        
                        return (
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
                        );
                      })
                    )}
                  </div>
                </DragDropProvider>

                <Group justify="space-between" mt="md">
                  <Badge 
                    variant="light" 
                    size="lg"
                    radius="sm"
                    className={styles.countBadge}
                  >
                    {icebreakers.length} icebreaker{icebreakers.length !== 1 ? 's' : ''}
                  </Badge>
                  {icebreakers.length < 1 && (
                    <Text size="sm" c="red">
                      At least one icebreaker message is required
                    </Text>
                  )}
                </Group>
              </div>

              {hasChanges && (
                <Group justify="flex-end" mt="xl">
                  <Button variant="subtle" onClick={handleReset}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
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
        size="lg"
        lockScroll={false}
        classNames={{
          content: styles.modalContent,
          header: styles.modalHeader,
        }}
      >
        <form onSubmit={form.onSubmit(handleSaveIcebreaker)}>
          <Stack>
            <Textarea
              label="Message"
              description="Write a friendly message that attendees can use to start conversations"
              placeholder="Hi! I noticed we're both interested in similar sessions. Would you like to connect?"
              minRows={3}
              required
              classNames={{ input: styles.formTextarea }}
              {...form.getInputProps('message')}
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => setModalState({ open: false, mode: 'create', id: null })}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
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