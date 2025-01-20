import { TextInput, Button, Stack, Select, Modal } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useAddOrganizationUserMutation } from '@/app/features/organizations/api';
import { useCheckUserExistsQuery } from '@/app/features/users/api';
import { inviteUserSchema } from './schemas/inviteUserSchema';
import { useEffect } from 'react';
import styles from './styles/index.module.css';

const ROLES = [
  { value: 'MEMBER', label: 'Member' },
  { value: 'ADMIN', label: 'Admin' },
];

export const InviteUserModal = ({ organizationId, opened, onClose }) => {
  const [addUser, { isLoading }] = useAddOrganizationUserMutation();

  const form = useForm({
    initialValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'member',
    },
    validate: zodResolver(inviteUserSchema),
  });

  // Only skip if email is empty or too short
  const email = form.values.email;
  const skipQuery = !email || email.length < 5; // Basic length check
  const { data: userExists, isFetching } = useCheckUserExistsQuery(email, {
    skip: skipQuery,
  });

  // When email changes and user exists, pre-fill name fields
  useEffect(() => {
    if (userExists?.user) {
      form.setValues({
        firstName: userExists.user.first_name,
        lastName: userExists.user.last_name,
      });
    }
  }, [userExists]);

  const handleSubmit = async (values) => {
    try {
      await addUser({
        orgId: organizationId,
        email: values.email,
        first_name: values.firstName,
        last_name: values.lastName,
        role: values.role, // This will be handled separately in backend
        password: userExists?.user ? undefined : 'changeme',
      }).unwrap();

      form.reset();
      onClose();
    } catch (error) {
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
      title="Add Member"
      centered
      size="md"
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

          <Select
            label="Role"
            data={ROLES}
            required
            {...form.getInputProps('role')}
            disabled={isLoading}
          />

          <Button type="submit" loading={isLoading} fullWidth>
            {isLoading ? 'Adding...' : 'Add Member'}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};
