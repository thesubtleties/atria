import { Text } from '@mantine/core';
import styles from './styles/index.module.css';

export const ProfessionalInfo = ({ user }) => {
  if (!user) return null;

  return (
    <section className={styles.profileSection}>
      <h2 className={styles.sectionTitle}>Professional Information</h2>
      <div className={styles.infoList}>
        {user.company_name && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Company</span>
            <span className={styles.infoValue}>{user.company_name}</span>
          </div>
        )}
        {user.title && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Title</span>
            <span className={styles.infoValue}>{user.title}</span>
          </div>
        )}
        {user.is_active !== undefined && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Account Status</span>
            <div className={user.is_active ? styles.statusActive : styles.statusInactive}>
              {user.is_active ? 'Active' : 'Inactive'}
            </div>
          </div>
        )}
        {!user.company_name && !user.title && (
          <Text color="dimmed" size="sm">
            No professional information added yet
          </Text>
        )}
      </div>
    </section>
  );
};