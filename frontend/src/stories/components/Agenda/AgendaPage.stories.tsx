// stories/components/Agenda/AgendaPage.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { AgendaPage } from '../../../pages/Agenda';
import { mockSessions } from './AgendaView.stories'; // Reuse existing session mocks

const mockEvent = {
  id: 1,
  title: 'Tech Conference 2025',
  start_date: '2025-02-08',
  end_date: '2025-02-10',
  day_count: 3,
  event_type: 'conference',
  status: 'draft',
  branding: {
    banner_url: null,
    logo_url: null,
    primary_color: '#000000',
    secondary_color: '#ffffff',
  },
  organization: {
    id: 1,
    name: 'Tech Corp',
  },
};

const meta = {
  title: 'Agenda/AgendaPage',
  component: AgendaPage,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof AgendaPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// Single day conference
export const SingleDay: Story = {
  args: {
    event: {
      ...mockEvent,
      day_count: 1,
      end_date: '2025-02-08',
    },
    sessions: [
      mockSessions.keynote,
      mockSessions.reactWorkshop,
      mockSessions.lunch,
      mockSessions.typescriptWorkshop,
    ],
  },
};

// Three day conference
export const ThreeDayConference: Story = {
  args: {
    event: {
      ...mockEvent,
      day_count: 3,
    },
    sessions: [
      // Day 1
      {
        ...mockSessions.keynote,
        start_time: '2025-02-08T09:00:00Z',
        end_time: '2025-02-08T10:00:00Z',
      },
      {
        ...mockSessions.reactWorkshop,
        start_time: '2025-02-08T10:00:00Z',
        end_time: '2025-02-08T12:00:00Z',
      },
      // Day 2
      {
        ...mockSessions.panel,
        start_time: '2025-02-09T09:00:00Z',
        end_time: '2025-02-09T10:30:00Z',
      },
      {
        ...mockSessions.lunch,
        start_time: '2025-02-09T12:00:00Z',
        end_time: '2025-02-09T13:00:00Z',
      },
      // Day 3
      {
        ...mockSessions.typescriptWorkshop,
        start_time: '2025-02-10T09:00:00Z',
        end_time: '2025-02-10T11:00:00Z',
      },
    ],
  },
};

// Conference with concurrent sessions
export const WithConcurrentSessions: Story = {
  args: {
    event: {
      ...mockEvent,
      day_count: 1,
    },
    sessions: [
      {
        ...mockSessions.keynote,
        start_time: '2025-02-08T09:00:00Z',
        end_time: '2025-02-08T10:00:00Z',
      },
      {
        ...mockSessions.reactWorkshop,
        start_time: '2025-02-08T10:00:00Z',
        end_time: '2025-02-08T11:00:00Z',
      },
      {
        ...mockSessions.graphqlTalk,
        start_time: '2025-02-08T10:00:00Z',
        end_time: '2025-02-08T11:00:00Z',
      },
    ],
  },
};

// Empty conference
export const EmptySchedule: Story = {
  args: {
    event: mockEvent,
    sessions: [],
  },
};

// Loading state (if implemented)
export const Loading: Story = {
  args: {
    event: mockEvent,
    sessions: undefined,
  },
};

// Error state (if implemented)
export const Error: Story = {
  args: {
    event: {
      ...mockEvent,
      start_date: null, // This should trigger error handling
    },
    sessions: [],
  },
};
