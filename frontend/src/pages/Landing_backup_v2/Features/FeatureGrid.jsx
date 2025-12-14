// Landing/Features/FeatureGrid.jsx
import { SimpleGrid } from '@mantine/core';
import { FeatureCard } from './FeatureCard';
import {
  IconDeviceDesktop,
  IconMessages,
  IconLock,
  IconUsers,
  IconBrandZoom,
  IconCalendarEvent,
  IconBuildingStore,
  IconCode,
} from '@tabler/icons-react';

const FEATURES_DATA = [
  {
    title: 'Hybrid Connectivity',
    description:
      'Connect virtual and in-person attendees seamlessly. Everyone can participate regardless of location.',
    icon: IconDeviceDesktop,
    color: 'blue',
  },
  {
    title: 'Service Integration',
    description: 'Integrates with popular streaming platforms including Vimeo, DaCast, and Zoom.',
    icon: IconBrandZoom,
    color: 'indigo',
  },
  {
    title: 'Secure Messaging',
    description:
      'Direct messaging with end-to-end encryption coming soon. Connect with other attendees privately.',
    icon: IconMessages,
    color: 'violet',
  },
  {
    title: 'Persistent Networking',
    description:
      'Connections persist outside events, allowing continuous networking across multiple events.',
    icon: IconUsers,
    color: 'grape',
  },
  {
    title: 'Sponsor Showcase',
    description: 'Highlight sponsors in unique and valuable ways with customizable sponsor levels.',
    icon: IconBuildingStore,
    color: 'pink',
  },
  {
    title: 'Privacy Focus',
    description:
      'E2EE for private chats, transparent analytics, and no data selling. Control who can connect with you.',
    icon: IconLock,
    color: 'red',
  },
  {
    title: 'Smart Agenda',
    description:
      'Easy-to-use agenda that automatically organizes your sessions and personalizes your schedule.',
    icon: IconCalendarEvent,
    color: 'green',
  },
  {
    title: 'Open Source',
    description:
      'Self-host for personal and non-commercial events like weddings, graduations, and family gatherings.',
    icon: IconCode,
    color: 'teal',
  },
];

export const FeatureGrid = () => (
  <SimpleGrid
    cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
    spacing={{ base: 'md', md: 'lg' }}
    verticalSpacing={{ base: 'md', md: 'lg' }}
  >
    {FEATURES_DATA.map((feature) => (
      <FeatureCard
        key={feature.title}
        title={feature.title}
        description={feature.description}
        icon={<feature.icon size={24} />}
        color={feature.color}
      />
    ))}
  </SimpleGrid>
);
