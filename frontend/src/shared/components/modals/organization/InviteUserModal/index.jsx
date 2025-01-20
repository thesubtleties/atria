import { TextInput, Button, Stack, Select, Modal } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useAddOrganizationUserMutation } from '@/app/features/organizations/api';
import { inviteUserSchema } from './schemas/inviteUserSchema';
import styles from './styles/index.module.css';

const ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
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

  const handleSubmit = async (values) => {
    try {
      await addUser({
        orgId: organizationId,
        email: values.email,
        first_name: values.firstName,
        last_name: values.lastName,
        role: values.role,
        password: 'changeme', // Default password for new users
      }).unwrap();

      onClose();
    } catch (error) {
      if (error.status === 409) {
        form.setErrors({ email: 'User already in organization' });
      } else {
        form.setErrors({ email: 'An unexpected error occurred' });
      }
    }
  };

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
            disabled={isLoading}
          />

          <TextInput
            label="Last Name"
            placeholder="Last Name"
            required
            {...form.getInputProps('lastName')}
            disabled={isLoading}
          />

          <Select
            label="Role"
            data={ROLES}
            required
            {...form.getInputProps('role')}
            disabled={isLoading}
          />

          <Button type="submit" loading={isLoading} fullWidth>
            {isLoading ? 'Inviting...' : 'Invite User'}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};
