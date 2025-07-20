import { useState, useEffect } from 'react';
import { 
  Textarea, 
  Stack, 
  Group, 
  Button,
  Paper,
  Title,
  Text,
  Card,
  ActionIcon,
  Badge,
  Modal
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { 
  IconPlus, 
  IconTrash, 
  IconEdit,
  IconGripVertical,
  IconMessageCircle
} from '@tabler/icons-react';
import { useUpdateEventMutation } from '@/app/features/events/api';
import { icebreakersSchema } from '../schemas/eventSettingsSchemas';
import styles from './styles.module.css';

const NetworkingSection = ({ event, eventId }) => {
  const [updateEvent, { isLoading }] = useUpdateEventMutation();
  const [hasChanges, setHasChanges] = useState(false);
  const [icebreakers, setIcebreakers] = useState(event?.icebreakers || []);
  const [modalState, setModalState] = useState({ open: false, mode: 'create', index: null });
  
  // Drag state
  const [draggedIcebreaker, setDraggedIcebreaker] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const form = useForm({
    initialValues: {
      message: '',
    },
    resolver: zodResolver(icebreakersSchema),
  });

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(icebreakers) !== JSON.stringify(event?.icebreakers || []);
    setHasChanges(changed);
  }, [icebreakers, event]);

  const handleAddIcebreaker = () => {
    form.reset();
    setModalState({ open: true, mode: 'create', index: null });
  };

  const handleEditIcebreaker = (index) => {
    form.setValues({ message: icebreakers[index] });
    setModalState({ open: true, mode: 'edit', index });
  };

  const handleSaveIcebreaker = (values) => {
    if (modalState.mode === 'create') {
      setIcebreakers([...icebreakers, values.message]);
    } else {
      const updated = [...icebreakers];
      updated[modalState.index] = values.message;
      setIcebreakers(updated);
    }
    setModalState({ open: false, mode: 'create', index: null });
  };

  const handleDeleteIcebreaker = (index) => {
    if (icebreakers.length <= 1) {
      notifications.show({
        title: 'Warning',
        message: 'You must have at least one icebreaker message',
        color: 'yellow',
      });
      return;
    }
    setIcebreakers(icebreakers.filter((_, i) => i !== index));
  };

  // Drag handlers
  const handleDragStart = (e, index) => {
    setDraggedIcebreaker({ index, message: icebreakers[index] });
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedIcebreaker(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (!draggedIcebreaker) return;
    
    e.dataTransfer.dropEffect = 'move';
    
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (!draggedIcebreaker || draggedIcebreaker.index === targetIndex) {
      return;
    }

    const newIcebreakers = [...icebreakers];
    const [removed] = newIcebreakers.splice(draggedIcebreaker.index, 1);
    newIcebreakers.splice(targetIndex, 0, removed);
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
      await updateEvent({
        id: eventId,
        icebreakers,
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
    setIcebreakers(event?.icebreakers || []);
    setHasChanges(false);
  };

  return (
    <>
      <Paper className={styles.section}>
        <Title order={3} mb="lg">Networking Settings</Title>
        
        <Stack spacing="lg">
          <div>
            <Group justify="space-between" mb="md">
              <div>
                <Title order={4}>Icebreaker Messages</Title>
                <Text size="sm" c="dimmed" mt="xs">
                  Pre-written messages attendees can use to start conversations
                </Text>
              </div>
              <Button
                size="sm"
                leftSection={<IconPlus size={16} />}
                onClick={handleAddIcebreaker}
              >
                Add Message
              </Button>
            </Group>

            <Stack>
              {icebreakers.length === 0 ? (
                <Text c="dimmed" ta="center" py="md">
                  No icebreaker messages added yet
                </Text>
              ) : (
                icebreakers.map((message, index) => (
                  <Card
                    key={index}
                    withBorder
                    p="sm"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`${styles.icebreaker} ${
                      dragOverIndex === index && draggedIcebreaker?.index !== index
                        ? styles.dragOver
                        : ''
                    }`}
                    style={{
                      cursor: 'move',
                      opacity: draggedIcebreaker?.index === index ? 0.5 : 1,
                    }}
                  >
                    <Group justify="space-between" align="flex-start">
                      <Group align="flex-start" style={{ flex: 1 }}>
                        <IconGripVertical size={18} className={styles.dragHandle} />
                        <IconMessageCircle size={20} />
                        <Text size="sm" style={{ flex: 1 }}>
                          {message}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => handleEditIcebreaker(index)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDeleteIcebreaker(index)}
                          disabled={icebreakers.length <= 1}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Card>
                ))
              )}
            </Stack>

            <Group justify="space-between" mt="md">
              <Badge variant="light">
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
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={isLoading}>
                Save Changes
              </Button>
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Icebreaker Modal */}
      <Modal
        opened={modalState.open}
        onClose={() => setModalState({ open: false, mode: 'create', index: null })}
        title={modalState.mode === 'create' ? 'Add Icebreaker Message' : 'Edit Icebreaker Message'}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSaveIcebreaker)}>
          <Stack>
            <Textarea
              label="Message"
              description="Write a friendly message that attendees can use to start conversations"
              placeholder="Hi! I noticed we're both interested in similar sessions. Would you like to connect?"
              minRows={3}
              required
              {...form.getInputProps('message')}
            />
            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => setModalState({ open: false, mode: 'create', index: null })}
              >
                Cancel
              </Button>
              <Button type="submit">
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