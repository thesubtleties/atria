import { useState, useMemo } from 'react';
import { Tabs, Badge, Center, Text, LoadingOverlay, Select } from '@mantine/core';
import {
  IconFileText,
  IconGlobe,
  IconArchive,
  IconCalendar,
  IconPlus,
  IconChevronDown,
} from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';
import { useGetEventsQuery } from '@/app/features/events/api';
import { Button } from '@/shared/components/buttons';
import { EventModal } from '@/shared/components/modals/event/EventModal';
import { parseDateOnly } from '@/shared/hooks/formatDate';
import EventCard from './EventCard';
import { cn } from '@/lib/cn';
import styles from './styles/index.module.css';
import type { OrganizationUserRole } from '@/types';

type EventsSectionProps = {
  orgId?: string | undefined;
  currentUserRole: OrganizationUserRole;
};

type Event = {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  status?: string;
  event_type?: string;
  attendee_count?: number;
};

type EventsResponse = {
  events?: Event[];
};

type TabConfig = {
  value: string;
  label: string;
  icon: Icon;
  color: string;
};

type GroupedEvents = {
  draft: Event[];
  published: Event[];
  archived: Event[];
};

const EventsSection = ({ orgId, currentUserRole }: EventsSectionProps) => {
  const [activeTab, setActiveTab] = useState<string | null>('published');
  const [page] = useState(1);
  const [eventModalOpened, setEventModalOpened] = useState(false);
  const perPage = 12;

  const canCreateEvent = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const parsedOrgId = orgId ? parseInt(orgId) : 0;

  const { data, isLoading, error } = useGetEventsQuery(
    {
      orgId: parsedOrgId,
      page,
      per_page: perPage,
    },
    { skip: !orgId },
  );

  const typedData = data as EventsResponse | undefined;

  // Group and sort events by status
  const groupedEvents = useMemo((): GroupedEvents => {
    if (!typedData?.events) return { draft: [], published: [], archived: [] };

    const groups: GroupedEvents = {
      draft: [],
      published: [],
      archived: [],
    };

    typedData.events.forEach((event) => {
      const status = (event.status?.toLowerCase() || 'draft') as keyof GroupedEvents;
      if (groups[status]) {
        groups[status].push(event);
      }
    });

    // Sort events
    groups.draft.sort(
      (a, b) =>
        (parseDateOnly(a.start_date)?.getTime() ?? 0) -
        (parseDateOnly(b.start_date)?.getTime() ?? 0),
    );
    groups.published.sort(
      (a, b) =>
        (parseDateOnly(a.start_date)?.getTime() ?? 0) -
        (parseDateOnly(b.start_date)?.getTime() ?? 0),
    );
    groups.archived.sort(
      (a, b) =>
        (parseDateOnly(b.start_date)?.getTime() ?? 0) -
        (parseDateOnly(a.start_date)?.getTime() ?? 0),
    );

    return groups;
  }, [typedData?.events]);

  const tabConfigs: TabConfig[] = [
    { value: 'published', label: 'Published', icon: IconGlobe, color: 'green' },
    { value: 'draft', label: 'Draft', icon: IconFileText, color: 'yellow' },
    { value: 'archived', label: 'Archived', icon: IconArchive, color: 'gray' },
  ];

  const currentTab = tabConfigs.find((tab) => tab.value === activeTab);
  const CurrentIcon = currentTab?.icon;

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (error) {
    return (
      <Center className={cn(styles.emptyState)}>
        <Text c='red'>Failed to load events</Text>
      </Center>
    );
  }

  const currentEvents = activeTab ? groupedEvents[activeTab as keyof GroupedEvents] || [] : [];

  return (
    <section className={cn(styles.eventsSection)}>
      <div className={cn(styles.sectionHeader)}>
        <h2 className={cn(styles.sectionTitle)}>Organization Events</h2>
        {canCreateEvent && (
          <Button variant='primary' onClick={() => setEventModalOpened(true)}>
            <IconPlus size={18} style={{ marginRight: '0.5rem' }} />
            Add Event
          </Button>
        )}
      </div>

      {/* Mobile Dropdown */}
      <div className={cn(styles.mobileTabSelector)}>
        <Select
          value={activeTab}
          onChange={setActiveTab}
          data={tabConfigs.map((tab) => ({
            value: tab.value,
            label: `${tab.label} (${groupedEvents[tab.value as keyof GroupedEvents].length})`,
          }))}
          leftSection={CurrentIcon && <CurrentIcon size={16} />}
          rightSection={<IconChevronDown size={16} />}
          className={cn(styles.mobileSelect)}
          classNames={{
            input: cn(styles.mobileSelectInput),
            dropdown: cn(styles.mobileSelectDropdown),
          }}
          placeholder='Select Event Status'
          searchable={false}
          allowDeselect={false}
        />
      </div>

      <Tabs value={activeTab} onChange={setActiveTab} className={cn(styles.tabsContainer)}>
        <Tabs.List className={cn(styles.tabsList)}>
          {tabConfigs.map(({ value, label, icon: TabIcon, color }) => (
            <Tabs.Tab
              key={value}
              value={value}
              leftSection={<TabIcon size={16} />}
              rightSection={
                groupedEvents[value as keyof GroupedEvents].length > 0 && (
                  <Badge size='sm' variant='light' color={color} className={cn(styles.countBadge)}>
                    {groupedEvents[value as keyof GroupedEvents].length}
                  </Badge>
                )
              }
              className={cn(styles.tab)}
            >
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value={activeTab || 'published'} className={cn(styles.tabPanel)}>
          {currentEvents.length === 0 ?
            <Center className={cn(styles.emptyState)}>
              <div className={cn(styles.emptyContent)}>
                <IconCalendar size={48} color='#94a3b8' stroke={1.5} />
                <Text size='lg' fw={500} c='dimmed' mt='md'>
                  No {activeTab} events
                </Text>
                <Text size='sm' c='dimmed' mt='xs'>
                  {activeTab === 'draft' && 'Draft events will appear here'}
                  {activeTab === 'published' && 'Published events will appear here'}
                  {activeTab === 'archived' && 'Archived events will appear here'}
                </Text>
              </div>
            </Center>
          : <div className={cn(styles.eventsGrid)}>
              {currentEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          }
        </Tabs.Panel>
      </Tabs>

      <EventModal
        orgId={parsedOrgId}
        opened={eventModalOpened}
        onClose={() => setEventModalOpened(false)}
        allowConferences={true}
      />
    </section>
  );
};

export default EventsSection;
