import { Text, Select, Switch, TextInput } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import type { PrivacySettingsFormData } from '../../schemas/privacySchema';
import { cn } from '@/lib/cn';
import styles from './styles.module.css';

type EmailSectionProps = {
  form: UseFormReturnType<PrivacySettingsFormData>;
};

const EmailSection = ({ form }: EmailSectionProps) => {
  return (
    <>
      <div className={cn(styles.formSection)}>
        <Text className={cn(styles.sectionLabel)}>Email Visibility</Text>
        <Select
          {...form.getInputProps('email_visibility')}
          className={cn(styles.formInput)}
          data={[
            { value: 'EVENT_ATTENDEES', label: 'Event Attendees' },
            { value: 'CONNECTIONS_ORGANIZERS', label: 'Connections & Event Organizers' },
            { value: 'ORGANIZERS_ONLY', label: 'Event Organizers Only' },
          ]}
          description='Who can see your email address'
          allowDeselect={false}
        />
      </div>

      {form.values.email_visibility === 'ORGANIZERS_ONLY' && (
        <div className={cn(styles.formSection)}>
          <Switch
            {...form.getInputProps('show_public_email', { type: 'checkbox' })}
            className={cn(styles.formSwitch)}
            label='Use a different email for public display'
            description='Show a different email address to other attendees instead of hiding it completely'
            mb='sm'
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
          {form.values.show_public_email && (
            <TextInput
              {...form.getInputProps('public_email')}
              className={cn(styles.formInput)}
              placeholder='public@example.com'
              description='This email will be shown to attendees while organizers can still see your account email'
              mt='sm'
            />
          )}
        </div>
      )}
    </>
  );
};

export default EmailSection;
