import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Stack,
  Title,
  Text,
  Group,
  PasswordInput,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconLock } from '@tabler/icons-react';
import { useChangePasswordMutation } from '@/app/features/auth/api';
import { Button } from '../../../../shared/components/buttons';
import { securitySettingsSchema } from '../../schemas/securitySchema';
import styles from './styles.module.css';

const SecuritySettings = () => {
  const currentUser = useSelector((state) => state.auth.user);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Change password mutation
  const [changePassword, { isLoading: isSubmitting }] = useChangePasswordMutation();
  
  // Form setup
  const form = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    resolver: zodResolver(securitySettingsSchema),
  });
  
  // Track changes
  React.useEffect(() => {
    const hasAnyValue = Object.values(form.values).some(value => value.trim() !== '');
    setHasChanges(hasAnyValue);
  }, [form.values]);
  
  const handleSubmit = async (values) => {
    try {
      await changePassword({
        current_password: values.currentPassword,
        new_password: values.newPassword,
      }).unwrap();
      
      // Reset form after successful change
      form.reset();
      setHasChanges(false);
      
      notifications.show({
        title: 'Success',
        message: 'Password updated successfully',
        color: 'green',
        icon: <IconCheck />,
      });
    } catch (error) {
      // Handle field errors
      if (error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, errors]) => {
          // Map backend field names to form field names
          const fieldMap = {
            current_password: 'currentPassword',
            new_password: 'newPassword',
          };
          const formField = fieldMap[field] || field;
          form.setFieldError(formField, errors[0]);
        });
      }
      
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to update password',
        color: 'red',
        icon: <IconX />,
      });
    }
  };
  
  const handleReset = () => {
    form.reset();
    setHasChanges(false);
  };
  
  return (
    <Stack gap="lg">
      {/* Header Section - exactly like PrivacySettings */}
      <div className={styles.headerSection}>
        <Title order={3} className={styles.sectionTitle}>Security Settings</Title>
        <Text size="sm" className={styles.description}>
          Update your password to keep your account secure
        </Text>
      </div>
      
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Password Form Section */}
          <div className={styles.formSection}>
            <Text className={styles.sectionLabel}>Change Password</Text>
            
            <Stack gap="md">
              <PasswordInput
                className={styles.formInput}
                label="Current Password"
                placeholder="Enter your current password"
                {...form.getInputProps('currentPassword')}
                leftSection={<IconLock size={16} />}
                size="md"
              />
              
              <PasswordInput
                className={styles.formInput}
                label="New Password"
                placeholder="Enter your new password"
                {...form.getInputProps('newPassword')}
                leftSection={<IconLock size={16} />}
                size="md"
              />
              
              <PasswordInput
                className={styles.formInput}
                label="Confirm New Password"
                placeholder="Confirm your new password"
                {...form.getInputProps('confirmPassword')}
                leftSection={<IconLock size={16} />}
                size="md"
              />
            </Stack>
          </div>
          
          {/* Button Group - exactly like PrivacySettings */}
          {hasChanges && (
            <Group justify="flex-end" mt="md" className={styles.buttonGroup}>
              <Button
                variant="subtle"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                <IconX size={16} />
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={isSubmitting}
              >
                <IconCheck size={16} />
                Update Password
              </Button>
            </Group>
          )}
        </Stack>
      </form>
    </Stack>
  );
};

export default SecuritySettings;