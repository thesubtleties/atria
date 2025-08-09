import { Alert, Text, Group, Badge } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import styles from './styles.module.css';

const EventOverrides = ({ overrides }) => {
  if (!overrides || overrides.length === 0) {
    return null;
  }
  
  return (
    <div className={styles.formSection}>
      <Alert 
        icon={<IconAlertCircle />} 
        variant="light"
        className={styles.infoAlert}
      >
        <Text fw={500} mb="xs" className={styles.sectionLabel}>Event-Specific Settings</Text>
        <Text size="sm" className={styles.alertText}>
          You have custom privacy settings for {overrides.length} event(s).
          These override your default settings when you're participating as a speaker.
        </Text>
        <Group gap="xs" mt="sm">
          {overrides.map((override) => (
            <Badge 
              key={override.event_id} 
              variant="outline"
              className={styles.eventBadge}
            >
              {override.event_name}
            </Badge>
          ))}
        </Group>
      </Alert>
    </div>
  );
};

export default EventOverrides;