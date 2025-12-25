import { Title, Text, Avatar, Group, Badge } from '@mantine/core';
import { IconBuilding, IconCalendarEvent } from '@tabler/icons-react';
import type { PrimaryInvitation } from '../index';
import { cn } from '@/lib/cn';
import styles from '../styles/InvitationHeader.module.css';

type InvitationHeaderProps = {
  invitation: PrimaryInvitation;
};

const getRoleBadgeColor = (role: string): string => {
  const roleColors: Record<string, string> = {
    OWNER: 'red',
    ADMIN: 'orange',
    ORGANIZER: 'yellow',
    MEMBER: 'blue',
    SPEAKER: 'grape',
    ATTENDEE: 'green',
  };
  return roleColors[role] || 'gray';
};

const formatRole = (role: string): string => {
  return role.charAt(0) + role.slice(1).toLowerCase();
};

const InvitationHeader = ({ invitation }: InvitationHeaderProps) => {
  const isOrganization = invitation.type === 'organization';
  const entity = isOrganization ? invitation.organization : invitation.event;
  const Icon = isOrganization ? IconBuilding : IconCalendarEvent;

  return (
    <div className={cn(styles.header)}>
      <div className={cn(styles.iconContainer)}>
        <Icon size={48} className={cn(styles.icon)} />
      </div>

      <Title order={2} className={cn(styles.title)}>
        {"You've been invited!"}
      </Title>

      <Text size='lg' className={cn(styles.subtitle)}>
        {invitation.invited_by?.name || 'Someone'} has invited you to join
      </Text>

      <Group justify='center' mt='md'>
        <Text fw={600} size='xl' className={cn(styles.entityName)}>
          {(entity as { name?: string })?.name || (entity as { title?: string })?.title}
        </Text>
        <Badge
          color={getRoleBadgeColor(invitation.role)}
          size='md'
          radius='sm'
          variant='light'
          className={cn(styles.roleBadge)}
        >
          as {formatRole(invitation.role)}
        </Badge>
      </Group>

      {invitation.message && (
        <div className={cn(styles.messageBox)}>
          <Text size='sm' c='dimmed' mb='xs' className={cn(styles.messageLabel)}>
            Personal message:
          </Text>
          <Text className={cn(styles.messageText)}>{invitation.message}</Text>
        </div>
      )}

      {invitation.invited_by && (
        <Group justify='center' mt='xl' gap='xs'>
          <Avatar size='sm' radius='xl' className={cn(styles.avatar)}>
            {invitation.invited_by.name?.charAt(0)}
          </Avatar>
          <Text size='sm' c='dimmed' className={cn(styles.inviterText)}>
            Invited by {invitation.invited_by.name}
          </Text>
        </Group>
      )}
    </div>
  );
};

export default InvitationHeader;
