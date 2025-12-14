import { Checkbox, Group, Text, Badge, Avatar, Tooltip } from '@mantine/core';
import { IconBuilding, IconCalendarEvent, IconAlertCircle, IconStar } from '@tabler/icons-react';
import styles from '../styles/InvitationItem.module.css';

const InvitationItem = ({
  invitation,
  type,
  isSelected,
  onSelectionChange,
  isPrimary,
  showRoleWarning,
}) => {
  const isOrganization = type === 'organization';
  const entity = isOrganization ? invitation.organization : invitation.event;
  const Icon = isOrganization ? IconBuilding : IconCalendarEvent;

  const getRoleBadgeColor = (role) => {
    const roleColors = {
      OWNER: 'red',
      ADMIN: 'orange',
      ORGANIZER: 'yellow',
      MEMBER: 'blue',
      SPEAKER: 'grape',
      ATTENDEE: 'green',
    };
    return roleColors[role] || 'gray';
  };

  const formatRole = (role) => {
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  const isExpiringSoon = () => {
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();
    const daysUntilExpiry = (expiresAt - now) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 2;
  };

  return (
    <div className={`${styles.invitationItem} ${isPrimary ? styles.primary : ''}`}>
      <Group justify='space-between' align='flex-start'>
        <Group align='flex-start' gap='md' style={{ flex: 1 }}>
          <Checkbox
            checked={isSelected}
            onChange={(e) => onSelectionChange(e.currentTarget.checked)}
            size='md'
            className={styles.checkbox}
          />

          <div className={styles.content}>
            <Group gap='xs' mb='xs'>
              <Icon size={20} className={styles.icon} />
              <Text fw={600} size='md' className={styles.entityName}>
                {entity?.name || entity?.title}
              </Text>
              {isPrimary && (
                <Tooltip label='This is the invitation you clicked on'>
                  <IconStar size={16} className={styles.primaryIcon} />
                </Tooltip>
              )}
            </Group>

            {!isOrganization && invitation.event.organization && (
              <Text size='sm' c='dimmed' mb='xs' className={styles.orgName}>
                {invitation.event.organization.name}
              </Text>
            )}

            <Group gap='xs' mb='xs'>
              <Badge
                color={getRoleBadgeColor(invitation.role)}
                size='md'
                radius='sm'
                variant='light'
                className={styles.roleBadge}
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
                    className={styles.warningBadge}
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
                  className={styles.expiringBadge}
                >
                  Expires soon
                </Badge>
              )}
            </Group>

            {invitation.invited_by && (
              <Group gap={4}>
                <Text size='xs' c='dimmed' className={styles.invitedByText}>
                  Invited by
                </Text>
                <Avatar size={16} radius='xl' className={styles.inviterAvatar}>
                  {invitation.invited_by.name?.charAt(0)}
                </Avatar>
                <Text size='xs' c='dimmed' className={styles.inviterName}>
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
