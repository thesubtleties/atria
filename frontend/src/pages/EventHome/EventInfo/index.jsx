// pages/EventHome/EventInfo/index.jsx
import { Group, Text, Card } from '@mantine/core';
import {
  IconCalendar,
  IconMapPin,
  IconDeviceLaptop,
} from '@tabler/icons-react';
import styles from './styles/index.module.css';

export default function EventInfo({ format, venue, dates }) {
  return (
    <section className={styles.eventInfo}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <Card shadow="sm" padding="lg" radius="md">
            <Group align="center" mb="md">
              <IconDeviceLaptop
                size={24}
                color="var(--mantine-color-violet-6)"
              />
              <Text fw={500} size="lg">
                Event Format
              </Text>
            </Group>
            <Text c="dimmed">
              {format === 'HYBRID'
                ? 'In-person & Virtual Event'
                : 'Virtual Event'}
            </Text>
          </Card>

          {venue.name && (
            <Card shadow="sm" padding="lg" radius="md">
              <Group align="center" mb="md">
                <IconMapPin size={24} color="var(--mantine-color-violet-6)" />
                <Text fw={500} size="lg">
                  Location
                </Text>
              </Group>
              <Text fw={500}>{venue.name}</Text>
              <Text c="dimmed" size="sm">
                {venue.address}
              </Text>
              <Text c="dimmed" size="sm">
                {venue.city}, {venue.country}
              </Text>
            </Card>
          )}

          <Card shadow="sm" padding="lg" radius="md">
            <Group align="center" mb="md">
              <IconCalendar size={24} color="var(--mantine-color-violet-6)" />
              <Text fw={500} size="lg">
                Event Dates
              </Text>
            </Group>
            <Text>
              {new Date(dates.start).toLocaleDateString()} -{' '}
              {new Date(dates.end).toLocaleDateString()}
            </Text>
          </Card>
        </div>
      </div>
    </section>
  );
}
