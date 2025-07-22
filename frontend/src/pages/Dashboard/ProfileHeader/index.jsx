import React from 'react';
import { Avatar, Text } from '@mantine/core';
import styles from './styles/index.module.css';

export const ProfileHeader = ({ user }) => {
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
    <section className={styles.profileHeader}>
      <div className={styles.profileContent}>
        <Avatar
          src={user.image_url}
          alt={user.full_name || user.email}
          size={60}
          radius={8}
          className={styles.profileAvatar}
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