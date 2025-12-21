import { useState, useEffect } from 'react';
import { Modal, TextInput, Textarea, Select, Switch, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Button } from '@/shared/components/buttons';
import { useCreateChatRoomMutation, useUpdateChatRoomMutation } from '@/app/features/chat/api';
import { chatRoomSchema, type ChatRoomFormData } from '../schemas/chatRoomSchema';
import { cn } from '@/lib/cn';
import type { ChatRoom, ChatRoomType, ApiError } from '@/types';
import styles from './styles/index.module.css';

type ChatRoomModalProps = {
  opened: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  room: ChatRoom | null;
  eventId: string;
};

type FormData = {
  name: string;
  description: string;
  roomType: ChatRoomType;
  isEnabled: boolean;
};

type FormErrors = Partial<Record<keyof ChatRoomFormData, string>>;

const ChatRoomModal = ({ opened, onClose, mode, room, eventId }: ChatRoomModalProps) => {
  const [createChatRoom, { isLoading: isCreating }] = useCreateChatRoomMutation();
  const [updateChatRoom, { isLoading: isUpdating }] = useUpdateChatRoomMutation();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    roomType: 'GLOBAL',
    isEnabled: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (mode === 'edit' && room) {
      setFormData({
        name: room.name || '',
        description: room.description || '',
        roomType: room.room_type || 'GLOBAL',
        isEnabled: room.is_enabled || false,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        roomType: 'GLOBAL',
        isEnabled: false,
      });
    }
    setErrors({});
  }, [mode, room, opened]);

  const handleSubmit = async () => {
    const validation = chatRoomSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      validation.error.errors.forEach((error) => {
        const path = error.path[0];
        if (typeof path === 'string') {
          fieldErrors[path as keyof ChatRoomFormData] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      if (mode === 'create') {
        await createChatRoom({
          eventId: parseInt(eventId, 10),
          name: formData.name,
          description: formData.description,
          room_type: formData.roomType,
          is_enabled: formData.isEnabled,
        }).unwrap();
        notifications.show({
          title: 'Success',
          message: 'Chat room created successfully',
          color: 'green',
        });
      } else if (room) {
        await updateChatRoom({
          roomId: room.id,
          name: formData.name,
          description: formData.description,
          is_enabled: formData.isEnabled,
        }).unwrap();
        notifications.show({
          title: 'Success',
          message: 'Chat room updated successfully',
          color: 'green',
        });
      }
      onClose();
    } catch (err) {
      const error = err as ApiError;
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to save chat room',
        color: 'red',
      });
    }
  };

  const roomTypeOptions = [
    { value: 'GLOBAL', label: 'General Chat (All attendees)' },
    { value: 'ADMIN', label: 'Admin Only (Admins & Organizers)' },
    { value: 'GREEN_ROOM', label: 'Green Room (Speakers & Admins)' },
  ] as const;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? 'Create Chat Room' : 'Edit Chat Room'}
      size='md'
      lockScroll={false}
      classNames={{
        content: cn(styles.modalContent),
        header: cn(styles.modalHeader),
      }}
    >
      <Stack gap='md' p='lg'>
        <TextInput
          label='Room Name'
          placeholder='Enter room name'
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
          classNames={{
            input: cn(styles.formInput),
            label: cn(styles.formLabel),
          }}
        />

        <Textarea
          label='Description'
          placeholder='Enter room description (optional)'
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          error={errors.description}
          rows={3}
          classNames={{
            input: cn(styles.formTextarea),
            label: cn(styles.formLabel),
          }}
        />

        <Select
          label='Room Type'
          placeholder='Select room type'
          data={[...roomTypeOptions]}
          value={formData.roomType}
          onChange={(value) =>
            setFormData({ ...formData, roomType: (value as ChatRoomType) || 'GLOBAL' })
          }
          error={errors.roomType}
          required
          disabled={mode === 'edit'}
          classNames={{
            input: cn(styles.formSelect),
            label: cn(styles.formLabel),
          }}
        />

        <div className={styles.switchWrapper}>
          <Switch
            label='Enable room immediately'
            description="If disabled, the room won't be visible to users until you enable it"
            checked={formData.isEnabled}
            onChange={(e) => setFormData({ ...formData, isEnabled: e.currentTarget.checked })}
          />
        </div>

        <div className={styles.buttonGroup}>
          <Button variant='secondary' onClick={onClose}>
            Cancel
          </Button>
          <Button variant='primary' onClick={handleSubmit} loading={isCreating || isUpdating}>
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </div>
      </Stack>
    </Modal>
  );
};

export default ChatRoomModal;

