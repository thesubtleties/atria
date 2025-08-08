import { useState, useEffect } from 'react';
import { 
  Select, 
  TextInput, 
  Textarea, 
  Stack, 
  Group,
  Switch,
  Text,
  Alert
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle, IconCheck, IconX } from '@tabler/icons-react';
import { useUpdateEventMutation } from '@/app/features/events/api';
import { eventFormatSchema } from '../schemas/eventSettingsSchemas';
import { Button } from '@/shared/components/buttons';
import styles from './styles.module.css';
import parentStyles from '../styles/index.module.css';

const VenueSection = ({ event, eventId }) => {
  const [updateEvent, { isLoading }] = useUpdateEventMutation();
  const [hasChanges, setHasChanges] = useState(false);

  const form = useForm({
    initialValues: {
      event_format: event?.event_format || 'VIRTUAL',
      is_private: event?.is_private || false,
      venue_name: event?.venue_name || '',
      venue_address: event?.venue_address || '',
      venue_city: event?.venue_city || '',
      venue_country: event?.venue_country || '',
    },
    resolver: zodResolver(eventFormatSchema),
  });

  // Track changes
  useEffect(() => {
    const checkChanges = () => {
      const changed = Object.keys(form.values).some(key => {
        return form.values[key] !== event?.[key];
      });
      setHasChanges(changed);
    };

    checkChanges();
  }, [form.values, event]);

  // Show/hide venue fields based on format
  const showVenueFields = form.values.event_format === 'IN_PERSON' || 
                         form.values.event_format === 'HYBRID';

  const handleSubmit = async (values) => {
    try {
      // Clear venue fields if virtual
      const updateData = { ...values };
      if (values.event_format === 'VIRTUAL') {
        updateData.venue_name = null;
        updateData.venue_address = null;
        updateData.venue_city = null;
        updateData.venue_country = null;
      }

      await updateEvent({
        id: eventId,
        ...updateData,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Event format and venue updated successfully',
        color: 'green',
      });
      setHasChanges(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to update event format',
        color: 'red',
      });
    }
  };

  const handleReset = () => {
    form.setValues({
      event_format: event?.event_format || 'VIRTUAL',
      is_private: event?.is_private || false,
      venue_name: event?.venue_name || '',
      venue_address: event?.venue_address || '',
      venue_city: event?.venue_city || '',
      venue_country: event?.venue_country || '',
    });
    setHasChanges(false);
  };

  return (
    <div className={`${parentStyles.section} ${styles.glassSection}`}>
      <h3 className={parentStyles.sectionTitle}>Event Format & Venue</h3>
      <Text c="dimmed" size="sm" mb="xl">
        Configure how attendees will participate in your event
      </Text>
      
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
          <Group grow align="flex-start">
            <Select
              label="Event Format"
              data={[
                { value: 'VIRTUAL', label: 'Virtual' },
                { value: 'IN_PERSON', label: 'In-Person' },
                { value: 'HYBRID', label: 'Hybrid' },
              ]}
              required
              classNames={{
                input: styles.formInput,
                label: styles.formLabel
              }}
              {...form.getInputProps('event_format')}
            />

            {/* Privacy Settings - Commented out, all events are private by default for now
            <div className={styles.privacySection}>
              <Text className={styles.formLabel}>
                Privacy Settings
              </Text>
              <div className={styles.switchWrapper}>
                <Switch
                  label="Private Event"
                  description="Only invited users can join"
                  classNames={{
                    track: styles.switchTrack,
                    label: styles.switchLabel,
                    description: styles.switchDescription
                  }}
                  {...form.getInputProps('is_private', { type: 'checkbox' })}
                />
              </div>
            </div>
            */}
          </Group>

          {form.values.event_format === 'VIRTUAL' && (
            <Alert 
              icon={<IconInfoCircle size={16} />} 
              className={styles.infoAlert}
            >
              Virtual events don't require venue information. Attendees will join online.
            </Alert>
          )}

          {showVenueFields && (
            <>
              <h4 className={styles.subsectionTitle}>Venue Information</h4>
              
              <TextInput
                label="Venue Name"
                placeholder="Enter venue name"
                required
                classNames={{
                  input: styles.formInput,
                  label: styles.formLabel
                }}
                {...form.getInputProps('venue_name')}
              />

              <Textarea
                label="Venue Address"
                placeholder="Enter full address"
                minRows={2}
                classNames={{
                  input: styles.formInput,
                  label: styles.formLabel
                }}
                {...form.getInputProps('venue_address')}
              />

              <Group grow>
                <TextInput
                  label="City"
                  placeholder="Enter city"
                  required
                  classNames={{
                    input: styles.formInput,
                    label: styles.formLabel
                  }}
                  {...form.getInputProps('venue_city')}
                />

                <TextInput
                  label="Country"
                  placeholder="Enter country"
                  required
                  classNames={{
                    input: styles.formInput,
                    label: styles.formLabel
                  }}
                  {...form.getInputProps('venue_country')}
                />
              </Group>
            </>
          )}

          {hasChanges && (
            <Group justify="flex-end" className={parentStyles.formActions}>
              <Button variant="subtle" onClick={handleReset}>
                <IconX size={16} />
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                loading={isLoading}
              >
                <IconCheck size={16} />
                Save Changes
              </Button>
            </Group>
          )}
        </Stack>
      </form>
    </div>
  );
};

export default VenueSection;