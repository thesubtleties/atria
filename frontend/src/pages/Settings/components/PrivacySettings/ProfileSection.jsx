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
        />
        <Switch
          {...form.getInputProps('show_bio', { type: 'checkbox' })}
          className={styles.formSwitch}
          label="Show bio"
          description="Display your biography on your profile"
        />
      </Stack>
    </div>
  );
};

export default ProfileSection;