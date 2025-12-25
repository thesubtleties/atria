import { Avatar, Text, Badge, Menu, ActionIcon } from '@mantine/core';
import { IconDots, IconUserEdit, IconUserX, IconMail } from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { OrganizationUserRole } from '@/types';

type Member = {
  user_id: number;
  user_name?: string;
  email?: string;
  image_url?: string;
  role: string;
  is_current_user?: boolean;
  created_at?: string;
};

type MemberCardProps = {
  member: Member;
  currentUserRole: OrganizationUserRole;
  onRoleUpdate?: (member: Member) => void;
  onRemove?: (member: Member) => void;
};

const MemberCard = ({ member, currentUserRole, onRoleUpdate, onRemove }: MemberCardProps) => {
  const canManage =
    currentUserRole === 'OWNER' || (currentUserRole === 'ADMIN' && member.role !== 'OWNER');
  const isCurrentUser = member.is_current_user;

  const getInitials = (name?: string): string => {
    if (!name) return '?';

    if (name.includes('@')) {
      return (name[0] ?? '?').toUpperCase();
    }

    return name
      .split(' ')
      .map((n) => n[0] ?? '')
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={cn(styles.card)}>
      {canManage && !isCurrentUser && (
        <div className={cn(styles.cardActions)}>
          <Menu position='bottom-end' withinPortal>
            <Menu.Target>
              <ActionIcon variant='subtle' className={cn(styles.actionButton)}>
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
                color='red'
                onClick={() => onRemove?.(member)}
              >
                Remove Member
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      )}

      <div className={cn(styles.userInfo)}>
        <Avatar
          src={member.image_url ?? null}
          alt={member.user_name ?? 'User'}
          radius='xl'
          size={50}
          className={cn(styles.avatar)}
        >
          {getInitials(member.user_name)}
        </Avatar>
        <div className={cn(styles.userDetails)}>
          <Text fw={600} className={cn(styles.userName)}>
            {member.user_name || 'Unnamed User'}
            {isCurrentUser && (
              <Text component='span' size='xs' c='dimmed'>
                {' '}
                (You)
              </Text>
            )}
          </Text>
          {member.email && (
            <Text size='sm' className={cn(styles.userEmail)}>
              <a href={`mailto:${member.email}`} className={cn(styles.emailLink)}>
                <IconMail size={14} className={cn(styles.emailIcon)} />
                {member.email}
              </a>
            </Text>
          )}
        </div>
      </div>

      <div className={cn(styles.memberInfo)}>
        <Badge
          variant='light'
          size='sm'
          radius='sm'
          className={cn(styles.roleBadge)}
          data-role={member.role}
        >
          {member.role}
        </Badge>
        <Text size='xs' className={cn(styles.joinDate)}>
          Joined{' '}
          {member.created_at ?
            formatDistanceToNow(new Date(member.created_at), { addSuffix: true })
          : 'unknown time'}
        </Text>
      </div>
    </div>
  );
};

export default MemberCard;
