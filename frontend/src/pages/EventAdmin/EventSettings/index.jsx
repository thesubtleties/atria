import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, LoadingOverlay, Alert, Text } from '@mantine/core';
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
      <div className={styles.container}>
        <div className={styles.bgShape1} />
        <div className={styles.bgShape2} />
        <div className={styles.contentWrapper}>
          <LoadingOverlay visible />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.bgShape1} />
        <div className={styles.bgShape2} />
        <div className={styles.contentWrapper}>
          <section className={styles.mainContent}>
            <Alert color="red" title="Error">
              Failed to load event settings. Please try again.
            </Alert>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Background Shapes */}
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />
      
      <div className={styles.contentWrapper}>
        {/* Header Section */}
        <section className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Event Settings</h1>
          <Text c="dimmed" size="sm" className={styles.pageSubtitle}>
            Manage your event configuration and preferences
          </Text>
        </section>

        {/* Main Content Section */}
        <section className={styles.mainContent}>
          <Tabs value={activeTab} onChange={setActiveTab} className={styles.tabsContainer}>
            <Tabs.List className={styles.tabsList}>
              <Tabs.Tab 
                value="basic" 
                className={styles.tab}
                leftSection={<IconInfoCircle size={16} />}
              >
                Basic Info
              </Tabs.Tab>
              <Tabs.Tab 
                value="venue" 
                className={styles.tab}
                leftSection={<IconMapPin size={16} />}
              >
                Format & Venue
              </Tabs.Tab>
              <Tabs.Tab 
                value="branding" 
                className={styles.tab}
                leftSection={<IconPalette size={16} />}
              >
                Branding & Hero
              </Tabs.Tab>
              <Tabs.Tab 
                value="content" 
                className={styles.tab}
                leftSection={<IconFileText size={16} />}
              >
                Content
              </Tabs.Tab>
              <Tabs.Tab 
                value="networking" 
                className={styles.tab}
                leftSection={<IconUsers size={16} />}
              >
                Networking
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="basic" className={styles.tabPanel}>
              <BasicInfoSection event={event} eventId={parseInt(eventId)} />
            </Tabs.Panel>

            <Tabs.Panel value="venue" className={styles.tabPanel}>
              <VenueSection event={event} eventId={parseInt(eventId)} />
            </Tabs.Panel>

            <Tabs.Panel value="branding" className={styles.tabPanel}>
              <BrandingSection event={event} eventId={parseInt(eventId)} />
            </Tabs.Panel>

            <Tabs.Panel value="content" className={styles.tabPanel}>
              <ContentSections event={event} eventId={parseInt(eventId)} />
            </Tabs.Panel>

            <Tabs.Panel value="networking" className={styles.tabPanel}>
              <NetworkingSection event={event} eventId={parseInt(eventId)} />
            </Tabs.Panel>
          </Tabs>
        </section>
      </div>
    </div>
  );
};

export default EventSettings;