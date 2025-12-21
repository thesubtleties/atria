import { useState, type ChangeEvent } from 'react';
import {
  TextInput,
  PasswordInput,
  Title,
  Text,
  Stack,
  Alert,
  Progress,
  List,
  Group,
} from '@mantine/core';
import { Button } from '../../../../shared/components/buttons';
import { useForm, zodResolver } from '@mantine/form';
import { IconCheck, IconX, IconLock, IconMail } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { useRegisterAndAcceptInvitationsMutation } from '../../../../app/features/invitations/api';
import { setUser } from '../../../../app/store/authSlice';
import { registrationSchema } from '../schemas/registrationSchema';
import type { RegistrationFormData } from '../schemas/registrationSchema';
import type { SelectedInvitations } from '../index';
import type { AppDispatch, ApiError, User } from '@/types';
import { cn } from '@/lib/cn';
import styles from '../styles/RegistrationForm.module.css';

type RegistrationFormProps = {
  email: string;
  selectedInvitations: SelectedInvitations;
  onSuccess: () => void;
};

const RegistrationForm = ({ email, selectedInvitations, onSuccess }: RegistrationFormProps) => {
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [registerAndAccept, { isLoading, error }] = useRegisterAndAcceptInvitationsMutation();
  const dispatch = useDispatch<AppDispatch>();

  const form = useForm<RegistrationFormData>({
    initialValues: {
      first_name: '',
      last_name: '',
      password: '',
      confirmPassword: '',
    },
    validate: zodResolver(registrationSchema),
  });

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 12.5;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 12.5;
    return strength;
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    form.setFieldValue('password', value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const getPasswordStrengthColor = (): string => {
    if (passwordStrength < 40) return 'red';
    if (passwordStrength < 70) return 'yellow';
    return 'green';
  };

  const getPasswordStrengthLabel = (): string => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Fair';
    return 'Strong';
  };

  const handleSubmit = async (values: RegistrationFormData) => {
    try {
      const result = await registerAndAccept({
        user_data: {
          email,
          first_name: values.first_name,
          last_name: values.last_name,
          password: values.password,
        },
        org_invitation_ids: selectedInvitations.organization_ids,
        event_invitation_ids: selectedInvitations.event_ids,
      }).unwrap();

      // Update auth state with user (cast to User since API returns partial data)
      dispatch(setUser(result.user as unknown as User));

      // Store tokens (they'll be in cookies, but we might need them)
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('refresh_token', result.refresh_token);

      // Call success callback
      onSuccess();
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const totalSelected =
    selectedInvitations.organization_ids.length + selectedInvitations.event_ids.length;

  const apiError = error as ApiError | undefined;

  return (
    <div className={cn(styles.container)}>
      <Title order={3} mb='md' className={cn(styles.title)}>
        Create Your Account
      </Title>
      <Text size='sm' c='dimmed' mb='xl' className={cn(styles.subtitle)}>
        Complete your registration to accept your invitations
      </Text>

      {apiError && (
        <Alert color='red' mb='md' icon={<IconX />} className={cn(styles.errorAlert)}>
          {apiError.data?.message || 'Registration failed. Please try again.'}
        </Alert>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap='md'>
          <TextInput
            label='Email'
            value={email}
            disabled
            leftSection={<IconMail size={16} />}
            classNames={{ input: cn(styles.disabledInput) }}
          />

          <Group grow>
            <TextInput
              label='First Name'
              placeholder='Enter your first name'
              required
              classNames={{ input: cn(styles.input) }}
              {...form.getInputProps('first_name')}
            />

            <TextInput
              label='Last Name'
              placeholder='Enter your last name'
              required
              classNames={{ input: cn(styles.input) }}
              {...form.getInputProps('last_name')}
            />
          </Group>

          <div>
            <PasswordInput
              label='Password'
              placeholder='Create a password'
              required
              leftSection={<IconLock size={16} />}
              value={form.values.password}
              onChange={handlePasswordChange}
              error={form.errors.password}
              classNames={{ input: cn(styles.input) }}
            />
            {form.values.password && (
              <div className={cn(styles.passwordStrength)}>
                <Progress
                  value={passwordStrength}
                  color={getPasswordStrengthColor()}
                  size='xs'
                  mt={4}
                  className={cn(styles.progressBar)}
                />
                <Text
                  size='xs'
                  c={getPasswordStrengthColor()}
                  mt={2}
                  className={cn(styles.strengthText)}
                >
                  Password strength: {getPasswordStrengthLabel()}
                </Text>
              </div>
            )}
          </div>

          <PasswordInput
            label='Confirm Password'
            placeholder='Re-enter your password'
            required
            leftSection={<IconLock size={16} />}
            classNames={{ input: cn(styles.input) }}
            {...form.getInputProps('confirmPassword')}
          />

          <div className={cn(styles.summary)}>
            <Text size='sm' fw={500} mb='xs' className={cn(styles.summaryTitle)}>
              {"You're accepting "}
              {totalSelected}
              {' invitation'}
              {totalSelected !== 1 ? 's' : ''}:
            </Text>
            <List
              size='sm'
              spacing={4}
              icon={<IconCheck size={14} />}
              className={cn(styles.summaryList)}
            >
              {selectedInvitations.organization_ids.length > 0 && (
                <List.Item className={cn(styles.listItem)}>
                  {selectedInvitations.organization_ids.length} organization invitation
                  {selectedInvitations.organization_ids.length !== 1 ? 's' : ''}
                </List.Item>
              )}
              {selectedInvitations.event_ids.length > 0 && (
                <List.Item className={cn(styles.listItem)}>
                  {selectedInvitations.event_ids.length} event invitation
                  {selectedInvitations.event_ids.length !== 1 ? 's' : ''}
                </List.Item>
              )}
            </List>
          </div>

          <Button
            type='submit'
            variant='primary'
            disabled={totalSelected === 0 || isLoading}
            className={cn(styles.submitButton, styles.fullWidth)}
          >
            {isLoading ? 'Creating Account...' : 'Create Account & Accept Invitations'}
          </Button>
        </Stack>
      </form>
    </div>
  );
};

export default RegistrationForm;
