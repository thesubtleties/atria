import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Title, Tabs, Stack, LoadingOverlay, Alert } from '@mantine/core';
import { 
  IconInfoCircle, 
  IconMapPin, 
  IconPalette, 
  IconFileText,
  IconUsers 
} from '@tabler/icons-react';
import { useGetEventQuery } from '@/app/features/events/api';
import BasicInfoSection from './BasicInfoSection';
import VenueSection from './VenueSection';
import BrandingSection from './BrandingSection';
import ContentSections from './ContentSections';
import NetworkingSection from './NetworkingSection';
import styles from './styles/index.module.css';

const EventSettings = () => {
  const { eventId } = useParams();
  const [activeTab, setActiveTab] = useState('basic');

  const { 
    data: event, 
    isLoading, 
    error 
  } = useGetEventQuery(parseInt(eventId));

  if (isLoading) {
    return (
      <Container size="xl" className={styles.container}>
        <LoadingOverlay visible />
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" className={styles.container}>
        <Alert color="red" mb="lg">
          Failed to load event settings. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" className={styles.container}>
      <Title order={2} mb="xl">Event Settings</Title>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab 
            value="basic" 
            leftSection={<IconInfoCircle size={16} />}
          >
            Basic Info
          </Tabs.Tab>
          <Tabs.Tab 
            value="venue" 
            leftSection={<IconMapPin size={16} />}
          >
            Format & Venue
          </Tabs.Tab>
          <Tabs.Tab 
            value="branding" 
            leftSection={<IconPalette size={16} />}
          >
            Branding & Hero
          </Tabs.Tab>
          <Tabs.Tab 
            value="content" 
            leftSection={<IconFileText size={16} />}
          >
            Content
          </Tabs.Tab>
          <Tabs.Tab 
            value="networking" 
            leftSection={<IconUsers size={16} />}
          >
            Networking
          </Tabs.Tab>
        </Tabs.List>

        <Stack mt="xl">
          <Tabs.Panel value="basic">
            <BasicInfoSection event={event} eventId={parseInt(eventId)} />
          </Tabs.Panel>

          <Tabs.Panel value="venue">
            <VenueSection event={event} eventId={parseInt(eventId)} />
          </Tabs.Panel>

          <Tabs.Panel value="branding">
            <BrandingSection event={event} eventId={parseInt(eventId)} />
          </Tabs.Panel>

          <Tabs.Panel value="content">
            <ContentSections event={event} eventId={parseInt(eventId)} />
          </Tabs.Panel>

          <Tabs.Panel value="networking">
            <NetworkingSection event={event} eventId={parseInt(eventId)} />
          </Tabs.Panel>
        </Stack>
      </Tabs>
    </Container>
  );
};

export default EventSettings;