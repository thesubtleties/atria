import { Text, Textarea } from '@mantine/core';
import styles from './styles/index.module.css';

interface AboutSectionProps {
  bio?: string | null;
  isEditing: boolean;
  value: string;
  onChange: (value: string) => void;
}

export const AboutSection = ({ bio, isEditing, value, onChange }: AboutSectionProps) => {
  return (
    <section className={styles.profileSection}>
      <h2 className={styles.sectionTitle}>About Me</h2>
      {isEditing ? (
        <Textarea
          placeholder='Tell us about yourself...'
          minRows={6}
          autosize
          maxRows={10}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          classNames={{ input: styles.formTextarea }}
        />
      ) : (
        <p className={styles.bioText}>
          {bio || (
            <Text component='span' c='dimmed' size='sm'>
              No bio added yet
            </Text>
          )}
        </p>
      )}
    </section>
  );
};
