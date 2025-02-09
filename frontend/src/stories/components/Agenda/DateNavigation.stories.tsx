// src/stories/components/DateNavigation/DateNavigation.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { DateNavigation } from '../../../pages/Agenda/DateNavigation';
import { useState } from 'react';

const meta = {
  title: 'Agenda/DateNavigation',
  component: DateNavigation,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    startDate: {
      control: 'date',
      description: 'Starting date of the conference',
    },
    dayCount: {
      control: { type: 'number', min: 1, max: 7 },
      description: 'Total number of conference days',
    },
    currentDay: {
      control: { type: 'number', min: 1, max: 7 },
      description: 'Current selected day number',
    },
  },
} satisfies Meta<typeof DateNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle state
const DateNavigationWrapper = (args: any) => {
  const [currentDay, setCurrentDay] = useState(args.currentDay);

  return (
    <DateNavigation
      {...args}
      currentDay={currentDay}
      onDateChange={setCurrentDay}
    />
  );
};

// Interactive stories using the wrapper
export const SingleDay: Story = {
  render: (args) => <DateNavigationWrapper {...args} />,
  args: {
    startDate: '2024-06-01',
    dayCount: 1,
    currentDay: 1,
  },
};

export const ThreeDayConference: Story = {
  render: (args) => <DateNavigationWrapper {...args} />,
  args: {
    startDate: '2024-06-01',
    dayCount: 3,
    currentDay: 1,
  },
};

export const WeekLongConference: Story = {
  render: (args) => <DateNavigationWrapper {...args} />,
  args: {
    startDate: '2024-06-01',
    dayCount: 7,
    currentDay: 4,
  },
};

export const CustomStartDate: Story = {
  render: (args) => <DateNavigationWrapper {...args} />,
  args: {
    startDate: '2024-12-25',
    dayCount: 3,
    currentDay: 1,
  },
};

export const Playground: Story = {
  render: (args) => <DateNavigationWrapper {...args} />,
  args: {
    startDate: '2024-06-01',
    dayCount: 5,
    currentDay: 3,
  },
};
