import { TextInput, Button, Stack, Select, Modal, Text } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useAddOrCreateEventUserMutation } from '@/app/features/events/api';
import { useCheckUserExistsQuery } from '@/app/features/users/api';
import { addEventUserSchema } from './schemas/addEventUserSchema';
import { useEffect } from 'react';
import styles from './styles/index.module.css';
import type { ApiError } from '@/types/api';

const EVENT_USER_ROLES = [
  { value: 'SPEAKER', label: 'Speaker' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'ATTENDEE', label: 'Attendee' },
] as const;

type EventUserRole = 'ADMIN' | 'ORGANIZER' | 'MODERATOR' | 'SPEAKER' | 'ATTENDEE';

// User exists response
interface UserExistsData {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    full_name?: string;
  } | null;
}

interface AddEventUserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  role: EventUserRole;
}

interface AddEventUserModalProps {
  eventId: number;
  opened: boolean;
  onClose: () => void;
}

export const AddEventUserModal = ({ eventId, opened, onClose }: AddEventUserModalProps) => {
  const [addUser, { isLoading }] = useAddOrCreateEventUserMutation();

  const form = useForm<AddEventUserFormValues>({
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
  const { data: userExistsData } = useCheckUserExistsQuery(email, {
    skip: skipQuery,
  });
  // Cast to extended type that includes user object (API returns more than typed)
  const userExists = userExistsData as UserExistsData | undefined;

  useEffect(() => {
    if (userExists?.user) {
      form.setValues({
        firstName: userExists.user.first_name,
        lastName: userExists.user.last_name,
      });
    }
  }, [userExists, form]);

  useEffect(() => {
    if (!opened) {
      form.reset();
    }
  }, [opened, form]);

  const handleSubmit = async (values: AddEventUserFormValues) => {
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
    } catch (err: unknown) {
      const error = err as ApiError;
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
      title='Add User to Event'
      centered
      size='md'
      lockScroll={false}
    >
      <form onSubmit={form.onSubmit(handleSubmit)} className={styles.form || ''}>
        <Stack gap='md'>
          <TextInput
            label='Email'
            placeholder='user@email.com'
            required
            {...form.getInputProps('email')}
            disabled={isLoading}
          />

          <TextInput
            label='First Name'
            placeholder='First Name'
            required
            {...form.getInputProps('firstName')}
            disabled={areNameFieldsDisabled}
          />

          <TextInput
            label='Last Name'
            placeholder='Last Name'
            required
            {...form.getInputProps('lastName')}
            disabled={areNameFieldsDisabled}
          />

          {userExists?.user && (
            <Text size='sm' c='dimmed'>
              Existing user found: {userExists.user.full_name}
            </Text>
          )}

          <Select
            label='Role'
            data={[...EVENT_USER_ROLES]}
            required
            {...form.getInputProps('role')}
            disabled={isLoading}
          />

          <Button type='submit' loading={isLoading} fullWidth>
            {isLoading ? 'Adding...' : 'Add User'}
          </Button>

          {form.errors._schema && (
            <Text c='red' size='sm' ta='center'>
              {String(form.errors._schema)}
            </Text>
          )}
        </Stack>
      </form>
    </Modal>
  );
};
