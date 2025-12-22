import { Select, Stack, Modal, Alert, Button as MantineButton } from '@mantine/core';
import { useForm } from '@mantine/form';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  useAddSessionSpeakerMutation,
  useGetSessionQuery,
  useGetSessionSpeakersQuery,
} from '@/app/features/sessions/api';
import { useGetEventUsersQuery } from '@/app/features/events/api';
import { Button } from '@/shared/components/buttons';
import { useMemo } from 'react';
import { SPEAKER_ROLES, SPEAKER_ROLE_OPTIONS } from '@/shared/constants/speakerRoles';
import styles from './styles/index.module.css';
import type { ApiError } from '@/types/api';
import type { SessionSpeakerRole } from '@/types/enums';

type SessionSpeaker = {
  user_id: number;
  full_name: string;
  avatar_url?: string | undefined;
  role: string;
};

type AddSpeakerFormValues = {
  user_id: string;
  role: SessionSpeakerRole;
};

type AddSpeakerModalProps = {
  sessionId: number;
  eventId?: number | undefined;
  opened: boolean;
  onClose: () => void;
  currentSpeakers?: SessionSpeaker[] | undefined;
};

export const AddSpeakerModal = ({
  sessionId,
  eventId,
  opened,
  onClose,
  currentSpeakers,
}: AddSpeakerModalProps) => {
  const [addSpeaker, { isLoading }] = useAddSessionSpeakerMutation();

  // Use passed eventId if available, otherwise fetch session to get it
  const { data: session } = useGetSessionQuery(
    sessionId ? { id: sessionId } : skipToken,
    { skip: !sessionId || !!eventId }, // Skip if we have eventId passed
  );

  const finalEventId = eventId || session?.event_id;

  // Note: API types may be incomplete - using any for response
  const { data: eventSpeakersData } = useGetEventUsersQuery(
    finalEventId ? { eventId: finalEventId, role: 'SPEAKER' } : skipToken,
    { skip: !finalEventId },
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventSpeakers = eventSpeakersData as any;

  // Use passed currentSpeakers if available, otherwise fetch them
  const { data: fetchedSpeakersData } = useGetSessionSpeakersQuery(
    { sessionId },
    { skip: !sessionId || !!currentSpeakers }, // Skip if we have passed speakers
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchedSpeakers = fetchedSpeakersData as any;

  const speakersData =
    currentSpeakers || fetchedSpeakers?.session_speakers || fetchedSpeakers?.speakers;

  const form = useForm<AddSpeakerFormValues>({
    initialValues: {
      user_id: '',
      role: SPEAKER_ROLES.SPEAKER as SessionSpeakerRole,
    },
  });

  // Get list of speakers not already assigned to this session
  const availableSpeakers = useMemo(() => {
    const eventUsers = eventSpeakers?.event_users || eventSpeakers?.users;
    if (!eventUsers) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentSpeakerIds = speakersData?.map((s: any) => s.user_id) || [];

    return (
      eventUsers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((user: any) => !currentSpeakerIds.includes(user.user_id))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((user: any) => ({
          value: user.user_id.toString(),
          label: `${user.first_name || ''} ${user.last_name || user.full_name || ''}${user.title ? ` - ${user.title}` : ''}`,
        }))
    );
  }, [eventSpeakers, speakersData]);

  const handleSubmit = async (values: AddSpeakerFormValues) => {
    try {
      await addSpeaker({
        sessionId,
        user_id: parseInt(values.user_id),
        role: values.role,
      }).unwrap();

      form.reset();
      onClose();
    } catch (err: unknown) {
      const error = err as ApiError;
      console.error('Submission error:', error);
      console.error('Error details:', error.data);
      if (error.status === 409) {
        form.setErrors({ user_id: 'Speaker already added to session' });
      } else if (error.status === 400 && error.data?.message) {
        form.setErrors({ user_id: error.data.message });
      } else {
        form.setErrors({ user_id: 'An unexpected error occurred' });
      }
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='Add Speaker to Session'
      centered
      size='sm'
      lockScroll={false}
      classNames={{
        content: styles.modalContent || '',
        header: styles.modalHeader || '',
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap='md' p='lg'>
          {availableSpeakers.length === 0 ?
            <Alert color='blue' variant='light' className={styles.infoAlert || ''}>
              No available speakers found. All event speakers have been assigned to this session, or
              there are no speakers registered for this event.
            </Alert>
          : <>
              <Select
                label='Select Speaker'
                placeholder='Choose a speaker'
                data={availableSpeakers}
                required
                searchable
                classNames={{ input: styles.formSelect || '' }}
                {...form.getInputProps('user_id')}
                disabled={isLoading}
              />

              <Select
                label='Speaker Role'
                data={SPEAKER_ROLE_OPTIONS}
                classNames={{ input: styles.formSelect || '' }}
                {...form.getInputProps('role')}
                disabled={isLoading}
              />

              <div className={styles.buttonGroup || ''}>
                <MantineButton variant='subtle' onClick={onClose} disabled={isLoading}>
                  Cancel
                </MantineButton>
                <Button
                  type='submit'
                  variant='primary'
                  loading={isLoading}
                  disabled={!form.values.user_id}
                >
                  {isLoading ? 'Adding...' : 'Add Speaker'}
                </Button>
              </div>
            </>
          }
        </Stack>
      </form>
    </Modal>
  );
};
