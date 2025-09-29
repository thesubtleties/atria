import { useState, useMemo } from 'react';
import { Tabs, Badge, Center, Text, LoadingOverlay, Select } from '@mantine/core';
import { IconFileText, IconGlobe, IconArchive, IconCalendar, IconPlus, IconChevronDown } from '@tabler/icons-react';
import { useGetEventsQuery } from '../../../../app/features/events/api';
import { Button } from '../../../../shared/components/buttons';
import { EventModal } from '../../../../shared/components/modals/event/EventModal';
import EventCard from './EventCard';
import styles from './styles/index.module.css';

const EventsSection = ({ orgId, currentUserRole }) => {
  const [activeTab, setActiveTab] = useState('published');
  // TODO: Implement pagination UI - currently only showing first 12 events per status
  // eslint-disable-next-line no-unused-vars
  const [page, setPage] = useState(1);
  const [eventModalOpened, setEventModalOpened] = useState(false);
  const perPage = 12;
  
  const canCreateEvent = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const { data, isLoading, error } = useGetEventsQuery({
    orgId,
    page,
    per_page: perPage,
  });


  // Group and sort events by status
  const groupedEvents = useMemo(() => {
    if (!data?.events) return { draft: [], published: [], archived: [] };

    const groups = {
      draft: [],
      published: [],
      archived: [],
    };

    data.events.forEach(event => {
      const status = event.status?.toLowerCase() || 'draft';
      if (groups[status]) {
        groups[status].push(event);
      }
    });

    // Sort events
    // Draft and Published: by start_date ascending (soonest first)
    groups.draft.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    groups.published.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    
    // Archived: by start_date descending (most recent first)
    groups.archived.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

    return groups;
  }, [data?.events]);

  const tabConfigs = [
    {
      value: 'published',
      label: 'Published',
      icon: IconGlobe,
      color: 'green',
    },
    {
      value: 'draft',
      label: 'Draft',
      icon: IconFileText,
      color: 'yellow',
    },
    {
      value: 'archived',
      label: 'Archived',
      icon: IconArchive,
      color: 'gray',
    },
  ];

  // Get current tab info for mobile dropdown
  const currentTab = tabConfigs.find(tab => tab.value === activeTab);
  const CurrentIcon = currentTab?.icon;

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (error) {
    return (
      <Center className={styles.emptyState}>
        <Text color="red">Failed to load events</Text>
      </Center>
    );
  }

  const currentEvents = groupedEvents[activeTab] || [];

  return (
    <section className={styles.eventsSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Organization Events</h2>
        {canCreateEvent && (
          <Button
            variant="primary"
            onClick={() => setEventModalOpened(true)}
          >
            <IconPlus size={18} style={{ marginRight: '0.5rem' }} />
            Add Event
          </Button>
        )}
      </div>

      {/* Mobile Dropdown - Only visible on mobile */}
      <div className={styles.mobileTabSelector}>
        <Select
          value={activeTab}
          onChange={setActiveTab}
          data={tabConfigs.map(tab => ({
            value: tab.value,
            label: `${tab.label} (${groupedEvents[tab.value].length})`
          }))}
          leftSection={CurrentIcon && <CurrentIcon size={16} />}
          rightSection={<IconChevronDown size={16} />}
          className={styles.mobileSelect}
          classNames={{
            input: styles.mobileSelectInput,
            dropdown: styles.mobileSelectDropdown
          }}
          placeholder="Select Event Status"
          searchable={false}
          allowDeselect={false}
        />
      </div>

      <Tabs 
        value={activeTab} 
        onChange={setActiveTab}
        className={styles.tabsContainer}
      >
        {/* Desktop Tabs - Hidden on mobile */}
        <Tabs.List className={styles.tabsList}>
          {tabConfigs.map(({ value, label, icon: Icon, color }) => (
            <Tabs.Tab 
              key={value}
              value={value}
              leftSection={<Icon size={16} />}
              rightSection={
                groupedEvents[value].length > 0 && (
                  <Badge 
                    size="sm" 
                    variant="light" 
                    color={color}
                    className={styles.countBadge}
                  >
                    {groupedEvents[value].length}
                  </Badge>
                )
              }
              className={styles.tab}
            >
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value={activeTab} className={styles.tabPanel}>
          {currentEvents.length === 0 ? (
            <Center className={styles.emptyState}>
              <div className={styles.emptyContent}>
                <IconCalendar size={48} color="#94a3b8" stroke={1.5} />
                <Text size="lg" weight={500} color="dimmed" mt="md">
                  No {activeTab} events
                </Text>
                <Text size="sm" color="dimmed" mt="xs">
                  {activeTab === 'draft' && 'Draft events will appear here'}
                  {activeTab === 'published' && 'Published events will appear here'}
                  {activeTab === 'archived' && 'Archived events will appear here'}
                </Text>
              </div>
            </Center>
          ) : (
            <div className={styles.eventsGrid}>
              {currentEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                />
              ))}
            </div>
          )}
        </Tabs.Panel>
      </Tabs>
      
      <EventModal
        orgId={orgId}
        opened={eventModalOpened}
        onClose={() => setEventModalOpened(false)}
        allowConferences={true}
      />
    </section>
  );
};

export default EventsSection;