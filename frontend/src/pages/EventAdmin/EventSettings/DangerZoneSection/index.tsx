import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Stack, Text, TextInput } from '@mantine/core';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { Button } from '@/shared/components/buttons';
import { useGetOrganizationQuery } from '@/app/features/organizations/api';
import { cn } from '@/lib/cn';
import type { RootState } from '@/app/store';
import type { Event } from '@/types';
import type { OrganizationUserNested } from '@/types/organizations';
import DeleteEventModal from './DeleteEventModal';
import styles from './styles.module.css';

type DangerZoneSectionProps = {
  event: Event | undefined;
};

const DangerZoneSection = ({ event }: DangerZoneSectionProps) => {
  const [deleteText, setDeleteText] = useState('');
  const [modalOpened, setModalOpened] = useState(false);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  // Fetch organization data to check user role
  const { data: organization } = useGetOrganizationQuery(event?.organization_id ?? 0, {
    skip: !event?.organization_id,
  });

  // Check if current user is org owner
  const isOrgOwner = (organization?.users as OrganizationUserNested[] | undefined)?.some(
    (user) => user.id === currentUserId && user.role === 'OWNER',
  );

  // Only render if user is org owner
  if (!isOrgOwner) return null;

  const isDeleteEnabled = deleteText === 'DELETE';

  return (
    <div className={cn(styles.dangerZone)} role='region' aria-labelledby='danger-zone-title'>
      <div className={cn(styles.warningSection)} role='alert'>
        <div className={cn(styles.warningHeader)}>
          <IconAlertTriangle size={20} className={cn(styles.warningIcon)} aria-hidden='true' />
          <h3 id='danger-zone-title' className={cn(styles.sectionTitle)}>
            Danger Zone
          </h3>
        </div>
        <Text className={cn(styles.warningText)}>
          Once you delete an event, there is no going back. This will permanently delete the event,
          all attendees, sessions, chat history, and associated data.
        </Text>
      </div>

      <div className={cn(styles.deleteSection)}>
        <Stack gap='md'>
          <Text
            size='sm'
            fw={600}
            className={cn(styles.deleteLabel)}
            id='delete-confirmation-label'
          >
            Type <code className={cn(styles.deleteCode)}>DELETE</code> to confirm deletion:
          </Text>

          <TextInput
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder='Type DELETE to enable the delete button'
            className={cn(styles.deleteInput)}
            aria-labelledby='delete-confirmation-label'
            aria-describedby='delete-warning'
            data-autofocus
          />

          <Button
            variant='danger'
            onClick={() => setModalOpened(true)}
            disabled={!isDeleteEnabled}
            className={cn(styles.deleteButton)}
          >
            <IconTrash size={16} />
            Delete Event Permanently
          </Button>
        </Stack>
      </div>

      <DeleteEventModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setDeleteText(''); // Reset the delete text when modal closes
        }}
        event={event}
        onSuccess={() => {
          // Navigation will be handled by the modal
        }}
      />
    </div>
  );
};

export default DangerZoneSection;
