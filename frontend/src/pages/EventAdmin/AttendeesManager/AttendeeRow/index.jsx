import { Table, Checkbox, Group, Text, Badge, Avatar, Menu, ActionIcon } from '@mantine/core';
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
  isSelected,
  onSelect,
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
        <Checkbox
          checked={isSelected}
          onChange={(e) => onSelect(e.currentTarget.checked)}
        />
      </Table.Td>
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
      <Table.Td>
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
      <Table.Td>
        <Text size="sm" c="dimmed">
          {formatDate(attendee.created_at)}
        </Text>
      </Table.Td>
      <Table.Td>
        <Menu 
          shadow="md" 
          width={200} 
          position="bottom-end"
        >
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconUserCircle size={16} />}
              onClick={() => navigate(`/app/users/${attendee.user_id}`)}
            >
              View Profile
            </Menu.Item>
            
            {canManageUser && (
              <>
                <Menu.Item
                  leftSection={<IconEdit size={16} />}
                  onClick={() => onUpdateRole(attendee)}
                >
                  Change Role
                </Menu.Item>
                
                {attendee.role === 'SPEAKER' && (
                  <Menu.Item
                    leftSection={<IconMicrophone size={16} />}
                    onClick={() => navigate(`/app/events/${attendee.event_id}/admin/speakers`)}
                  >
                    Manage Speaker Info
                  </Menu.Item>
                )}
                
                <Menu.Divider />
                
                <Menu.Item
                  leftSection={<IconTrash size={16} />}
                  color="red"
                  onClick={handleRemove}
                >
                  Remove from Event
                </Menu.Item>
              </>
            )}
            
            <Menu.Item
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