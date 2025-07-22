import React from 'react';
import { Text } from '@mantine/core';
import { IconBrandLinkedin, IconBrandTwitter, IconWorld } from '@tabler/icons-react';
import styles from './styles/index.module.css';

export const SocialLinks = ({ socialLinks }) => {
  const hasLinks = socialLinks?.linkedin || socialLinks?.twitter || socialLinks?.website;
  
  if (!hasLinks) {
    return (
      <section className={styles.profileSection}>
        <h2 className={styles.sectionTitle}>Social Links</h2>
        <Text color="dimmed" size="sm">
          No social links added yet
        </Text>
      </section>
    );
  }

  return (
    <section className={styles.profileSection}>
      <h2 className={styles.sectionTitle}>Social Links</h2>
      <div className={styles.socialLinks}>
        {socialLinks.linkedin && (
          <a 
            href={socialLinks.linkedin} 
            className={styles.socialLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className={styles.socialIcon}>
              <IconBrandLinkedin size={20} />
            </div>
            LinkedIn
          </a>
        )}
        {socialLinks.twitter && (
          <a 
            href={socialLinks.twitter} 
            className={styles.socialLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className={styles.socialIcon}>
              <IconBrandTwitter size={20} />
            </div>
            Twitter
          </a>
        )}
        {socialLinks.website && (
          <a 
            href={socialLinks.website} 
            className={styles.socialLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className={styles.socialIcon}>
              <IconWorld size={20} />
            </div>
            Website
          </a>
        )}
      </div>
    </section>
  );
};