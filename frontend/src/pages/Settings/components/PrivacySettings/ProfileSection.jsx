import { Text, Stack, Switch } from '@mantine/core';
import styles from './styles.module.css';

const ProfileSection = ({ form }) => {
  return (
    <div className={styles.formSection}>
      <Text className={styles.sectionLabel}>Profile Information</Text>
      <Stack gap="sm">
        <Switch
          {...form.getInputProps('show_company', { type: 'checkbox' })}
          className={styles.formSwitch}
          label="Show company and job title"
          description="Display your professional information on your profile"
          color="var(--color-primary)"
          styles={{
            track: { 
              '&[data-checked]': { 
                backgroundColor: 'var(--color-primary)',
                borderColor: 'var(--color-primary)'
              }
            }
          }}
        />
        <Switch
          {...form.getInputProps('show_bio', { type: 'checkbox' })}
          className={styles.formSwitch}
          label="Show bio"
          description="Display your biography on your profile"
          color="var(--color-primary)"
          styles={{
            track: { 
              '&[data-checked]': { 
                backgroundColor: 'var(--color-primary)',
                borderColor: 'var(--color-primary)'
              }
            }
          }}
        />
      </Stack>
    </div>
  );
};

export default ProfileSection;