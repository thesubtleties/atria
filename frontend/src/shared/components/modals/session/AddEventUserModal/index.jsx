// shared/components/modals/session/AddEventUserModal/index.jsx
import { TextInput, Button, Stack, Select, Modal, Text } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useAddOrCreateEventUserMutation } from '@/app/features/events/api';
import { useCheckUserExistsQuery } from '@/app/features/users/api';
import { addEventUserSchema } from './schemas/addEventUserSchema';
import { useEffect } from 'react';
import styles from './styles/index.module.css';

const EVENT_USER_ROLES = [
  { value: 'SPEAKER', label: 'Speaker' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'ATTENDEE', label: 'Attendee' },
];

export const AddEventUserModal = ({ eventId, opened, onClose }) => {
  const [addUser, { isLoading }] = useAddOrCreateEventUserMutation();

  const form = useForm({
    initialValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'ATTENDEE',
    },
    validate: zodResolver(addEventUserSchema),
  });

  const email = form.values.email;
  const skipQuery = !email || email.length < 5;
  const { data: userExists, isFetching } = useCheckUserExistsQuery(email, {
    skip: skipQuery,
  });

  useEffect(() => {
    if (userExists?.user) {
      form.setValues({
        firstName: userExists.user.first_name,
        lastName: userExists.user.last_name,
      });
    }
  }, [userExists]);

  useEffect(() => {
    if (!opened) {
      form.reset();
    }
  }, [opened]);

  const handleSubmit = async (values) => {
    try {
      await addUser({
        eventId,
        email: values.email,
        first_name: values.firstName,
        last_name: values.lastName,
        role: values.role,
        password: userExists?.user ? undefined : 'changeme',
      }).unwrap();

      form.reset();
      onClose();
    } catch (error) {
      console.error('Submission error:', error);
      if (error.status === 409) {
        form.setErrors({ email: 'User already in event' });
      } else {
        form.setErrors({
          _schema: error.data?.message || 'An unexpected error occurred',
        });
      }
    }
  };

  const areNameFieldsDisabled =
    isLoading || (userExists?.user !== null && userExists?.user !== undefined);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add User to Event"
      centered
      size="md"
      lockScroll={false}
    >
      <form onSubmit={form.onSubmit(handleSubmit)} className={styles.form}>
        <Stack gap="md">
          <TextInput
            label="Email"
            placeholder="user@email.com"
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

          {userExists?.user && (
            <Text size="sm" color="dimmed">
              Existing user found: {userExists.user.full_name}
            </Text>
          )}

          <Select
            label="Role"
            data={EVENT_USER_ROLES}
            required
            {...form.getInputProps('role')}
            disabled={isLoading}
          />

          <Button type="submit" loading={isLoading} fullWidth>
            {isLoading ? 'Adding...' : 'Add User'}
          </Button>

          {form.errors._schema && (
            <Text c="red" size="sm" align="center">
              {form.errors._schema}
            </Text>
          )}
        </Stack>
      </form>
    </Modal>
  );
};
