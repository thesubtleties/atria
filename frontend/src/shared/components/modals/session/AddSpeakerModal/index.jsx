// shared/components/modals/session/AddSpeakerModal/index.jsx
import { Select, Button, Stack, Modal, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { 
  useAddSessionSpeakerMutation, 
  useGetSessionQuery,
  useGetSessionSpeakersQuery 
} from '@/app/features/sessions/api';
import { useGetEventUsersQuery } from '@/app/features/events/api';
import { useMemo } from 'react';
import { SPEAKER_ROLES, SPEAKER_ROLE_OPTIONS } from '@/shared/constants/speakerRoles';
import styles from './styles/index.module.css';

export const AddSpeakerModal = ({ sessionId, opened, onClose }) => {
  const [addSpeaker, { isLoading }] = useAddSessionSpeakerMutation();
  const { data: session } = useGetSessionQuery(sessionId, { skip: !sessionId });
  const { data: eventSpeakers } = useGetEventUsersQuery(
    { eventId: session?.event_id, role: 'SPEAKER' },
    { skip: !session?.event_id }
  );
  const { data: currentSpeakers } = useGetSessionSpeakersQuery(
    { sessionId },
    { skip: !sessionId }
  );

  const form = useForm({
    initialValues: {
      user_id: '',
      role: SPEAKER_ROLES.SPEAKER,
    },
  });

  // Get list of speakers not already assigned to this session
  const availableSpeakers = useMemo(() => {
    if (!eventSpeakers?.event_users) return [];
    
    const currentSpeakerIds = currentSpeakers?.session_speakers?.map(s => s.user_id) || [];
    
    return eventSpeakers.event_users
      .filter(user => !currentSpeakerIds.includes(user.user_id))
      .map(user => ({
        value: user.user_id.toString(),
        label: `${user.first_name} ${user.last_name}${user.title ? ` - ${user.title}` : ''}`,
      }));
  }, [eventSpeakers, currentSpeakers]);

  const handleSubmit = async (values) => {
    try {
      await addSpeaker({
        sessionId,
        user_id: parseInt(values.user_id),
        role: values.role,
      }).unwrap();

      form.reset();
      onClose();
    } catch (error) {
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
      title="Add Speaker to Session"
      centered
      size="sm"
    >
      <form onSubmit={form.onSubmit(handleSubmit)} className={styles.form}>
        <Stack gap="md">
          {availableSpeakers.length === 0 ? (
            <Alert color="yellow" variant="light">
              No available speakers found. All event speakers have been assigned to this session, 
              or there are no speakers registered for this event.
            </Alert>
          ) : (
            <>
              <Select
                label="Select Speaker"
                placeholder="Choose a speaker"
                data={availableSpeakers}
                required
                searchable
                {...form.getInputProps('user_id')}
                disabled={isLoading}
              />

              <Select
                label="Speaker Role"
                data={SPEAKER_ROLE_OPTIONS}
                {...form.getInputProps('role')}
                disabled={isLoading}
              />

              <Button 
                type="submit" 
                loading={isLoading} 
                fullWidth
                disabled={!form.values.user_id}
              >
                {isLoading ? 'Adding...' : 'Add Speaker'}
              </Button>
            </>
          )}
        </Stack>
      </form>
    </Modal>
  );
};