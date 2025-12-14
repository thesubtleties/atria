import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@mantine/hooks';
import { Tabs, Alert, Text, Select } from '@mantine/core';
import { LoadingOverlay } from '../../../shared/components/loading';
import {
  IconInfoCircle,
  IconMapPin,
  IconPalette,
  IconFileText,
  IconUsers,
  IconAlertTriangle,
  IconChevronDown,
} from '@tabler/icons-react';
import { useGetEventQuery } from '@/app/features/events/api';
import { useGetOrganizationQuery } from '@/app/features/organizations/api';
import BasicInfoSection from './BasicInfoSection';
import VenueSection from './VenueSection';
import BrandingSection from './BrandingSection';
import ContentSections from './ContentSections';
import NetworkingSection from './NetworkingSection';
import DangerZoneSection from './DangerZoneSection';
import styles from './styles/index.module.css';

const EventSettings = () => {
  const { eventId } = useParams();
  const [activeTab, setActiveTab] = useState('basic');
  const currentUserId = useSelector((state) => state.auth.user?.id);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const {
    data: event,
    isLoading,
    error,
  } = useGetEventQuery({ id: parseInt(eventId) }, { skip: !eventId });

  // Fetch organization data to check user role
  const { data: organization } = useGetOrganizationQuery(event?.organization_id, {
    skip: !event?.organization_id,
  });

  // Check if current user is org owner
  const isOrgOwner = organization?.users?.some(
    (user) => user.id === currentUserId && user.role === 'OWNER',
  );

  // Tab/dropdown options
  const tabOptions = [
    { value: 'basic', label: 'Basic Info', icon: IconInfoCircle },
    { value: 'venue', label: 'Format & Venue', icon: IconMapPin },
    { value: 'branding', label: 'Branding & Hero', icon: IconPalette },
    { value: 'content', label: 'Content', icon: IconFileText },
    { value: 'networking', label: 'Networking', icon: IconUsers },
    ...(isOrgOwner ? [{ value: 'danger', label: 'Danger Zone', icon: IconAlertTriangle }] : []),
  ];

  // Get current tab icon for mobile dropdown
  const getCurrentIcon = () => {
    const current = tabOptions.find((tab) => tab.value === activeTab);
    return current ? <current.icon size={16} /> : null;
  };

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
            <Alert color='red' title='Error'>
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
          <Text c='dimmed' size='sm' className={styles.pageSubtitle}>
            Manage your event configuration and preferences
          </Text>
        </section>

        {/* Main Content Section */}
        <section className={styles.mainContent}>
          {/* Mobile View Selector - Only visible on mobile */}
          {isMobile && (
            <div className={styles.mobileViewSelector}>
              <Select
                value={activeTab}
                onChange={setActiveTab}
                data={tabOptions.map((tab) => ({
                  value: tab.value,
                  label: tab.label,
                }))}
                leftSection={getCurrentIcon()}
                rightSection={<IconChevronDown size={16} />}
                className={styles.mobileSelect}
                classNames={{
                  input: styles.mobileSelectInput,
                  dropdown: styles.mobileSelectDropdown,
                }}
                searchable={false}
                allowDeselect={false}
              />
            </div>
          )}

          {/* Desktop Tabs - Hidden on mobile */}
          <Tabs value={activeTab} onChange={setActiveTab} className={styles.tabsContainer}>
            {!isMobile && (
              <Tabs.List className={styles.tabsList}>
                {tabOptions.map((tab) => (
                  <Tabs.Tab
                    key={tab.value}
                    value={tab.value}
                    className={styles.tab}
                    leftSection={<tab.icon size={16} />}
                  >
                    {tab.label}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            )}

            <Tabs.Panel value='basic' className={styles.tabPanel}>
              <BasicInfoSection event={event} eventId={parseInt(eventId)} />
            </Tabs.Panel>

            <Tabs.Panel value='venue' className={styles.tabPanel}>
              <VenueSection event={event} eventId={parseInt(eventId)} />
            </Tabs.Panel>

            <Tabs.Panel value='branding' className={styles.tabPanel}>
              <BrandingSection event={event} eventId={parseInt(eventId)} />
            </Tabs.Panel>

            <Tabs.Panel value='content' className={styles.tabPanel}>
              <ContentSections event={event} eventId={parseInt(eventId)} />
            </Tabs.Panel>

            <Tabs.Panel value='networking' className={styles.tabPanel}>
              <NetworkingSection event={event} eventId={parseInt(eventId)} />
            </Tabs.Panel>

            {isOrgOwner && (
              <Tabs.Panel value='danger' className={styles.tabPanel}>
                <DangerZoneSection event={event} />
              </Tabs.Panel>
            )}
          </Tabs>
        </section>
      </div>
    </div>
  );
};

export default EventSettings;
