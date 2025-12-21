import { Text, Stack, Switch } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import type { PrivacySettingsFormData } from '../../schemas/privacySchema';
import { cn } from '@/lib/cn';
import styles from './styles.module.css';

type ProfileSectionProps = {
  form: UseFormReturnType<PrivacySettingsFormData>;
};

const ProfileSection = ({ form }: ProfileSectionProps) => {
  return (
    <div className={cn(styles.formSection)}>
      <Text className={cn(styles.sectionLabel)}>Profile Information</Text>
      <Stack gap='sm'>
        <Switch
          {...form.getInputProps('show_company', { type: 'checkbox' })}
          className={cn(styles.formSwitch)}
          label='Show company and job title'
          description='Display your professional information on your profile'
          color='var(--color-primary)'
          styles={{
            track: {
              '&[data-checked]': {
                backgroundColor: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
              },
            },
          }}
        />
        <Switch
          {...form.getInputProps('show_bio', { type: 'checkbox' })}
          className={cn(styles.formSwitch)}
          label='Show bio'
          description='Display your biography on your profile'
          color='var(--color-primary)'
          styles={{
            track: {
              '&[data-checked]': {
                backgroundColor: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
              },
            },
          }}
        />
      </Stack>
    </div>
  );
};

export default ProfileSection;
