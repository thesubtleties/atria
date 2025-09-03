// shared/components/modals/session/AddSpeakerModal/index.jsx
import { Select, Stack, Modal, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { 
  useAddSessionSpeakerMutation, 
  useGetSessionQuery,
  useGetSessionSpeakersQuery 
} from '@/app/features/sessions/api';
import { useGetEventUsersQuery } from '@/app/features/events/api';
import { Button } from '@/shared/components/buttons';
import { useMemo } from 'react';
import { SPEAKER_ROLES, SPEAKER_ROLE_OPTIONS } from '@/shared/constants/speakerRoles';
import styles from './styles/index.module.css';

export const AddSpeakerModal = ({ sessionId, eventId, opened, onClose, currentSpeakers }) => {
  const [addSpeaker, { isLoading }] = useAddSessionSpeakerMutation();
  
  // Use passed eventId if available, otherwise fetch session to get it
  const { data: session } = useGetSessionQuery(sessionId, { 
    skip: !sessionId || !!eventId // Skip if we have eventId passed
  });
  
  const finalEventId = eventId || session?.event_id;
  
  const { data: eventSpeakers } = useGetEventUsersQuery(
    { eventId: finalEventId, role: 'SPEAKER' },
    { skip: !finalEventId }
  );
  
  // Use passed currentSpeakers if available, otherwise fetch them
  const { data: fetchedSpeakers } = useGetSessionSpeakersQuery(
    { sessionId },
    { skip: !sessionId || !!currentSpeakers } // Skip if we have passed speakers
  );
  
  const speakersData = currentSpeakers || fetchedSpeakers?.session_speakers;

  const form = useForm({
    initialValues: {
      user_id: '',
      role: SPEAKER_ROLES.SPEAKER,
    },
  });

  // Get list of speakers not already assigned to this session
  const availableSpeakers = useMemo(() => {
    if (!eventSpeakers?.event_users) return [];
    
    const currentSpeakerIds = speakersData?.map(s => s.user_id) || [];
    
    return eventSpeakers.event_users
      .filter(user => !currentSpeakerIds.includes(user.user_id))
      .map(user => ({
        value: user.user_id.toString(),
        label: `${user.first_name} ${user.last_name}${user.title ? ` - ${user.title}` : ''}`,
      }));
  }, [eventSpeakers, speakersData]);

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
      lockScroll={false}
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md" p="lg">
          {availableSpeakers.length === 0 ? (
            <Alert color="blue" variant="light" className={styles.infoAlert}>
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
                classNames={{ input: styles.formSelect }}
                {...form.getInputProps('user_id')}
                disabled={isLoading}
              />

              <Select
                label="Speaker Role"
                data={SPEAKER_ROLE_OPTIONS}
                classNames={{ input: styles.formSelect }}
                {...form.getInputProps('role')}
                disabled={isLoading}
              />

              <div className={styles.buttonGroup}>
                <Button variant="subtle" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  loading={isLoading} 
                  disabled={!form.values.user_id}
                >
                  {isLoading ? 'Adding...' : 'Add Speaker'}
                </Button>
              </div>
            </>
          )}
        </Stack>
      </form>
    </Modal>
  );
};