import { TextInput, Button, Stack, Select, Modal } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useAddOrganizationUserMutation } from '@/app/features/organizations/api';
import { useCheckUserExistsQuery } from '@/app/features/users/api';
import { inviteUserSchema } from './schemas/inviteUserSchema';
import { useEffect } from 'react';
import styles from './styles/index.module.css';
import type { ApiError } from '@/types/api';

const ROLES = [
  { value: 'MEMBER', label: 'Member' },
  { value: 'ADMIN', label: 'Admin' },
] as const;

type OrganizationUserRole = 'ADMIN' | 'MEMBER' | 'OWNER';

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

interface InviteUserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  role: OrganizationUserRole;
}

interface InviteUserModalProps {
  organizationId: number;
  opened: boolean;
  onClose: () => void;
}

export const InviteUserModal = ({ organizationId, opened, onClose }: InviteUserModalProps) => {
  const [addUser, { isLoading }] = useAddOrganizationUserMutation();

  const form = useForm<InviteUserFormValues>({
    initialValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'MEMBER',
    },
    validate: zodResolver(inviteUserSchema),
  });

  // Only skip if email is empty or too short
  const email = form.values.email;
  const skipQuery = !email || email.length < 5; // Basic length check
  const { data: userExistsData } = useCheckUserExistsQuery(email, {
    skip: skipQuery,
  });
  // Cast to extended type that includes user object (API returns more than typed)
  const userExists = userExistsData as UserExistsData | undefined;

  // When email changes and user exists, pre-fill name fields
  useEffect(() => {
    if (userExists?.user) {
      form.setValues({
        firstName: userExists.user.first_name,
        lastName: userExists.user.last_name,
      });
    }
    // IMPORTANT: DO NOT add 'form' to dependencies - it causes infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userExists]);

  const handleSubmit = async (values: InviteUserFormValues) => {
    try {
      await addUser({
        orgId: organizationId,
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
        form.setErrors({ email: 'User already in organization' });
      } else {
        form.setErrors({ email: 'An unexpected error occurred' });
      }
    }
  };

  // Only disable fields if we have a confirmed existing user
  const areNameFieldsDisabled =
    isLoading || (userExists?.user !== null && userExists?.user !== undefined);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='Add Member'
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

          <Select
            label='Role'
            data={[...ROLES]}
            required
            {...form.getInputProps('role')}
            disabled={isLoading}
          />

          <Button type='submit' loading={isLoading} fullWidth>
            {isLoading ? 'Adding...' : 'Add Member'}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};
