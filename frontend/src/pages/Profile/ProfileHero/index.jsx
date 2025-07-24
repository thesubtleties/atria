import React from 'react';
import { Avatar, Group, Stack, Text } from '@mantine/core';
import { IconEdit, IconShare, IconRefresh } from '@tabler/icons-react';
import { Button } from '@/shared/components/buttons';
import styles from './styles/index.module.css';

export const ProfileHero = ({ user, onEditClick, isOwnProfile = true, isEditing = false, onAvatarReroll }) => {
  if (!user) return null;

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <section className={styles.profileHero}>
      <div className={styles.profileHeroContent}>
        <div className={styles.avatarContainer}>
          <Avatar
            src={user.image_url}
            alt={user.full_name || user.email}
            size={120}
            radius={8}
            className={styles.profileAvatarLarge}
          >
            {getInitials(user.full_name || user.email)}
          </Avatar>
          {isEditing && onAvatarReroll && (
            <Button
              variant="subtle"
              size="sm"
              onClick={onAvatarReroll}
              className={styles.rerollButton}
            >
              <IconRefresh size={16} />
              Reroll Avatar
            </Button>
          )}
        </div>
        
        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>{user.full_name || 'Unnamed User'}</h1>
          {(user.title || user.company_name) && (
            <p className={styles.profileTitle}>
              {user.title}
              {user.title && user.company_name && ' at '}
              {user.company_name}
            </p>
          )}
          <div className={styles.profileMeta}>
            <div className={styles.profileMetaItem}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 5.5a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5zM3 8a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9A.5.5 0 013 8zm0 2.5a.5.5 0 01.5-.5h6a.5.5 0 010 1h-6a.5.5 0 01-.5-.5z" />
              </svg>
              {user.email}
            </div>
            <div className={styles.profileMetaItem}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 00-11.215 0c-.22.578.254 1.139.872 1.139h9.47z" />
              </svg>
              Member since {memberSince}
            </div>
          </div>
        </div>
        
        {isOwnProfile && (
          <div className={styles.profileActions}>
            <Button
              variant="primary"
              onClick={onEditClick}
            >
              <IconEdit size={16} />
              Edit Profile
            </Button>
            <Button
              variant="secondary"
              onClick={() => {}}
            >
              <IconShare size={16} />
              Share
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};