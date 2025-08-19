import { Text, Select, Switch, TextInput } from '@mantine/core';
import styles from './styles.module.css';

const EmailSection = ({ form }) => {
  return (
    <>
      <div className={styles.formSection}>
        <Text className={styles.sectionLabel}>Email Visibility</Text>
        <Select
          {...form.getInputProps('email_visibility')}
          className={styles.formInput}
          data={[
            { value: 'event_attendees', label: 'Event Attendees' },
            { value: 'connections_organizers', label: 'Connections & Event Organizers' },
            { value: 'organizers_only', label: 'Event Organizers Only' },
          ]}
          description="Who can see your email address"
          allowDeselect={false}
        />
      </div>
      
      {form.values.email_visibility === 'organizers_only' && (
        <div className={styles.formSection}>
          <Switch
            {...form.getInputProps('show_public_email', { type: 'checkbox' })}
            className={styles.formSwitch}
            label="Use a different email for public display"
            description="Show a different email address to other attendees instead of hiding it completely"
            mb="sm"
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
          {form.values.show_public_email && (
            <TextInput
              {...form.getInputProps('public_email')}
              className={styles.formInput}
              placeholder="public@example.com"
              description="This email will be shown to attendees while organizers can still see your account email"
              mt="sm"
            />
          )}
        </div>
      )}
    </>
  );
};

export default EmailSection;