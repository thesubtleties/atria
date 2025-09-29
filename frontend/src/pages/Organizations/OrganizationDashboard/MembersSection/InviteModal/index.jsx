import { useState } from 'react';
import {
  Modal,
  TextInput,
  Select,
  Textarea,
  Stack,
  Tabs,
  Text,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconUsers, IconUserPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useSendOrganizationInvitationMutation,
  useBulkSendOrganizationInvitationsMutation,
} from '../../../../../app/features/organizations/api';
import { Button } from '../../../../../shared/components/buttons';
import styles from './styles/index.module.css';

const InviteModal = ({ opened, onClose, orgId, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('single');
  const [bulkEmails, setBulkEmails] = useState('');
  const [sendInvitation, { isLoading: isSending }] = useSendOrganizationInvitationMutation();
  const [sendBulkInvitations, { isLoading: isSendingBulk }] = useBulkSendOrganizationInvitationsMutation();

  // Single invitation form
  const singleForm = useForm({
    initialValues: {
      email: '',
      role: 'MEMBER',
      message: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        return null;
      },
    },
  });

  // Bulk invitation form
  const bulkForm = useForm({
    initialValues: {
      role: 'MEMBER',
      message: '',
    },
  });

  const handleSingleSubmit = async (values) => {
    try {
      await sendInvitation({
        orgId,
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
        orgId,
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

  const roleOptions = [
    { value: 'MEMBER', label: 'Member' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'OWNER', label: 'Owner' },
  ];

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Invite Organization Members"
      size="lg"
      lockScroll={false}
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
      }}
    >
      <Tabs value={activeTab} onChange={setActiveTab} className={styles.tabsContainer}>
        <Tabs.List className={styles.tabsList}>
          <Tabs.Tab 
            value="single" 
            leftSection={<IconUserPlus size={16} />}
            className={styles.tab}
          >
            Single Invitation
          </Tabs.Tab>
          <Tabs.Tab 
            value="bulk" 
            leftSection={<IconUsers size={16} />}
            className={styles.tab}
          >
            Bulk Invitations
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="single" className={styles.tabPanel}>
          <form onSubmit={singleForm.onSubmit(handleSingleSubmit)}>
            <Stack spacing="md">
              <TextInput
                label="Email Address"
                placeholder="member@example.com"
                required
                className={styles.formInput}
                {...singleForm.getInputProps('email')}
              />

              <Select
                label="Role"
                data={roleOptions}
                required
                className={styles.formSelect}
                description="Choose the level of access for this member"
                {...singleForm.getInputProps('role')}
              />

              <Textarea
                label="Personal Message"
                placeholder="Add a personal message to the invitation (optional)"
                rows={3}
                className={styles.formTextarea}
                {...singleForm.getInputProps('message')}
              />

              <Alert icon={<IconAlertCircle size={16} />} className={styles.infoAlert}>
                <Text size="sm">
                  {"The recipient will receive an email invitation to join your organization. If they don't have an account, they'll be prompted to create one."}
                </Text>
              </Alert>

              <Text size="xs" color="dimmed">
                <strong>Role Permissions:</strong><br />
                • <strong>Member:</strong> Can view organization content and create events<br />
                • <strong>Admin:</strong> Can manage members and organization settings<br />
                • <strong>Owner:</strong> Full control including billing and deletion
              </Text>

            </Stack>
            <div className={styles.buttonGroup}>
              <Button variant="subtle" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSending}>
                {isSending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="bulk" className={styles.tabPanel}>
          <Stack spacing="md">
            <Textarea
              label="Email Addresses"
              placeholder="Enter email addresses separated by commas, semicolons, or new lines"
              description="Example: john@example.com, jane@example.com"
              rows={6}
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              required
              className={styles.formTextarea}
            />

            <Select
              label="Default Role"
              description="All invitees will be assigned this role"
              data={roleOptions}
              required
              className={styles.formSelect}
              {...bulkForm.getInputProps('role')}
            />

            <Textarea
              label="Personal Message"
              placeholder="Add a personal message to all invitations (optional)"
              rows={3}
              className={styles.formTextarea}
              {...bulkForm.getInputProps('message')}
            />

            <Alert icon={<IconAlertCircle size={16} />} className={styles.infoAlert}>
              <Text size="sm">
                You can invite up to 100 people at once. Each person will receive
                an individual invitation email.
              </Text>
            </Alert>

          </Stack>
          <div className={styles.buttonGroup}>
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleBulkSubmit} variant="primary" disabled={isSendingBulk}>
              {isSendingBulk ? 'Sending...' : 'Send Invitations'}
            </Button>
          </div>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
};

export default InviteModal;