import { Table, Group, Text, Badge, Avatar, Menu, ActionIcon } from '@mantine/core';
import {
  IconDots,
  IconUserCircle,
  IconEdit,
  IconTrash,
  IconMessage,
  IconMicrophone,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { getRoleBadgeColor, getRoleDisplayName, canChangeRole } from '../schemas/attendeeSchemas';
import { useRemoveEventUserMutation } from '../../../../app/features/events/api';
import styles from './styles.module.css';

const AttendeeRow = ({
  attendee,
  onUpdateRole,
  currentUserRole,
}) => {
  const navigate = useNavigate();
  const [removeUser] = useRemoveEventUserMutation();

  const handleRemove = async () => {
    if (!window.confirm(`Remove ${attendee.full_name} from the event?`)) {
      return;
    }

    try {
      await removeUser({
        eventId: attendee.event_id,
        userId: attendee.user_id,
      }).unwrap();
      
      notifications.show({
        title: 'Success',
        message: `${attendee.full_name} removed from event`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to remove user',
        color: 'red',
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const canManageUser = canChangeRole(currentUserRole, attendee.role);

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="sm">
          <Avatar
            src={attendee.image_url}
            alt={attendee.full_name}
            radius="xl"
            size="md"
          >
            {attendee.first_name?.[0]}{attendee.last_name?.[0]}
          </Avatar>
          <div>
            <Text size="sm" fw={500}>
              {attendee.full_name}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {attendee.email}
        </Text>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Badge
          size="md"
          radius="sm"
          color={getRoleBadgeColor(attendee.role)}
          variant="light"
          className={styles.roleBadge}
        >
          {getRoleDisplayName(attendee.role)}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{attendee.company_name || '-'}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{attendee.title || '-'}</Text>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Text size="sm" c="dimmed">
          {formatDate(attendee.created_at)}
        </Text>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Menu 
          shadow="md" 
          width={200} 
          position="bottom-end"
        >
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" className={styles.actionIcon}>
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown className={styles.menuDropdown}>
            <Menu.Item
              className={styles.menuItem}
              leftSection={<IconUserCircle size={16} />}
              onClick={() => navigate(`/app/users/${attendee.user_id}`)}
            >
              View Profile
            </Menu.Item>
            
            {canManageUser && (
              <>
                <Menu.Item
                  className={styles.menuItem}
                  leftSection={<IconEdit size={16} />}
                  onClick={() => onUpdateRole(attendee)}
                >
                  Change Role
                </Menu.Item>
                
                {attendee.role === 'SPEAKER' && (
                  <Menu.Item
                    className={styles.menuItem}
                    leftSection={<IconMicrophone size={16} />}
                    onClick={() => navigate(`/app/events/${attendee.event_id}/admin/speakers`)}
                  >
                    Manage Speaker Info
                  </Menu.Item>
                )}
                
                <Menu.Divider />
                
                <Menu.Item
                  className={styles.menuItemDanger}
                  leftSection={<IconTrash size={16} />}
                  onClick={handleRemove}
                >
                  Remove from Event
                </Menu.Item>
              </>
            )}
            
            <Menu.Item
              className={styles.menuItem}
              leftSection={<IconMessage size={16} />}
              onClick={() => {
                // TODO: Implement direct message
                notifications.show({
                  title: 'Coming Soon',
                  message: 'Direct messaging will be available soon',
                  color: 'blue',
                });
              }}
            >
              Send Message
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  );
};

export default AttendeeRow;