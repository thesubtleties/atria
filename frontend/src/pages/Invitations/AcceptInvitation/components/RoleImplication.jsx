import { Alert, Text, List } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import styles from '../styles/RoleImplication.module.css';

const RoleImplication = () => {
  return (
    <Alert 
      icon={<IconAlertCircle size={16} />} 
      title="Important: Role Dependencies" 
      color="yellow"
      className={styles.alert}
      mb="xl"
    >
      <Text size="sm" mb="sm">
        Some of your event invitations include administrative roles that require organization membership:
      </Text>
      <List size="sm" spacing="xs">
        <List.Item>
          <strong>Event Admin</strong> and <strong>Event Organizer</strong> roles require you to be a member of the organization
        </List.Item>
        <List.Item>
          If you decline the organization invitation but accept the event invitation, your role will be automatically adjusted to <strong>Attendee</strong>
        </List.Item>
        <List.Item>
          You can request a role upgrade later through the event administrators
        </List.Item>
      </List>
    </Alert>
  );
};

export default RoleImplication;