import { Text, Select } from '@mantine/core';
import styles from './styles.module.css';

const ConnectionSection = ({ form }) => {
  return (
    <>
      <div className={styles.formSection}>
        <Text className={styles.sectionLabel}>Connection Requests</Text>
        <Select
          {...form.getInputProps('allow_connection_requests')}
          className={styles.formInput}
          data={[
            { value: 'event_attendees', label: 'Event Attendees Only' },
            { value: 'speakers_organizers', label: 'Speakers & Organizers Only' },
            { value: 'none', label: 'No One' },
          ]}
          description='Who can send you connection requests'
          allowDeselect={false}
        />
      </div>

      <div className={styles.formSection}>
        <Text className={styles.sectionLabel}>Social Links</Text>
        <Select
          {...form.getInputProps('show_social_links')}
          className={styles.formInput}
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
