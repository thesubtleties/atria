import { TextInput, Button, Stack, Modal } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useEffect } from 'react';
import {
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
} from '@/app/features/organizations/api';
import { organizationSchema } from './schemas/organizationSchema';
import styles from './styles/index.module.css';

export const OrganizationModal = ({
  organization,
  opened,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!organization;

  const [createOrganization, { isLoading: isCreating }] =
    useCreateOrganizationMutation();
  const [updateOrganization, { isLoading: isUpdating }] =
    useUpdateOrganizationMutation();

  const isLoading = isCreating || isUpdating;

  const form = useForm({
    initialValues: {
      name: organization?.name || '',
    },
    validate: zodResolver(organizationSchema),
  });
  useEffect(() => {
    if (!opened) {
      form.reset();
    }
  }, [opened]);

  const handleSubmit = async (values) => {
    try {
      if (isEditing) {
        await updateOrganization({
          id: organization.id,
          ...values,
        }).unwrap();
      } else {
        await createOrganization(values).unwrap();
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      if (error.status === 409) {
        form.setErrors({
          name: 'An organization with this name already exists',
        });
      } else {
        form.setErrors({ name: 'An unexpected error occurred' });
      }
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? 'Edit Organization' : 'Create Organization'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)} className={styles.form}>
        <Stack gap="md">
          <TextInput
            label="Organization Name"
            placeholder="Enter organization name"
            required
            {...form.getInputProps('name')}
            disabled={isLoading}
          />

          <Button type="submit" loading={isLoading} fullWidth>
            {isLoading
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
                ? 'Update Organization'
                : 'Create Organization'}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};
