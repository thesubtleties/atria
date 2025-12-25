import { Avatar } from '@mantine/core';
import type { DashboardUser } from '../index';
import styles from './styles/index.module.css';

type ProfileHeaderProps = {
  user: DashboardUser | null;
};

export const ProfileHeader = ({ user }: ProfileHeaderProps) => {
  if (!user) return null;

  const getInitials = (name: string | null): string => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className={styles.profileHeader}>
      <div className={styles.profileContent}>
        <Avatar
          src={user.image_url}
          alt={user.full_name || user.email}
          size={60}
          radius={8}
          className={styles.profileAvatar ?? ''}
          styles={{
            root: {
              width: 'clamp(50px, 12vw, 60px)',
              height: 'clamp(50px, 12vw, 60px)',
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            },
          }}
        >
          {getInitials(user.full_name || user.email)}
        </Avatar>

        <div className={styles.profileDetails}>
          <h2>{user.full_name || user.email}</h2>
          {(user.title || user.company_name) && (
            <div className={styles.position}>
              {user.title}
              {user.title && user.company_name && ' at '}
              {user.company_name}
            </div>
          )}
          <div className={styles.memberSince}>Member since {memberSince}</div>
        </div>
      </div>
    </section>
  );
};
