import { useState } from 'react';
import { Avatar, Text, Badge, Menu, ActionIcon } from '@mantine/core';
import { IconDots, IconUserEdit, IconUserX, IconMail } from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import styles from './styles/index.module.css';

const MemberCard = ({ member, orgId, currentUserRole, onRoleUpdate, onRemove }) => {
  const canManage = currentUserRole === 'OWNER' || 
    (currentUserRole === 'ADMIN' && member.role !== 'OWNER');
  const isCurrentUser = member.is_current_user;

  const getInitials = (name) => {
    if (!name) return '?';
    
    // Handle email addresses
    if (name.includes('@')) {
      return name[0].toUpperCase();
    }
    
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={styles.card}>
      {/* Actions Menu - Top right corner */}
      {canManage && !isCurrentUser && (
        <div className={styles.cardActions}>
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" className={styles.actionButton}>
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconUserEdit size={14} />}
                onClick={() => onRoleUpdate?.(member)}
              >
                Change Role
              </Menu.Item>
              <Menu.Item
                leftSection={<IconUserX size={14} />}
                color="red"
                onClick={() => onRemove?.(member)}
              >
                Remove Member
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      )}

      {/* User Info Section */}
      <div className={styles.userInfo}>
        <Avatar
          src={member.image_url}
          alt={member.user_name}
          radius="xl"
          size={50}
          className={styles.avatar}
        >
          {getInitials(member.user_name)}
        </Avatar>
        <div className={styles.userDetails}>
          <Text 
            fw={600} 
            className={styles.userName}
          >
            {member.user_name || 'Unnamed User'}
            {isCurrentUser && (
              <Text component="span" size="xs" c="dimmed"> (You)</Text>
            )}
          </Text>
          {member.email && (
            <Text size="sm" className={styles.userEmail}>
              <a href={`mailto:${member.email}`} className={styles.emailLink}>
                <IconMail size={14} className={styles.emailIcon} />
                {member.email}
              </a>
            </Text>
          )}
        </div>
      </div>

      {/* Member info - Role badge and join date on same line */}
      <div className={styles.memberInfo}>
        <Badge
          variant="light"
          size="sm"
          radius="sm"
          className={styles.roleBadge}
          data-role={member.role}
        >
          {member.role}
        </Badge>
        <Text size="xs" className={styles.joinDate}>
          Joined {member.created_at 
            ? formatDistanceToNow(new Date(member.created_at), { addSuffix: true })
            : 'unknown time'
          }
        </Text>
      </div>
    </div>
  );
};

export default MemberCard;