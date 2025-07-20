import { useState, useEffect } from 'react';
import { 
  Select, 
  TextInput, 
  Textarea, 
  Stack, 
  Group, 
  Button,
  Paper,
  Title,
  Switch,
  Text,
  Alert
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';
import { useUpdateEventMutation } from '@/app/features/events/api';
import { eventFormatSchema } from '../schemas/eventSettingsSchemas';
import styles from './styles.module.css';

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
    <Paper className={styles.section}>
      <Title order={3} mb="lg">Event Format & Venue</Title>
      
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
              {...form.getInputProps('event_format')}
            />

            <div>
              <Text size="sm" fw={500} mb="xs">
                Privacy Settings
              </Text>
              <Switch
                label="Private Event"
                description="Only invited users can join"
                {...form.getInputProps('is_private', { type: 'checkbox' })}
              />
            </div>
          </Group>

          {form.values.event_format === 'VIRTUAL' && (
            <Alert icon={<IconInfoCircle size={16} />} color="blue">
              Virtual events don't require venue information. Attendees will join online.
            </Alert>
          )}

          {showVenueFields && (
            <>
              <Title order={4} mt="md">Venue Information</Title>
              
              <TextInput
                label="Venue Name"
                placeholder="Enter venue name"
                required
                {...form.getInputProps('venue_name')}
              />

              <Textarea
                label="Venue Address"
                placeholder="Enter full address"
                minRows={2}
                {...form.getInputProps('venue_address')}
              />

              <Group grow>
                <TextInput
                  label="City"
                  placeholder="Enter city"
                  required
                  {...form.getInputProps('venue_city')}
                />

                <TextInput
                  label="Country"
                  placeholder="Enter country"
                  required
                  {...form.getInputProps('venue_country')}
                />
              </Group>
            </>
          )}

          {hasChanges && (
            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                Save Changes
              </Button>
            </Group>
          )}
        </Stack>
      </form>
    </Paper>
  );
};

export default VenueSection;