import { useEffect } from 'react';
import { Modal, TextInput, Textarea, Group, Stack, Text, Avatar, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMediaQuery } from '@mantine/hooks';
import { IconInfoCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { speakerInfoSchema } from '../schemas/speakerSchemas';
import { useUpdateEventSpeakerInfoMutation } from '@/app/features/events/api';
import { Button } from '@/shared/components/buttons';
import type { EventUser } from '@/types';
import styles from './styles.module.css';

type SpeakerEditModalProps = {
  opened: boolean;
  onClose: () => void;
  speaker: EventUser | null;
  eventId: number;
  onSuccess?: () => void;
};

const SpeakerEditModal = ({
  opened,
  onClose,
  speaker,
  eventId,
  onSuccess,
}: SpeakerEditModalProps) => {
  const [updateSpeakerInfo, { isLoading }] = useUpdateEventSpeakerInfoMutation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const form = useForm({
    initialValues: {
      speaker_title: '',
      speaker_bio: '',
    },
    validate: {
      speaker_title: (value) => {
        const result = speakerInfoSchema.shape.speaker_title.safeParse(value);
        return result.success ? null : result.error.errors[0]?.message;
      },
      speaker_bio: (value) => {
        const result = speakerInfoSchema.shape.speaker_bio.safeParse(value);
        return result.success ? null : result.error.errors[0]?.message;
      },
    },
  });

  useEffect(() => {
    if (speaker) {
      form.reset();
      form.setValues({
        speaker_title: speaker.speaker_title ?? speaker.title ?? '',
        speaker_bio: speaker.speaker_bio ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speaker]);

  const handleSubmit = async (values: { speaker_title: string; speaker_bio: string }) => {
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
      const errorMessage =
        (
          error &&
          typeof error === 'object' &&
          'data' in error &&
          error.data &&
          typeof error.data === 'object' &&
          'message' in error.data
        ) ?
          String(error.data.message)
        : 'Failed to update speaker information';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    }
  };

  if (!speaker) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='Edit Speaker Info'
      size='lg'
      centered
      lockScroll={false}
      classNames={{
        content: styles.modalContent ?? '',
        header: styles.modalHeader ?? '',
        body: styles.modalBody ?? '',
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack className={styles.formStack ?? ''}>
          <Group className={styles.userInfo ?? ''}>
            <Avatar
              src={speaker.image_url ?? null}
              alt={speaker.full_name}
              radius='xl'
              size={isMobile ? 'md' : 'lg'}
              className={styles.userAvatar ?? ''}
            >
              {speaker.first_name?.[0]}
              {speaker.last_name?.[0]}
            </Avatar>
            <div className={styles.userDetails ?? ''}>
              <Text fw={500} size={isMobile ? 'sm' : 'md'}>
                {speaker.full_name}
              </Text>
              <Text size={isMobile ? 'xs' : 'sm'} c='dimmed'>
                {speaker.email}
              </Text>
            </div>
          </Group>

          <Alert
            icon={<IconInfoCircle size={14} />}
            color='blue'
            className={styles.infoAlert ?? ''}
            styles={{
              root: { padding: 'var(--space-sm) !important' },
              message: { fontSize: 'var(--text-xs) !important' },
            }}
          >
            <Text size='xs'>
              {`Override speaker's profile info for this event only.
              Leave blank to use defaults.`}
            </Text>
          </Alert>

          <TextInput
            label='Speaker Title'
            placeholder={speaker.title ?? 'Enter title for this event'}
            description={!isMobile && "How they should be introduced (e.g., 'CEO @ Atria')"}
            className={styles.formInput ?? ''}
            size='sm'
            {...form.getInputProps('speaker_title')}
          />

          <Textarea
            label='Speaker Bio'
            placeholder={speaker.speaker_bio ?? 'Enter bio for this event'}
            description={!isMobile && 'Biography to display on the speakers page'}
            rows={isMobile ? 3 : 4}
            className={styles.formTextarea ?? ''}
            size='sm'
            {...form.getInputProps('speaker_bio')}
          />

          {!isMobile && (speaker.title || speaker.speaker_bio) && (
            <Alert
              color='gray'
              variant='light'
              className={styles.grayAlert ?? ''}
              styles={{
                root: { padding: 'var(--space-sm) !important' },
                message: { fontSize: 'var(--text-xs) !important' },
              }}
            >
              <Stack gap={4}>
                <Text size='xs' fw={500}>
                  Current Profile:
                </Text>
                {speaker.title && (
                  <Text size='xs' lineClamp={1}>
                    <strong>Title:</strong> {speaker.title}
                  </Text>
                )}
                {speaker.speaker_bio && (
                  <Text size='xs' lineClamp={2}>
                    <strong>Bio:</strong> {speaker.speaker_bio}
                  </Text>
                )}
              </Stack>
            </Alert>
          )}
        </Stack>

        <div className={styles.buttonGroup ?? ''}>
          <Button variant='subtle' onClick={onClose}>
            Cancel
          </Button>
          <Button variant='primary' type='submit' disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SpeakerEditModal;
