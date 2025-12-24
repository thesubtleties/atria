import { Checkbox, Group, Text, Badge, Avatar, Tooltip } from '@mantine/core';
import { IconBuilding, IconCalendarEvent, IconAlertCircle, IconStar } from '@tabler/icons-react';
import type { OrganizationInvitationDetail, EventInvitationDetail } from '../index';
import { cn } from '@/lib/cn';
import styles from '../styles/InvitationItem.module.css';

type InvitationItemProps = {
  invitation: OrganizationInvitationDetail | EventInvitationDetail;
  type: 'organization' | 'event';
  isSelected: boolean;
  onSelectionChange: (isSelected: boolean) => void;
  isPrimary?: boolean;
  showRoleWarning?: boolean;
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

const InvitationItem = ({
  invitation,
  type,
  isSelected,
  onSelectionChange,
  isPrimary,
  showRoleWarning,
}: InvitationItemProps) => {
  const isOrganization = type === 'organization';
  const entity =
    isOrganization ?
      (invitation as OrganizationInvitationDetail).organization
    : (invitation as EventInvitationDetail).event;
  const Icon = isOrganization ? IconBuilding : IconCalendarEvent;

  const isExpiringSoon = (): boolean => {
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();
    const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 2;
  };

  return (
    <div className={cn(styles.invitationItem, isPrimary && styles.primary)}>
      <Group justify='space-between' align='flex-start'>
        <Group align='flex-start' gap='md' style={{ flex: 1 }}>
          <Checkbox
            checked={isSelected}
            onChange={(e) => onSelectionChange(e.currentTarget.checked)}
            size='md'
            className={cn(styles.checkbox)}
          />

          <div className={cn(styles.content)}>
            <Group gap='xs' mb='xs'>
              <Icon size={20} className={cn(styles.icon)} />
              <Text fw={600} size='md' className={cn(styles.entityName)}>
                {(entity as { name?: string })?.name || (entity as { title?: string })?.title}
              </Text>
              {isPrimary && (
                <Tooltip label='This is the invitation you clicked on'>
                  <IconStar size={16} className={cn(styles.primaryIcon)} />
                </Tooltip>
              )}
            </Group>

            {!isOrganization && (invitation as EventInvitationDetail).event.organization && (
              <Text size='sm' c='dimmed' mb='xs' className={cn(styles.orgName)}>
                {(invitation as EventInvitationDetail).event.organization.name}
              </Text>
            )}

            <Group gap='xs' mb='xs'>
              <Badge
                color={getRoleBadgeColor(invitation.role)}
                size='md'
                radius='sm'
                variant='light'
                className={cn(styles.roleBadge)}
              >
                {formatRole(invitation.role)}
              </Badge>

              {showRoleWarning && (
                <Tooltip label='Will be downgraded to Attendee if organization invitation is not accepted'>
                  <Badge
                    color='yellow'
                    size='md'
                    radius='sm'
                    variant='light'
                    leftSection={<IconAlertCircle size={12} />}
                    className={cn(styles.warningBadge)}
                  >
                    Role requires org membership
                  </Badge>
                </Tooltip>
              )}

              {isExpiringSoon() && (
                <Badge
                  color='red'
                  size='md'
                  radius='sm'
                  variant='light'
                  className={cn(styles.expiringBadge)}
                >
                  Expires soon
                </Badge>
              )}
            </Group>

            {invitation.invited_by && (
              <Group gap={4}>
                <Text size='xs' c='dimmed' className={cn(styles.invitedByText)}>
                  Invited by
                </Text>
                <Avatar size={16} radius='xl' className={cn(styles.inviterAvatar)}>
                  {invitation.invited_by.name?.charAt(0)}
                </Avatar>
                <Text size='xs' c='dimmed' className={cn(styles.inviterName)}>
                  {invitation.invited_by.name}
                </Text>
              </Group>
            )}
          </div>
        </Group>
      </Group>
    </div>
  );
};

export default InvitationItem;
