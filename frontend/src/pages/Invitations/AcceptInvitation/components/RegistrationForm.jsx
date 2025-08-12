import { useState } from 'react';
import { 
  TextInput, 
  PasswordInput, 
  Title, 
  Text, 
  Stack,
  Alert,
  Progress,
  List,
  Group
} from '@mantine/core';
import { Button } from '../../../../shared/components/buttons';
import { useForm, zodResolver } from '@mantine/form';
import { IconCheck, IconX, IconLock, IconMail } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { useRegisterAndAcceptInvitationsMutation } from '../../../../app/features/invitations/api';
import { setUser } from '../../../../app/store/authSlice';
import { registrationSchema } from '../schemas/registrationSchema';
import styles from '../styles/RegistrationForm.module.css';

const RegistrationForm = ({ email, selectedInvitations, onSuccess }) => {
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [registerAndAccept, { isLoading, error }] = useRegisterAndAcceptInvitationsMutation();
  const dispatch = useDispatch();

  const form = useForm({
    initialValues: {
      first_name: '',
      last_name: '',
      password: '',
      confirmPassword: ''
    },
    validate: zodResolver(registrationSchema)
  });

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 12.5;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 12.5;
    return strength;
  };

  const handlePasswordChange = (value) => {
    form.setFieldValue('password', value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'red';
    if (passwordStrength < 70) return 'yellow';
    return 'green';
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Fair';
    return 'Strong';
  };

  const handleSubmit = async (values) => {
    try {
      const result = await registerAndAccept({
        user_data: {
          email,
          first_name: values.first_name,
          last_name: values.last_name,
          password: values.password
        },
        org_invitation_ids: selectedInvitations.organization_ids,
        event_invitation_ids: selectedInvitations.event_ids
      }).unwrap();

      // Update auth state with user
      dispatch(setUser(result.user));
      
      // Store tokens (they'll be in cookies, but we might need them)
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('refresh_token', result.refresh_token);
      
      // Call success callback
      onSuccess();
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const totalSelected = selectedInvitations.organization_ids.length + 
                       selectedInvitations.event_ids.length;

  return (
    <div className={styles.container}>
      <Title order={3} mb="md" className={styles.title}>Create Your Account</Title>
      <Text size="sm" c="dimmed" mb="xl" className={styles.subtitle}>
        Complete your registration to accept your invitations
      </Text>

      {error && (
        <Alert color="red" mb="md" icon={<IconX />} className={styles.errorAlert}>
          {error.data?.message || 'Registration failed. Please try again.'}
        </Alert>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Email"
            value={email}
            disabled
            leftSection={<IconMail size={16} />}
            classNames={{ input: styles.disabledInput }}
          />

          <Group grow>
            <TextInput
              label="First Name"
              placeholder="Enter your first name"
              required
              classNames={{ input: styles.input }}
              {...form.getInputProps('first_name')}
            />

            <TextInput
              label="Last Name"
              placeholder="Enter your last name"
              required
              classNames={{ input: styles.input }}
              {...form.getInputProps('last_name')}
            />
          </Group>

          <div>
            <PasswordInput
              label="Password"
              placeholder="Create a password"
              required
              leftSection={<IconLock size={16} />}
              value={form.values.password}
              onChange={(e) => handlePasswordChange(e.currentTarget.value)}
              error={form.errors.password}
              classNames={{ input: styles.input }}
            />
            {form.values.password && (
              <div className={styles.passwordStrength}>
                <Progress 
                  value={passwordStrength} 
                  color={getPasswordStrengthColor()}
                  size="xs"
                  mt={4}
                  className={styles.progressBar}
                />
                <Text size="xs" c={getPasswordStrengthColor()} mt={2} className={styles.strengthText}>
                  Password strength: {getPasswordStrengthLabel()}
                </Text>
              </div>
            )}
          </div>

          <PasswordInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            required
            leftSection={<IconLock size={16} />}
            classNames={{ input: styles.input }}
            {...form.getInputProps('confirmPassword')}
          />

          <div className={styles.summary}>
            <Text size="sm" fw={500} mb="xs" className={styles.summaryTitle}>
              You're accepting {totalSelected} invitation{totalSelected !== 1 ? 's' : ''}:
            </Text>
            <List size="sm" spacing={4} icon={<IconCheck size={14} />} className={styles.summaryList}>
              {selectedInvitations.organization_ids.length > 0 && (
                <List.Item className={styles.listItem}>
                  {selectedInvitations.organization_ids.length} organization invitation
                  {selectedInvitations.organization_ids.length !== 1 ? 's' : ''}
                </List.Item>
              )}
              {selectedInvitations.event_ids.length > 0 && (
                <List.Item className={styles.listItem}>
                  {selectedInvitations.event_ids.length} event invitation
                  {selectedInvitations.event_ids.length !== 1 ? 's' : ''}
                </List.Item>
              )}
            </List>
          </div>

          <Button 
            type="submit" 
            variant="primary"
            disabled={totalSelected === 0 || isLoading}
            className={`${styles.submitButton} ${styles.fullWidth}`}
          >
            {isLoading ? 'Creating Account...' : 'Create Account & Accept Invitations'}
          </Button>
        </Stack>
      </form>
    </div>
  );
};

export default RegistrationForm;