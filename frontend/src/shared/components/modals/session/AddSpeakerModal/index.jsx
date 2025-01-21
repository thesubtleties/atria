// shared/components/modals/session/AddSpeakerModal/index.jsx
import { TextInput, Button, Stack, Modal, Textarea } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useAddSessionSpeakerMutation } from '@/app/features/sessions/api';
import { useCheckUserExistsQuery } from '@/app/features/users/api';
import { addSpeakerSchema } from './schemas/addSpeakerSchema';
import { useEffect } from 'react';
import styles from './styles/index.module.css';

export const AddSpeakerModal = ({ sessionId, opened, onClose }) => {
  const [addSpeaker, { isLoading }] = useAddSessionSpeakerMutation();

  const form = useForm({
    initialValues: {
      email: '',
      firstName: '',
      lastName: '',
      title: '',
      speaker_bio: '',
    },
    validate: zodResolver(addSpeakerSchema),
  });

  // Skip if email is empty or too short
  const email = form.values.email;
  const skipQuery = !email || email.length < 5;
  const { data: userExists, isFetching } = useCheckUserExistsQuery(email, {
    skip: skipQuery,
  });

  // Pre-fill form if user exists
  useEffect(() => {
    if (userExists?.user) {
      form.setValues({
        firstName: userExists.user.first_name,
        lastName: userExists.user.last_name,
        title: userExists.user.title || '',
        speaker_bio: userExists.user.bio || '',
      });
    }
  }, [userExists]);

  const handleSubmit = async (values) => {
    try {
      await addSpeaker({
        sessionId,
        email: values.email,
        first_name: values.firstName,
        last_name: values.lastName,
        title: values.title,
        speaker_bio: values.speaker_bio,
      }).unwrap();

      form.reset();
      onClose();
    } catch (error) {
      console.error('Submission error:', error);
      if (error.status === 409) {
        form.setErrors({ email: 'Speaker already added to session' });
      } else {
        form.setErrors({ email: 'An unexpected error occurred' });
      }
    }
  };

  const areNameFieldsDisabled =
    isLoading || (userExists?.user !== null && userExists?.user !== undefined);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add Speaker"
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)} className={styles.form}>
        <Stack gap="md">
          <TextInput
            label="Email"
            placeholder="speaker@email.com"
            required
            {...form.getInputProps('email')}
            disabled={isLoading}
          />

          <TextInput
            label="First Name"
            placeholder="First Name"
            required
            {...form.getInputProps('firstName')}
            disabled={areNameFieldsDisabled}
          />

          <TextInput
            label="Last Name"
            placeholder="Last Name"
            required
            {...form.getInputProps('lastName')}
            disabled={areNameFieldsDisabled}
          />

          <TextInput
            label="Title"
            placeholder="Speaker Title"
            {...form.getInputProps('title')}
            disabled={isLoading}
          />

          <Textarea
            label="Speaker Bio"
            placeholder="Speaker Biography"
            minRows={3}
            {...form.getInputProps('speaker_bio')}
            disabled={isLoading}
          />

          <Button type="submit" loading={isLoading} fullWidth>
            {isLoading ? 'Adding...' : 'Add Speaker'}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};
