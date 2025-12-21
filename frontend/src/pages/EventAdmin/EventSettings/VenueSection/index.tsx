import { useState, useEffect } from 'react';
import { Select, TextInput, Textarea, Stack, Group, Text, Alert } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle, IconCheck, IconX } from '@tabler/icons-react';
import { useUpdateEventMutation } from '@/app/features/events/api';
import { eventFormatSchema } from '../schemas/eventSettingsSchemas';
import { Button } from '@/shared/components/buttons';
import { US_STATES } from '@/shared/constants/usStates';
import { cn } from '@/lib/cn';
import type { Event } from '@/types';
import type { ApiError } from '@/types';
import styles from './styles.module.css';
import parentStyles from '../styles/index.module.css';

type VenueSectionProps = {
  event: Event | undefined;
  eventId: number;
};

type EventFormat = 'VIRTUAL' | 'IN_PERSON' | 'HYBRID';

type FormValues = {
  event_format: EventFormat;
  is_private: boolean;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_state: string;
  venue_country: string;
};

const VenueSection = ({ event, eventId }: VenueSectionProps) => {
  const [updateEvent, { isLoading }] = useUpdateEventMutation();
  const [hasChanges, setHasChanges] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      event_format: (event?.event_format as EventFormat) ?? 'VIRTUAL',
      is_private: event?.is_private ?? false,
      venue_name: event?.venue_name ?? '',
      venue_address: event?.venue_address ?? '',
      venue_city: event?.venue_city ?? '',
      venue_state: event?.venue_state ?? '',
      venue_country: event?.venue_country ?? '',
    },
    validate: zodResolver(eventFormatSchema),
  });

  // Track changes
  useEffect(() => {
    const checkChanges = () => {
      const changed = Object.keys(form.values).some((key) => {
        const formKey = key as keyof FormValues;
        return form.values[formKey] !== (event?.[formKey as keyof Event] ?? '');
      });
      setHasChanges(changed);
    };

    checkChanges();
  }, [form.values, event]);

  // Show/hide venue fields based on format
  const showVenueFields =
    form.values.event_format === 'IN_PERSON' || form.values.event_format === 'HYBRID';

  const handleSubmit = async (values: FormValues) => {
    try {
      // Clear venue fields if virtual
      const venueData =
        values.event_format === 'VIRTUAL' ?
          {
            venue_name: null,
            venue_address: null,
            venue_city: null,
            venue_state: null,
            venue_country: null,
          }
        : {
            venue_name: values.venue_name || null,
            venue_address: values.venue_address || null,
            venue_city: values.venue_city || null,
            venue_state: (values.venue_state || null) as Event['venue_state'],
            venue_country: values.venue_country || null,
          };

      await updateEvent({
        id: eventId,
        event_format: values.event_format,
        is_private: values.is_private,
        ...venueData,
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Event format and venue updated successfully',
        color: 'green',
      });
      setHasChanges(false);
    } catch (error) {
      const apiError = error as ApiError;
      notifications.show({
        title: 'Error',
        message: apiError.data?.message || 'Failed to update event format',
        color: 'red',
      });
    }
  };

  const handleReset = () => {
    form.setValues({
      event_format: (event?.event_format as EventFormat) ?? 'VIRTUAL',
      is_private: event?.is_private ?? false,
      venue_name: event?.venue_name ?? '',
      venue_address: event?.venue_address ?? '',
      venue_city: event?.venue_city ?? '',
      venue_state: event?.venue_state ?? '',
      venue_country: event?.venue_country ?? '',
    });
    setHasChanges(false);
  };

  return (
    <div className={cn(parentStyles.section, styles.glassSection)}>
      <h3 className={cn(parentStyles.sectionTitle)}>Event Format & Venue</h3>
      <Text c='dimmed' size='sm' mb='xl'>
        Configure how attendees will participate in your event
      </Text>

      <form onSubmit={form.onSubmit((values) => handleSubmit(values as FormValues))}>
        <Stack gap='md'>
          <Group grow align='flex-start'>
            <Select
              label='Event Format'
              data={[
                { value: 'VIRTUAL', label: 'Virtual' },
                { value: 'IN_PERSON', label: 'In-Person' },
                { value: 'HYBRID', label: 'Hybrid' },
              ]}
              required
              classNames={{
                input: styles.formInput ?? '',
                label: styles.formLabel ?? '',
              }}
              {...form.getInputProps('event_format')}
            />
          </Group>

          {form.values.event_format === 'VIRTUAL' && (
            <Alert icon={<IconInfoCircle size={16} />} className={cn(styles.infoAlert)}>
              {`Virtual events don't require venue information. Attendees will
              join online.`}
            </Alert>
          )}

          {showVenueFields && (
            <>
              <h4 className={cn(styles.subsectionTitle)}>Venue Information</h4>

              <TextInput
                label='Venue Name'
                placeholder='Enter venue name'
                required
                classNames={{
                  input: styles.formInput ?? '',
                  label: styles.formLabel ?? '',
                }}
                {...form.getInputProps('venue_name')}
              />

              <Textarea
                label='Venue Address'
                placeholder='Enter full address'
                minRows={2}
                classNames={{
                  input: styles.formInput ?? '',
                  label: styles.formLabel ?? '',
                }}
                {...form.getInputProps('venue_address')}
              />

              <Group grow>
                <TextInput
                  label='City'
                  placeholder='Enter city'
                  required
                  classNames={{
                    input: styles.formInput ?? '',
                    label: styles.formLabel ?? '',
                  }}
                  {...form.getInputProps('venue_city')}
                />

                <Select
                  label='State'
                  placeholder='Select state'
                  searchable
                  clearable
                  data={US_STATES}
                  classNames={{
                    input: styles.formInput ?? '',
                    label: styles.formLabel ?? '',
                  }}
                  {...form.getInputProps('venue_state')}
                />

                <TextInput
                  label='Country'
                  placeholder='Enter country'
                  required
                  classNames={{
                    input: styles.formInput ?? '',
                    label: styles.formLabel ?? '',
                  }}
                  {...form.getInputProps('venue_country')}
                />
              </Group>
            </>
          )}

          {hasChanges && (
            <Group justify='flex-end' className={cn(parentStyles.formActions)}>
              <Button variant='secondary' onClick={handleReset}>
                <IconX size={16} />
                Cancel
              </Button>
              <Button type='submit' variant='primary' loading={isLoading}>
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
