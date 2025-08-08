import { useEffect } from 'react';
import { Modal, TextInput, Textarea, Group, Stack, Text, Avatar, Alert } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconInfoCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { speakerInfoSchema } from '../schemas/speakerSchemas';
import { useUpdateEventSpeakerInfoMutation } from '@/app/features/events/api';
import { Button } from '../../../../shared/components/buttons';
import styles from './styles.module.css';

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
      lockScroll={false}
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack p="lg">
          <Group className={styles.userInfo}>
            <Avatar
              src={speaker.image_url}
              alt={speaker.full_name}
              radius="xl"
              size="lg"
              className={styles.userAvatar}
            >
              {speaker.first_name?.[0]}{speaker.last_name?.[0]}
            </Avatar>
            <div>
              <Text fw={500}>{speaker.full_name}</Text>
              <Text size="sm" c="dimmed">{speaker.email}</Text>
            </div>
          </Group>

          <Alert icon={<IconInfoCircle size={16} />} color="blue" className={styles.infoAlert}>
            <Text size="sm">
              These fields override the speaker's profile information for this event only.
              Leave blank to use their default profile information.
            </Text>
          </Alert>

          <TextInput
            label="Speaker Title"
            placeholder={speaker.title || "Enter speaker's title for this event"}
            description="How they should be introduced at this event"
            className={styles.formInput}
            {...form.getInputProps('speaker_title')}
          />

          <Textarea
            label="Speaker Bio"
            placeholder={speaker.bio || "Enter speaker's bio for this event"}
            description="Biography to display on the speakers page"
            rows={6}
            className={styles.formTextarea}
            {...form.getInputProps('speaker_bio')}
          />

          {(speaker.title || speaker.bio) && (
            <Alert color="gray" variant="light" className={styles.grayAlert}>
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
        </Stack>

        <div className={styles.buttonGroup}>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SpeakerEditModal;