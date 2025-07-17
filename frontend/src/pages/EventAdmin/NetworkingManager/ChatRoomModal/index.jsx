import { useState, useEffect } from 'react';
import { Modal, TextInput, Textarea, Select, Switch, Button, Group, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { 
  useCreateChatRoomMutation, 
  useUpdateChatRoomMutation 
} from '@/app/features/chat/api';
import { chatRoomSchema } from '../schemas/chatRoomSchema';

const ChatRoomModal = ({ opened, onClose, mode, room, eventId }) => {
  const [createChatRoom, { isLoading: isCreating }] = useCreateChatRoomMutation();
  const [updateChatRoom, { isLoading: isUpdating }] = useUpdateChatRoomMutation();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    roomType: 'GLOBAL',
    isEnabled: false,
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && room) {
      setFormData({
        name: room.name || '',
        description: room.description || '',
        roomType: room.room_type || 'GLOBAL',
        isEnabled: room.is_enabled || false,
      });
    } else {
      // Reset form when creating new room
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
    // Validate form data
    const validation = chatRoomSchema.safeParse(formData);
    
    if (!validation.success) {
      const fieldErrors = {};
      validation.error.errors.forEach((error) => {
        fieldErrors[error.path[0]] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      if (mode === 'create') {
        await createChatRoom({
          eventId,
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
      } else {
        // Don't send room_type on update - it's not editable
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
    } catch (error) {
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
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? 'Create Chat Room' : 'Edit Chat Room'}
      size="md"
    >
      <Stack>
        <TextInput
          label="Room Name"
          placeholder="Enter room name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />

        <Textarea
          label="Description"
          placeholder="Enter room description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          error={errors.description}
          rows={3}
        />

        <Select
          label="Room Type"
          placeholder="Select room type"
          data={roomTypeOptions}
          value={formData.roomType}
          onChange={(value) => setFormData({ ...formData, roomType: value })}
          error={errors.roomType}
          required
          disabled={mode === 'edit'} // Can't change room type after creation
        />

        <Switch
          label="Enable room immediately"
          description="If disabled, the room won't be visible to users until you enable it"
          checked={formData.isEnabled}
          onChange={(e) => setFormData({ ...formData, isEnabled: e.currentTarget.checked })}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            loading={isCreating || isUpdating}
          >
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ChatRoomModal;