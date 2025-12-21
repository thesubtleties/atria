import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@mantine/hooks';
import { Tabs, Alert, Text, Select } from '@mantine/core';
import { LoadingOverlay } from '@/shared/components/loading';
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
import { cn } from '@/lib/cn';
import type { RootState } from '@/app/store';
import type { Event } from '@/types';
import type { OrganizationUserNested } from '@/types/organizations';
import BasicInfoSection from './BasicInfoSection';
import VenueSection from './VenueSection';
import BrandingSection from './BrandingSection';
import ContentSections from './ContentSections';
import NetworkingSection from './NetworkingSection';
import DangerZoneSection from './DangerZoneSection';
import styles from './styles/index.module.css';

type TabOption = {
  value: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.FC<any>;
};

const EventSettings = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const parsedEventId = eventId ? parseInt(eventId, 10) : undefined;
  const [activeTab, setActiveTab] = useState<string | null>('basic');
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const {
    data: event,
    isLoading,
    error,
  } = useGetEventQuery({ id: parsedEventId! }, { skip: !parsedEventId });

  // Fetch organization data to check user role
  const { data: organization } = useGetOrganizationQuery(
    (event as Event | undefined)?.organization_id ?? 0,
    {
      skip: !event?.organization_id,
    },
  );

  // Check if current user is org owner
  const isOrgOwner = (organization?.users as OrganizationUserNested[] | undefined)?.some(
    (user) => user.id === currentUserId && user.role === 'OWNER',
  );

  // Tab/dropdown options
  const tabOptions: TabOption[] = [
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
      <div className={cn(styles.container)}>
        <div className={cn(styles.bgShape1)} />
        <div className={cn(styles.bgShape2)} />
        <div className={cn(styles.contentWrapper)}>
          <LoadingOverlay visible />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(styles.container)}>
        <div className={cn(styles.bgShape1)} />
        <div className={cn(styles.bgShape2)} />
        <div className={cn(styles.contentWrapper)}>
          <section className={cn(styles.mainContent)}>
            <Alert color='red' title='Error'>
              Failed to load event settings. Please try again.
            </Alert>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(styles.container)}>
      {/* Background Shapes */}
      <div className={cn(styles.bgShape1)} />
      <div className={cn(styles.bgShape2)} />

      <div className={cn(styles.contentWrapper)}>
        {/* Header Section */}
        <section className={cn(styles.headerSection)}>
          <h1 className={cn(styles.pageTitle)}>Event Settings</h1>
          <Text c='dimmed' size='sm' className={cn(styles.pageSubtitle)}>
            Manage your event configuration and preferences
          </Text>
        </section>

        {/* Main Content Section */}
        <section className={cn(styles.mainContent)}>
          {/* Mobile View Selector - Only visible on mobile */}
          {isMobile && (
            <div className={cn(styles.mobileViewSelector)}>
              <Select
                value={activeTab}
                onChange={setActiveTab}
                data={tabOptions.map((tab) => ({
                  value: tab.value,
                  label: tab.label,
                }))}
                leftSection={getCurrentIcon()}
                rightSection={<IconChevronDown size={16} />}
                className={cn(styles.mobileSelect)}
                classNames={{
                  input: styles.mobileSelectInput ?? '',
                  dropdown: styles.mobileSelectDropdown ?? '',
                }}
                searchable={false}
                allowDeselect={false}
              />
            </div>
          )}

          {/* Desktop Tabs - Hidden on mobile */}
          <Tabs value={activeTab} onChange={setActiveTab} className={cn(styles.tabsContainer)}>
            {!isMobile && (
              <Tabs.List className={cn(styles.tabsList)}>
                {tabOptions.map((tab) => (
                  <Tabs.Tab
                    key={tab.value}
                    value={tab.value}
                    className={cn(styles.tab)}
                    leftSection={<tab.icon size={16} />}
                  >
                    {tab.label}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            )}

            <Tabs.Panel value='basic' className={cn(styles.tabPanel)}>
              <BasicInfoSection event={event as Event} eventId={parsedEventId!} />
            </Tabs.Panel>

            <Tabs.Panel value='venue' className={cn(styles.tabPanel)}>
              <VenueSection event={event as Event} eventId={parsedEventId!} />
            </Tabs.Panel>

            <Tabs.Panel value='branding' className={cn(styles.tabPanel)}>
              <BrandingSection event={event as Event} eventId={parsedEventId!} />
            </Tabs.Panel>

            <Tabs.Panel value='content' className={cn(styles.tabPanel)}>
              <ContentSections event={event as Event} eventId={parsedEventId!} />
            </Tabs.Panel>

            <Tabs.Panel value='networking' className={cn(styles.tabPanel)}>
              <NetworkingSection event={event as Event} eventId={parsedEventId!} />
            </Tabs.Panel>

            {isOrgOwner && (
              <Tabs.Panel value='danger' className={cn(styles.tabPanel)}>
                <DangerZoneSection event={event as Event} />
              </Tabs.Panel>
            )}
          </Tabs>
        </section>
      </div>
    </div>
  );
};

export default EventSettings;
