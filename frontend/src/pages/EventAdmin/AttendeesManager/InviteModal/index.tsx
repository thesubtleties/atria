import { useState } from 'react';
import { Modal, TextInput, Select, Textarea, Stack, Tabs, Text, Alert } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { useMediaQuery } from '@mantine/hooks';
import { IconAlertCircle, IconUsers, IconUserPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { invitationSchema, getRoleDisplayName } from '../schemas/attendeeSchemas';
import type { EventUserRoleType, InvitationFormData } from '../schemas/attendeeSchemas';
import {
  useSendEventInvitationMutation,
  useSendBulkEventInvitationsMutation,
} from '@/app/features/eventInvitations/api';
import { Button } from '@/shared/components/buttons';
import { cn } from '@/lib/cn';
import styles from './styles.module.css';
import type { EventUserRole } from '@/types/enums';

type InviteModalProps = {
  opened: boolean;
  onClose: () => void;
  eventId: number | undefined;
  currentUserRole: EventUserRoleType;
  onSuccess?: () => void;
};

type BulkFormValues = {
  role: EventUserRoleType;
  message: string;
};

type BulkInvitationsResult = {
  successful?: Array<{ email: string }>;
  failed?: Array<{ email: string; reason: string }>;
};

const InviteModal = ({
  opened,
  onClose,
  eventId,
  currentUserRole,
  onSuccess,
}: InviteModalProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeTab, setActiveTab] = useState<string | null>('single');
  const [bulkEmails, setBulkEmails] = useState('');
  const [sendInvitation, { isLoading: isSending }] = useSendEventInvitationMutation();
  const [sendBulkInvitations, { isLoading: isSendingBulk }] = useSendBulkEventInvitationsMutation();

  // Single invitation form
  const singleForm = useForm<InvitationFormData>({
    validate: zodResolver(invitationSchema),
    initialValues: {
      email: '',
      role: 'ATTENDEE',
      message: '',
    },
  });

  // Bulk invitation form
  const bulkForm = useForm<BulkFormValues>({
    initialValues: {
      role: 'ATTENDEE',
      message: '',
    },
  });

  const handleSingleSubmit = async (values: InvitationFormData) => {
    if (!eventId) return;

    try {
      const params: { eventId: number; email: string; role: EventUserRole; message?: string } = {
        eventId,
        email: values.email,
        role: values.role as EventUserRole,
      };
      if (values.message) {
        params.message = values.message;
      }
      await sendInvitation(params).unwrap();

      notifications.show({
        title: 'Success',
        message: `Invitation sent to ${values.email}`,
        color: 'green',
      });

      singleForm.reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      const apiError = error as { data?: { message?: string } };
      if (apiError.data?.message) {
        singleForm.setFieldError('email', apiError.data.message);
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to send invitation',
          color: 'red',
        });
      }
    }
  };

  const handleBulkSubmit = async () => {
    if (!eventId) return;

    // Parse emails from textarea
    const emailList = bulkEmails
      .split(/[\n,;]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emailList.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Please enter at least one email address',
        color: 'red',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter((email) => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      notifications.show({
        title: 'Invalid Emails',
        message: `Invalid email format: ${invalidEmails.slice(0, 3).join(', ')}${invalidEmails.length > 3 ? '...' : ''}`,
        color: 'red',
      });
      return;
    }

    try {
      const invitations = emailList.map((email) => ({
        email,
        role: bulkForm.values.role as EventUserRole,
        ...(bulkForm.values.message && { message: bulkForm.values.message }),
      }));

      const result = (await sendBulkInvitations({
        eventId,
        invitations,
      }).unwrap()) as unknown as BulkInvitationsResult;

      const successCount = result.successful?.length || 0;
      const failedCount = result.failed?.length || 0;

      if (successCount > 0) {
        notifications.show({
          title: 'Invitations Sent',
          message: `Successfully sent ${successCount} invitation${successCount !== 1 ? 's' : ''}`,
          color: 'green',
        });
      }

      if (failedCount > 0) {
        notifications.show({
          title: 'Some Invitations Failed',
          message: `${failedCount} invitation${failedCount !== 1 ? 's' : ''} failed. Check the details.`,
          color: 'yellow',
        });

        // Show failed emails
        console.error('Failed invitations:', result.failed);
      }

      if (successCount > 0) {
        setBulkEmails('');
        bulkForm.reset();
        onClose();
        onSuccess?.();
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to send invitations',
        color: 'red',
      });
    }
  };

  const handleClose = () => {
    singleForm.reset();
    bulkForm.reset();
    setBulkEmails('');
    setActiveTab('single');
    onClose();
  };

  // Filter role options based on current user's role
  const roleOptions = (() => {
    const allRoles: Array<{ value: EventUserRoleType; label: string }> = [
      { value: 'ATTENDEE', label: getRoleDisplayName('ATTENDEE') },
      { value: 'SPEAKER', label: getRoleDisplayName('SPEAKER') },
      { value: 'ORGANIZER', label: getRoleDisplayName('ORGANIZER') },
      { value: 'ADMIN', label: getRoleDisplayName('ADMIN') },
    ];

    if (currentUserRole === 'ORGANIZER') {
      // Organizers can only invite ATTENDEE and SPEAKER
      return allRoles.filter((role) => ['ATTENDEE', 'SPEAKER'].includes(role.value));
    }

    // Admins can invite any role
    return allRoles;
  })();

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title='Invite Attendees'
      size='lg'
      lockScroll={false}
      classNames={{
        content: styles.modalContent ?? '',
        header: styles.modalHeader ?? '',
      }}
    >
      {!isMobile ?
        <Tabs value={activeTab} onChange={setActiveTab} className={cn(styles.tabsContainer)}>
          <Tabs.List className={cn(styles.tabsList)}>
            <Tabs.Tab
              value='single'
              leftSection={<IconUserPlus size={16} />}
              className={cn(styles.tab)}
            >
              Single Invitation
            </Tabs.Tab>
            <Tabs.Tab value='bulk' leftSection={<IconUsers size={16} />} className={cn(styles.tab)}>
              Bulk Invitations
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value='single' className={cn(styles.tabPanel)}>
            <form onSubmit={singleForm.onSubmit(handleSingleSubmit)}>
              <Stack gap='md'>
                <TextInput
                  label='Email Address'
                  placeholder='attendee@example.com'
                  required
                  className={cn(styles.formInput)}
                  {...singleForm.getInputProps('email')}
                />

                <Select
                  label='Role'
                  data={roleOptions}
                  required
                  className={cn(styles.formSelect)}
                  {...singleForm.getInputProps('role')}
                />

                <Textarea
                  label='Personal Message'
                  placeholder='Add a personal message to the invitation (optional)'
                  rows={3}
                  className={cn(styles.formTextarea)}
                  {...singleForm.getInputProps('message')}
                />

                <Alert icon={<IconAlertCircle size={16} />} className={cn(styles.infoAlert)}>
                  <Text size='sm'>
                    {
                      "The recipient will receive an email invitation to join your event. If they don't have an account, they'll be prompted to create one."
                    }
                  </Text>
                </Alert>
              </Stack>
              <div className={cn(styles.buttonGroup)}>
                <Button variant='secondary' onClick={handleClose}>
                  Cancel
                </Button>
                <Button type='submit' variant='primary' disabled={isSending}>
                  {isSending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value='bulk' className={cn(styles.tabPanel)}>
            <Stack gap='md'>
              <Textarea
                label='Email Addresses'
                placeholder='Enter email addresses separated by commas, semicolons, or new lines'
                description='Example: john@example.com, jane@example.com'
                rows={6}
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                required
                className={cn(styles.formTextarea)}
              />

              <Select
                label='Default Role'
                description='All invitees will be assigned this role'
                data={roleOptions}
                required
                className={cn(styles.formSelect)}
                {...bulkForm.getInputProps('role')}
              />

              <Textarea
                label='Personal Message'
                placeholder='Add a personal message to all invitations (optional)'
                rows={3}
                className={cn(styles.formTextarea)}
                {...bulkForm.getInputProps('message')}
              />

              <Alert icon={<IconAlertCircle size={16} />} className={cn(styles.infoAlert)}>
                <Text size='sm'>
                  You can invite up to 100 people at once. Each person will receive an individual
                  invitation email.
                </Text>
              </Alert>
            </Stack>
            <div className={cn(styles.buttonGroup)}>
              <Button variant='secondary' onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleBulkSubmit} variant='primary' disabled={isSendingBulk}>
                {isSendingBulk ? 'Sending...' : 'Send Invitations'}
              </Button>
            </div>
          </Tabs.Panel>
        </Tabs>
      : /* Mobile: Only show single invitation form without tabs */
        <form onSubmit={singleForm.onSubmit(handleSingleSubmit)}>
          <Stack gap='md'>
            <TextInput
              label='Email Address'
              placeholder='attendee@example.com'
              required
              className={cn(styles.formInput)}
              {...singleForm.getInputProps('email')}
            />

            <Select
              label='Role'
              data={roleOptions}
              required
              className={cn(styles.formSelect)}
              {...singleForm.getInputProps('role')}
            />

            <Textarea
              label='Personal Message'
              placeholder='Add a personal message to the invitation (optional)'
              rows={3}
              className={cn(styles.formTextarea)}
              {...singleForm.getInputProps('message')}
            />

            <div className={cn(styles.buttonGroup)}>
              <Button variant='secondary' onClick={handleClose}>
                Cancel
              </Button>
              <Button type='submit' variant='primary' loading={isSending}>
                Send Invitation
              </Button>
            </div>
          </Stack>
        </form>
      }
    </Modal>
  );
};

export default InviteModal;
