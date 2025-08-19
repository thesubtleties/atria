import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Stack,
  Title,
  Text,
  Group,
  PasswordInput,
  Card,
  Progress,
  List,
  ThemeIcon,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconLock, IconShield } from '@tabler/icons-react';
import { useChangePasswordMutation } from '@/app/features/auth/api';
import { Button } from '../../../../shared/components/buttons';
import { securitySettingsSchema } from '../../schemas/securitySchema';
import styles from './styles.module.css';

// Password strength checker
const getPasswordStrength = (password) => {
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[^A-Za-z0-9]/.test(password),
  };
  
  Object.values(checks).forEach(check => {
    if (check) strength += 20;
  });
  
  return { strength, checks };
};

const getPasswordStrengthColor = (strength) => {
  if (strength < 40) return 'red';
  if (strength < 60) return 'orange';
  if (strength < 80) return 'yellow';
  return 'green';
};

const SecuritySettings = () => {
  const currentUser = useSelector((state) => state.auth.user);
  const [hasChanges, setHasChanges] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, checks: {} });
  
  // Change password mutation
  const [changePassword, { isLoading: isSubmitting }] = useChangePasswordMutation();
  
  // Form setup
  const form = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: zodResolver(securitySettingsSchema),
  });
  
  // Track changes and password strength
  React.useEffect(() => {
    const hasAnyValue = Object.values(form.values).some(value => value.trim() !== '');
    setHasChanges(hasAnyValue);
    
    // Update password strength for new password
    if (form.values.newPassword) {
      const strengthData = getPasswordStrength(form.values.newPassword);
      setPasswordStrength(strengthData);
    } else {
      setPasswordStrength({ strength: 0, checks: {} });
    }
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
      {/* Header Section */}
      <div className={styles.headerSection}>
        <Title order={3} className={styles.sectionTitle}>Security Settings</Title>
        <Text size="sm" className={styles.description}>
          Keep your account secure with a strong password and security best practices
        </Text>
      </div>
      
      
      {/* Password Change Card */}
      <Card className={styles.passwordCard}>
        <Group mb="md" justify="space-between" align="flex-start">
          <div>
            <Text fw={500} className={styles.cardTitle}>
              <IconLock size={18} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
              Change Password
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
              Update your password to maintain account security
            </Text>
          </div>
        </Group>
        
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <PasswordInput
              className={styles.formInput}
              label="Current Password"
              placeholder="Enter your current password"
              {...form.getInputProps('currentPassword')}
              leftSection={<IconLock size={16} />}
              size="md"
            />
            
            <div>
              <PasswordInput
                className={styles.formInput}
                label="New Password"
                placeholder="Enter your new password"
                {...form.getInputProps('newPassword')}
                leftSection={<IconLock size={16} />}
                size="md"
              />
              
              {/* Password Strength Indicator */}
              {form.values.newPassword && (
                <div className={styles.passwordStrength}>
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">Password Strength</Text>
                    <Text size="xs" c="dimmed">
                      {passwordStrength.strength < 40 ? 'Weak' : 
                       passwordStrength.strength < 60 ? 'Fair' : 
                       passwordStrength.strength < 80 ? 'Good' : 'Strong'}
                    </Text>
                  </Group>
                  <Progress 
                    value={passwordStrength.strength} 
                    color={getPasswordStrengthColor(passwordStrength.strength)}
                    size="xs"
                    mb="xs"
                  />
                  <List spacing={2} size="xs" c="dimmed">
                    <List.Item 
                      icon={<ThemeIcon size={12} color={passwordStrength.checks.length ? 'green' : 'gray'} variant="filled">
                        {passwordStrength.checks.length ? <IconCheck size={8} /> : <IconX size={8} />}
                      </ThemeIcon>}
                    >
                      At least 8 characters
                    </List.Item>
                    <List.Item 
                      icon={<ThemeIcon size={12} color={passwordStrength.checks.uppercase ? 'green' : 'gray'} variant="filled">
                        {passwordStrength.checks.uppercase ? <IconCheck size={8} /> : <IconX size={8} />}
                      </ThemeIcon>}
                    >
                      Uppercase letter
                    </List.Item>
                    <List.Item 
                      icon={<ThemeIcon size={12} color={passwordStrength.checks.lowercase ? 'green' : 'gray'} variant="filled">
                        {passwordStrength.checks.lowercase ? <IconCheck size={8} /> : <IconX size={8} />}
                      </ThemeIcon>}
                    >
                      Lowercase letter
                    </List.Item>
                    <List.Item 
                      icon={<ThemeIcon size={12} color={passwordStrength.checks.numbers ? 'green' : 'gray'} variant="filled">
                        {passwordStrength.checks.numbers ? <IconCheck size={8} /> : <IconX size={8} />}
                      </ThemeIcon>}
                    >
                      Number
                    </List.Item>
                    <List.Item 
                      icon={<ThemeIcon size={12} color={passwordStrength.checks.symbols ? 'green' : 'gray'} variant="filled">
                        {passwordStrength.checks.symbols ? <IconCheck size={8} /> : <IconX size={8} />}
                      </ThemeIcon>}
                    >
                      Special character
                    </List.Item>
                  </List>
                </div>
              )}
            </div>
            
            <PasswordInput
              className={styles.formInput}
              label="Confirm New Password"
              placeholder="Confirm your new password"
              {...form.getInputProps('confirmPassword')}
              leftSection={<IconLock size={16} />}
              size="md"
            />
            
            {/* Button Group */}
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
      </Card>
      
      {/* Security Tips Card */}
      <Card className={styles.tipsCard}>
        <Text fw={500} mb="md" className={styles.cardTitle}>
          <IconShield size={18} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
          Security Best Practices
        </Text>
        <List spacing="sm" size="sm" c="dimmed">
          <List.Item icon={<ThemeIcon size={16} color="blue" variant="light"><IconCheck size={12} /></ThemeIcon>}>
            Use a unique password that you don't use on other websites
          </List.Item>
          <List.Item icon={<ThemeIcon size={16} color="blue" variant="light"><IconCheck size={12} /></ThemeIcon>}>
            Include a mix of uppercase, lowercase, numbers, and special characters
          </List.Item>
          <List.Item icon={<ThemeIcon size={16} color="blue" variant="light"><IconCheck size={12} /></ThemeIcon>}>
            Avoid using personal information like birthdays or names
          </List.Item>
          <List.Item icon={<ThemeIcon size={16} color="blue" variant="light"><IconCheck size={12} /></ThemeIcon>}>
            Consider using a password manager to generate and store secure passwords
          </List.Item>
        </List>
      </Card>
    </Stack>
  );
};

export default SecuritySettings;