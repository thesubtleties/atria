import { useState } from 'react';
import {
  Modal,
  TextInput,
  Select,
  Textarea,
  Button,
  Group,
  Stack,
  Tabs,
  Text,
  Alert,
  Checkbox,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconAlertCircle, IconUsers, IconUserPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { invitationSchema, bulkInvitationSchema, getRoleDisplayName } from '../schemas/attendeeSchemas';
import {
  useSendEventInvitationMutation,
  useSendBulkEventInvitationsMutation,
} from '../../../../app/features/eventInvitations/api';

const InviteModal = ({ opened, onClose, eventId, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('single');
  const [bulkEmails, setBulkEmails] = useState('');
  const [sendInvitation, { isLoading: isSending }] = useSendEventInvitationMutation();
  const [sendBulkInvitations, { isLoading: isSendingBulk }] = useSendBulkEventInvitationsMutation();

  // Single invitation form
  const singleForm = useForm({
    resolver: zodResolver(invitationSchema),
    initialValues: {
      email: '',
      role: 'ATTENDEE',
      message: '',
    },
  });

  // Bulk invitation form
  const bulkForm = useForm({
    initialValues: {
      role: 'ATTENDEE',
      message: '',
    },
  });

  const handleSingleSubmit = async (values) => {
    try {
      await sendInvitation({
        eventId,
        ...values,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: `Invitation sent to ${values.email}`,
        color: 'green',
      });

      singleForm.reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      if (error.data?.message) {
        singleForm.setFieldError('email', error.data.message);
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
        role: bulkForm.values.role,
        message: bulkForm.values.message || undefined,
      }));

      const result = await sendBulkInvitations({
        eventId,
        invitations,
      }).unwrap();

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
    } catch (error) {
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

  const roleOptions = [
    { value: 'ATTENDEE', label: getRoleDisplayName('ATTENDEE') },
    { value: 'SPEAKER', label: getRoleDisplayName('SPEAKER') },
    { value: 'ORGANIZER', label: getRoleDisplayName('ORGANIZER') },
    { value: 'ADMIN', label: getRoleDisplayName('ADMIN') },
  ];

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Invite Attendees"
      size="lg"
    >
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="single" leftSection={<IconUserPlus size={16} />}>
            Single Invitation
          </Tabs.Tab>
          <Tabs.Tab value="bulk" leftSection={<IconUsers size={16} />}>
            Bulk Invitations
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="single" pt="xl">
          <form onSubmit={singleForm.onSubmit(handleSingleSubmit)}>
            <Stack>
              <TextInput
                label="Email Address"
                placeholder="attendee@example.com"
                required
                {...singleForm.getInputProps('email')}
              />

              <Select
                label="Role"
                data={roleOptions}
                required
                {...singleForm.getInputProps('role')}
              />

              <Textarea
                label="Personal Message"
                placeholder="Add a personal message to the invitation (optional)"
                rows={3}
                {...singleForm.getInputProps('message')}
              />

              <Alert icon={<IconAlertCircle size={16} />} color="blue">
                <Text size="sm">
                  The recipient will receive an email invitation to join your event.
                  If they don't have an account, they'll be prompted to create one.
                </Text>
              </Alert>

              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSending}>
                  Send Invitation
                </Button>
              </Group>
            </Stack>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="bulk" pt="xl">
          <Stack>
            <Textarea
              label="Email Addresses"
              placeholder="Enter email addresses separated by commas, semicolons, or new lines"
              description="Example: john@example.com, jane@example.com"
              rows={6}
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              required
            />

            <Select
              label="Default Role"
              description="All invitees will be assigned this role"
              data={roleOptions}
              required
              {...bulkForm.getInputProps('role')}
            />

            <Textarea
              label="Personal Message"
              placeholder="Add a personal message to all invitations (optional)"
              rows={3}
              {...bulkForm.getInputProps('message')}
            />

            <Alert icon={<IconAlertCircle size={16} />} color="blue">
              <Text size="sm">
                You can invite up to 100 people at once. Each person will receive
                an individual invitation email.
              </Text>
            </Alert>

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleBulkSubmit} loading={isSendingBulk}>
                Send Invitations
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
};

export default InviteModal;