import { Text, Select } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import type { PrivacySettingsFormData } from '../../schemas/privacySchema';
import { cn } from '@/lib/cn';
import styles from './styles.module.css';

type ConnectionSectionProps = {
  form: UseFormReturnType<PrivacySettingsFormData>;
};

const ConnectionSection = ({ form }: ConnectionSectionProps) => {
  return (
    <>
      <div className={cn(styles.formSection)}>
        <Text className={cn(styles.sectionLabel)}>Connection Requests</Text>
        <Select
          {...form.getInputProps('allow_connection_requests')}
          className={cn(styles.formInput)}
          data={[
            { value: 'event_attendees', label: 'Event Attendees Only' },
            { value: 'speakers_organizers', label: 'Speakers & Organizers Only' },
            { value: 'none', label: 'No One' },
          ]}
          description='Who can send you connection requests'
          allowDeselect={false}
        />
      </div>

      <div className={cn(styles.formSection)}>
        <Text className={cn(styles.sectionLabel)}>Social Links</Text>
        <Select
          {...form.getInputProps('show_social_links')}
          className={cn(styles.formInput)}
          data={[
            { value: 'event_attendees', label: 'Event Attendees' },
            { value: 'connections', label: 'Connections Only' },
            { value: 'hidden', label: 'Hidden' },
          ]}
          description='Who can see your social media links'
          allowDeselect={false}
        />
      </div>
    </>
  );
};

export default ConnectionSection;
