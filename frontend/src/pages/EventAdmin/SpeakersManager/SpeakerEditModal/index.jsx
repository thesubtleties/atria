import { useEffect } from 'react';
import { Modal, TextInput, Textarea, Button, Group, Stack, Text, Avatar, Alert } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconInfoCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { speakerInfoSchema } from '../schemas/speakerSchemas';
import { useUpdateEventSpeakerInfoMutation } from '@/app/features/events/api';

const SpeakerEditModal = ({ opened, onClose, speaker, eventId, onSuccess }) => {
  const [updateSpeakerInfo, { isLoading }] = useUpdateEventSpeakerInfoMutation();

  const form = useForm({
    resolver: zodResolver(speakerInfoSchema),
    initialValues: {
      speaker_title: '',
      speaker_bio: '',
    },
  });

  // Reset form when speaker changes
  useEffect(() => {
    if (speaker) {
      form.setValues({
        speaker_title: speaker.speaker_title || speaker.title || '',
        speaker_bio: speaker.speaker_bio || speaker.bio || '',
      });
    }
  }, [speaker]);

  const handleSubmit = async (values) => {
    if (!speaker) return;

    try {
      await updateSpeakerInfo({
        eventId,
        userId: speaker.user_id,
        ...values,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Speaker information updated successfully',
        color: 'green',
      });

      onClose();
      onSuccess?.();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to update speaker information',
        color: 'red',
      });
    }
  };

  if (!speaker) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit Speaker Information"
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Group>
            <Avatar
              src={speaker.image_url}
              alt={speaker.full_name}
              radius="xl"
              size="lg"
            >
              {speaker.first_name?.[0]}{speaker.last_name?.[0]}
            </Avatar>
            <div>
              <Text fw={500}>{speaker.full_name}</Text>
              <Text size="sm" c="dimmed">{speaker.email}</Text>
            </div>
          </Group>

          <Alert icon={<IconInfoCircle size={16} />} color="blue">
            <Text size="sm">
              These fields override the speaker's profile information for this event only.
              Leave blank to use their default profile information.
            </Text>
          </Alert>

          <TextInput
            label="Speaker Title"
            placeholder={speaker.title || "Enter speaker's title for this event"}
            description="How they should be introduced at this event"
            {...form.getInputProps('speaker_title')}
          />

          <Textarea
            label="Speaker Bio"
            placeholder={speaker.bio || "Enter speaker's bio for this event"}
            description="Biography to display on the speakers page"
            rows={6}
            {...form.getInputProps('speaker_bio')}
          />

          {(speaker.title || speaker.bio) && (
            <Alert color="gray" variant="light">
              <Stack gap="xs">
                <Text size="sm" fw={500}>Profile Information:</Text>
                {speaker.title && (
                  <Text size="sm">
                    <strong>Title:</strong> {speaker.title}
                  </Text>
                )}
                {speaker.bio && (
                  <Text size="sm">
                    <strong>Bio:</strong> {speaker.bio}
                  </Text>
                )}
              </Stack>
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default SpeakerEditModal;