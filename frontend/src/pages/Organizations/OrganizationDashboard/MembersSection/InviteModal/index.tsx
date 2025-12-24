import { useState, type ChangeEvent } from 'react';
import { Modal, TextInput, Select, Textarea, Stack, Tabs, Text, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconUsers, IconUserPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useSendOrganizationInvitationMutation,
  useBulkSendOrganizationInvitationsMutation,
} from '@/app/features/organizations/api';
import { Button } from '@/shared/components/buttons';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { ApiError, OrganizationUserRole } from '@/types';

type InviteModalProps = {
  opened: boolean;
  onClose: () => void;
  orgId?: string | undefined;
  onSuccess?: () => void;
};

type SingleFormValues = {
  email: string;
  role: string;
  message: string;
};

type BulkFormValues = {
  role: string;
  message: string;
};

type BulkInvitationResult = {
  successful?: Array<{ email: string }>;
  failed?: Array<{ email: string; error: string }>;
};

const InviteModal = ({ opened, onClose, orgId, onSuccess }: InviteModalProps) => {
  const [activeTab, setActiveTab] = useState<string | null>('single');
  const [bulkEmails, setBulkEmails] = useState('');
  const [sendInvitation, { isLoading: isSending }] = useSendOrganizationInvitationMutation();
  const [sendBulkInvitations, { isLoading: isSendingBulk }] =
    useBulkSendOrganizationInvitationsMutation();

  const singleForm = useForm<SingleFormValues>({
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

  const bulkForm = useForm<BulkFormValues>({
    initialValues: {
      role: 'MEMBER',
      message: '',
    },
  });

  const handleSingleSubmit = async (values: SingleFormValues) => {
    try {
      await sendInvitation({
        orgId: orgId ? parseInt(orgId) : 0,
        email: values.email,
        role: values.role as OrganizationUserRole,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: `Invitation sent to ${values.email}`,
        color: 'green',
      });

      singleForm.reset();
      onClose();
      onSuccess?.();
    } catch (err) {
      const error = err as ApiError;
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
        role: bulkForm.values.role as OrganizationUserRole,
      }));

      const result = (await sendBulkInvitations({
        orgId: orgId ? parseInt(orgId) : 0,
        invitations,
      }).unwrap()) as unknown as BulkInvitationResult;

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
      title='Invite Organization Members'
      size='lg'
      lockScroll={false}
      classNames={{
        content: cn(styles.modalContent),
        header: cn(styles.modalHeader),
      }}
    >
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
                placeholder='member@example.com'
                required
                className={cn(styles.formInput)}
                {...singleForm.getInputProps('email')}
              />

              <Select
                label='Role'
                data={roleOptions}
                required
                className={cn(styles.formSelect)}
                description='Choose the level of access for this member'
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
                    "The recipient will receive an email invitation to join your organization. If they don't have an account, they'll be prompted to create one."
                  }
                </Text>
              </Alert>

              <Text size='xs' c='dimmed'>
                <strong>Role Permissions:</strong>
                <br />• <strong>Member:</strong> Can view organization content and create events
                <br />• <strong>Admin:</strong> Can manage members and organization settings
                <br />• <strong>Owner:</strong> Full control including billing and deletion
              </Text>
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
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBulkEmails(e.target.value)}
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
    </Modal>
  );
};

export default InviteModal;
