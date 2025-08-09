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
            { value: 'everyone', label: 'Everyone' },
            { value: 'connections_organizers', label: 'Connections & Event Organizers' },
            { value: 'organizers_only', label: 'Event Organizers Only' },
            { value: 'hidden', label: 'Hidden' },
          ]}
          description="Who can see your email address"
        />
      </div>
      
      <div className={styles.formSection}>
        <Switch
          {...form.getInputProps('show_public_email', { type: 'checkbox' })}
          className={styles.formSwitch}
          label="Use a different email for public display"
          description="Show a different email address instead of your account email"
          mb="sm"
        />
        {form.values.show_public_email && (
          <TextInput
            {...form.getInputProps('public_email')}
            className={styles.formInput}
            placeholder="public@example.com"
            description="This email will be shown instead of your account email"
            mt="sm"
          />
        )}
      </div>
    </>
  );
};

export default EmailSection;