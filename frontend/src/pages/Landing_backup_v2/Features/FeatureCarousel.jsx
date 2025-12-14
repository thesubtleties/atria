// Landing/Features/FeatureCarousel.jsx
import { Carousel } from '@mantine/carousel';

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
import styles from './styles/FeatureCarousel.module.css';

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

export const FeatureCarousel = () => {
  // Determine how many slides to show at once based on screen size - media removed for now as this is an unused section

  return (
    <Carousel
      slideSize={{ base: '100%', sm: '50%', md: '33.333333%' }}
      slideGap={{ base: 'md', sm: 'lg' }}
      align='start'
      slidesToScroll={1}
      withControls
      withIndicators
      loop
      classNames={{
        root: styles.carouselRoot,
        controls: styles.carouselControls,
        indicators: styles.carouselIndicators,
      }}
    >
      {FEATURES_DATA.map((feature) => (
        <Carousel.Slide key={feature.title}>
          <FeatureCard
            title={feature.title}
            description={feature.description}
            icon={<feature.icon size={24} />}
            color={feature.color}
          />
        </Carousel.Slide>
      ))}
    </Carousel>
  );
};
