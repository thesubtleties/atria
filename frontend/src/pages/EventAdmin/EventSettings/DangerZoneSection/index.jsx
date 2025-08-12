import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Stack, Text, TextInput, Alert } from '@mantine/core';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { Button } from '@/shared/components/buttons';
import { useDeleteEventMutation } from '@/app/features/events/api';
import { useGetOrganizationQuery } from '@/app/features/organizations/api';
import DeleteEventModal from './DeleteEventModal';
import styles from './styles.module.css';

const DangerZoneSection = ({ event }) => {
  const [deleteText, setDeleteText] = useState('');
  const [modalOpened, setModalOpened] = useState(false);
  const currentUserId = useSelector((state) => state.auth.user?.id);
  
  // Fetch organization data to check user role
  const { data: organization } = useGetOrganizationQuery(
    event?.organization_id, 
    { skip: !event?.organization_id }
  );
  
  // Check if current user is org owner
  const isOrgOwner = organization?.users?.some(
    (user) => user.id === currentUserId && user.role === 'OWNER'
  );

  // Only render if user is org owner
  if (!isOrgOwner) return null;

  const isDeleteEnabled = deleteText === 'DELETE';

  return (
    <div className={styles.dangerZone} role="region" aria-labelledby="danger-zone-title">
      <div className={styles.warningSection} role="alert">
        <div className={styles.warningHeader}>
          <IconAlertTriangle size={20} className={styles.warningIcon} aria-hidden="true" />
          <h3 id="danger-zone-title" className={styles.sectionTitle}>Danger Zone</h3>
        </div>
        <Text className={styles.warningText}>
          Once you delete an event, there is no going back. This will permanently 
          delete the event, all attendees, sessions, chat history, and associated data.
        </Text>
      </div>

      <div className={styles.deleteSection}>
        <Stack gap="md">
          <Text 
            size="sm" 
            fw={600} 
            className={styles.deleteLabel}
            id="delete-confirmation-label"
          >
            Type <code className={styles.deleteCode}>DELETE</code> to confirm deletion:
          </Text>
          
          <TextInput
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder="Type DELETE to enable the delete button"
            className={styles.deleteInput}
            aria-labelledby="delete-confirmation-label"
            aria-describedby="delete-warning"
            data-autofocus
          />

          <Button
            variant="danger"
            leftIcon={<IconTrash size={16} />}
            onClick={() => setModalOpened(true)}
            disabled={!isDeleteEnabled}
            className={styles.deleteButton}
          >
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