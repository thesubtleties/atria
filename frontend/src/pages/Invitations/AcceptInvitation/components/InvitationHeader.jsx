import { Title, Text, Avatar, Group, Badge } from '@mantine/core';
import { IconBuilding, IconCalendarEvent } from '@tabler/icons-react';
import styles from '../styles/InvitationHeader.module.css';

const InvitationHeader = ({ invitation }) => {
  const isOrganization = invitation.type === 'organization';
  const entity = isOrganization ? invitation.organization : invitation.event;
  const Icon = isOrganization ? IconBuilding : IconCalendarEvent;
  
  const getRoleBadgeColor = (role) => {
    const roleColors = {
      'OWNER': 'red',
      'ADMIN': 'orange',
      'ORGANIZER': 'yellow',
      'MEMBER': 'blue',
      'SPEAKER': 'grape',
      'ATTENDEE': 'green'
    };
    return roleColors[role] || 'gray';
  };

  const formatRole = (role) => {
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  return (
    <div className={styles.header}>
      <div className={styles.iconContainer}>
        <Icon size={48} className={styles.icon} />
      </div>
      
      <Title order={2} className={styles.title}>
        You've been invited!
      </Title>
      
      <Text size="lg" className={styles.subtitle}>
        {invitation.invited_by?.name || 'Someone'} has invited you to join
      </Text>
      
      <Group justify="center" mt="md">
        <Text fw={600} size="xl" className={styles.entityName}>
          {entity?.name || entity?.title}
        </Text>
        <Badge 
          color={getRoleBadgeColor(invitation.role)} 
          size="md" 
          radius="sm"
          variant="light"
          className={styles.roleBadge}
        >
          as {formatRole(invitation.role)}
        </Badge>
      </Group>
      
      {invitation.message && (
        <div className={styles.messageBox}>
          <Text size="sm" c="dimmed" mb="xs" className={styles.messageLabel}>Personal message:</Text>
          <Text className={styles.messageText}>{invitation.message}</Text>
        </div>
      )}
      
      {invitation.invited_by && (
        <Group justify="center" mt="xl" gap="xs">
          <Avatar size="sm" radius="xl" className={styles.avatar}>
            {invitation.invited_by.name?.charAt(0)}
          </Avatar>
          <Text size="sm" c="dimmed" className={styles.inviterText}>
            Invited by {invitation.invited_by.name}
          </Text>
        </Group>
      )}
    </div>
  );
};

export default InvitationHeader;