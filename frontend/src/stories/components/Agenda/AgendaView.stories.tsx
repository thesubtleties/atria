// src/stories/components/Agenda/AgendaView.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import AgendaView from '../../../pages/Agenda/AgendaView';

// Mock speakers first for reuse
const mockSpeakers = {
  sarahChen: {
    id: 1,
    name: 'Sarah Chen',
    title: 'Principal Engineer @ Netflix',
    role: 'HOST',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
  marcusRodriguez: {
    id: 2,
    name: 'Marcus Rodriguez',
    title: 'Tech Lead @ Stripe',
    role: 'SPEAKER',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
  },
  emilyJohnson: {
    id: 3,
    name: 'Emily Johnson',
    title: 'Senior Engineer @ GitHub',
    role: 'SPEAKER',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
  },
  davidKim: {
    id: 4,
    name: 'David Kim',
    title: 'AI Research Lead @ OpenAI',
    role: 'PANELIST',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
  },
  lisaChen: {
    id: 5,
    name: 'Lisa Chen',
    title: 'ML Engineer @ Google',
    role: 'MODERATOR',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
  },
  michaelPark: {
    id: 6,
    name: 'Michael Park',
    title: 'TypeScript Core Team @ Microsoft',
    role: 'SPEAKER',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
  },
  janeSmith: {
    id: 7,
    name: 'Jane Smith',
    title: 'Distinguished Engineer @ Amazon',
    role: 'KEYNOTE',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
  },
  bobWilson: {
    id: 8,
    name: 'Bob Wilson',
    title: 'VP of Engineering @ Meta',
    role: 'PANELIST',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
  },
  aliceJohnson: {
    id: 9,
    name: 'Alice Johnson',
    title: 'Cloud Architect @ AWS',
    role: 'SPEAKER',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
  },
  tomBrown: {
    id: 10,
    name: 'Tom Brown',
    title: 'Security Engineer @ CloudFlare',
    role: 'SPEAKER',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom',
  },
  carolZhang: {
    id: 11,
    name: 'Carol Zhang',
    title: 'Developer Advocate @ Google',
    role: 'HOST',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
  },
};
const extraMockSpeakers = {
  rayDalio: {
    id: 12,
    name: 'Ray Dalio',
    title: 'Senior Architect @ MongoDB',
    role: 'SPEAKER',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ray',
  },
  samGreen: {
    id: 13,
    name: 'Sam Green',
    title: 'Platform Engineer @ Databricks',
    role: 'SPEAKER',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
  },
  lucyZhang: {
    id: 14,
    name: 'Lucy Zhang',
    title: 'Staff Engineer @ Uber',
    role: 'SPEAKER',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy',
  },
};
// Mock sessions
const mockSessions = {
  keynote: {
    id: 1,
    title: 'Opening Keynote: Future of Full-Stack Development',
    session_type: 'KEYNOTE',
    start_time: '9:00 AM',
    end_time: '10:00 AM',
    description:
      'Opening keynote discussing the latest trends in full-stack development and what to expect in 2024',
    speakers: [mockSpeakers.sarahChen],
  },
  reactWorkshop: {
    id: 2,
    title: 'React Performance Optimization',
    session_type: 'WORKSHOP',
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    description: 'Learn advanced techniques for optimizing React applications',
    speakers: [mockSpeakers.marcusRodriguez],
  },
  graphqlTalk: {
    id: 3,
    title: 'GraphQL Best Practices',
    session_type: 'PRESENTATION',
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    description: 'Deep dive into GraphQL schema design and performance optimization strategies',
    speakers: [mockSpeakers.emilyJohnson],
  },
  aiPanel: {
    id: 4,
    title: 'The Future of AI in Development',
    session_type: 'PANEL',
    start_time: '11:00 AM',
    end_time: '12:00 PM',
    description: 'Industry experts discuss the impact of AI on software development practices',
    speakers: [mockSpeakers.davidKim, mockSpeakers.lisaChen],
  },
  lunch: {
    id: 5,
    title: 'Lunch & Networking',
    session_type: 'NETWORKING',
    start_time: '12:00 PM',
    end_time: '1:00 PM',
    description: 'Connect with fellow developers over lunch',
    speakers: [],
  },
  typescriptWorkshop: {
    id: 6,
    title: 'Advanced TypeScript Patterns',
    session_type: 'WORKSHOP',
    start_time: '1:00 PM',
    end_time: '3:00 PM',
    description: 'Hands-on workshop covering advanced TypeScript features and design patterns',
    speakers: [mockSpeakers.michaelPark],
  },
  qa: {
    id: 7,
    title: 'Developer Q&A',
    session_type: 'QA',
    start_time: '3:00 PM',
    end_time: '4:00 PM',
    description: 'Open Q&A session with our expert panel',
    speakers: [mockSpeakers.sarahChen, mockSpeakers.marcusRodriguez, mockSpeakers.davidKim],
  },
  complexPanel: {
    id: 8,
    title: 'Future of Cloud Computing',
    session_type: 'PANEL',
    start_time: '2:00 PM',
    end_time: '3:00 PM',
    description: 'Industry leaders discuss the evolution of cloud computing and emerging trends',
    speakers: [
      mockSpeakers.carolZhang, // HOST
      mockSpeakers.lisaChen, // MODERATOR
      mockSpeakers.bobWilson, // PANELIST
      mockSpeakers.davidKim, // PANELIST
      mockSpeakers.aliceJohnson, // SPEAKER
    ],
  },

  multiSpeakerWorkshop: {
    id: 9,
    title: 'Full-Stack Development Workshop',
    session_type: 'WORKSHOP',
    start_time: '10:00 AM',
    end_time: '12:00 PM',
    description: 'Comprehensive workshop covering modern full-stack development practices',
    speakers: [
      mockSpeakers.marcusRodriguez, // SPEAKER
      mockSpeakers.emilyJohnson, // SPEAKER
      mockSpeakers.aliceJohnson, // SPEAKER
      mockSpeakers.tomBrown, // SPEAKER
    ],
  },

  dualKeynote: {
    id: 10,
    title: 'Opening Ceremonies',
    session_type: 'KEYNOTE',
    start_time: '9:00 AM',
    end_time: '10:00 AM',
    description: 'Conference opening featuring industry leaders',
    speakers: [
      mockSpeakers.carolZhang, // HOST
      mockSpeakers.janeSmith, // KEYNOTE
      mockSpeakers.sarahChen, // HOST
    ],
  },

  megaPanel: {
    id: 11,
    title: 'State of Tech Industry',
    session_type: 'PANEL',
    start_time: '1:00 PM',
    end_time: '2:30 PM',
    description: 'Comprehensive discussion about current state and future of tech industry',
    speakers: [
      mockSpeakers.carolZhang, // HOST
      mockSpeakers.lisaChen, // MODERATOR
      mockSpeakers.bobWilson, // PANELIST
      mockSpeakers.davidKim, // PANELIST
      mockSpeakers.aliceJohnson, // SPEAKER
      mockSpeakers.tomBrown, // SPEAKER
      mockSpeakers.michaelPark, // SPEAKER
    ],
  },
};
const extraMockSessions = {
  fiveSpeakerPanel: {
    id: 14,
    title: 'Five Speaker Panel',
    session_type: 'PANEL',
    start_time: '2:00 PM',
    end_time: '3:00 PM',
    description: 'Testing layout with exactly 5 speakers of the same role',
    speakers: [
      mockSpeakers.marcusRodriguez,
      mockSpeakers.emilyJohnson,
      mockSpeakers.aliceJohnson,
      mockSpeakers.tomBrown,
      extraMockSpeakers.rayDalio,
    ].map((s) => ({ ...s, role: 'SPEAKER' })), // Make all speakers same role
  },

  sixSpeakerPanel: {
    id: 15,
    title: 'Six Speaker Panel',
    session_type: 'PANEL',
    start_time: '3:00 PM',
    end_time: '4:00 PM',
    description: 'Testing layout with exactly 6 speakers of the same role',
    speakers: [
      mockSpeakers.marcusRodriguez,
      mockSpeakers.emilyJohnson,
      mockSpeakers.aliceJohnson,
      mockSpeakers.tomBrown,
      extraMockSpeakers.rayDalio,
      extraMockSpeakers.samGreen,
    ].map((s) => ({ ...s, role: 'SPEAKER' })),
  },

  sevenSpeakerPanel: {
    id: 16,
    title: 'Seven Speaker Panel',
    session_type: 'PANEL',
    start_time: '4:00 PM',
    end_time: '5:00 PM',
    description: 'Testing layout with exactly 7 speakers of the same role',
    speakers: [
      mockSpeakers.marcusRodriguez,
      mockSpeakers.emilyJohnson,
      mockSpeakers.aliceJohnson,
      mockSpeakers.tomBrown,
      extraMockSpeakers.rayDalio,
      extraMockSpeakers.samGreen,
      extraMockSpeakers.lucyZhang,
    ].map((s) => ({ ...s, role: 'SPEAKER' })),
  },
};
const concurrentMockSessions = {
  session1: {
    id: 17,
    title: 'Frontend Architecture',
    session_type: 'WORKSHOP',
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    description: 'Modern frontend architecture patterns',
    speakers: [mockSpeakers.marcusRodriguez],
  },
  session2: {
    id: 18,
    title: 'Backend Scalability',
    session_type: 'PRESENTATION',
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    description: 'Scaling backend services effectively',
    speakers: [mockSpeakers.emilyJohnson],
  },
  session3: {
    id: 19,
    title: 'DevOps Best Practices',
    session_type: 'WORKSHOP',
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    description: 'Modern DevOps workflows and tools',
    speakers: [mockSpeakers.tomBrown],
  },
  session4: {
    id: 20,
    title: 'Cloud Native Development',
    session_type: 'PRESENTATION',
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    description: 'Building cloud native applications',
    speakers: [mockSpeakers.aliceJohnson],
  },
  session5: {
    id: 21,
    title: 'API Design Patterns',
    session_type: 'WORKSHOP',
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    description: 'Designing robust and scalable APIs',
    speakers: [mockSpeakers.michaelPark],
  },
  session6: {
    id: 22,
    title: 'Security Best Practices',
    session_type: 'PRESENTATION',
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    description: 'Modern security practices for developers',
    speakers: [extraMockSpeakers.rayDalio],
  },
  session7: {
    id: 23,
    title: 'Database Optimization',
    session_type: 'WORKSHOP',
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    description: 'Optimizing database performance',
    speakers: [extraMockSpeakers.samGreen],
  },
};

const meta = {
  title: 'Agenda/AgendaView',
  component: AgendaView,
  parameters: {
    layout: 'padded',
  },
  layout: {
    width: '1200px',
  },
  tags: ['autodocs'],
  argTypes: {
    sessions: {
      control: 'object',
      description: 'Array of session objects',
    },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof AgendaView>;

export default meta;
type Story = StoryObj<typeof meta>;

// Simple story with just keynote
export const SingleKeynote: Story = {
  args: {
    sessions: [mockSessions.keynote],
  },
};

// Story with concurrent sessions
export const ConcurrentSessions: Story = {
  args: {
    sessions: [mockSessions.reactWorkshop, mockSessions.graphqlTalk],
  },
};

// Morning sessions only
export const MorningSessions: Story = {
  args: {
    sessions: [
      mockSessions.keynote,
      mockSessions.reactWorkshop,
      mockSessions.graphqlTalk,
      mockSessions.aiPanel,
    ],
  },
};

// Afternoon sessions only
export const AfternoonSessions: Story = {
  args: {
    sessions: [mockSessions.lunch, mockSessions.typescriptWorkshop, mockSessions.qa],
  },
};

// Full day
export const FullDay: Story = {
  args: {
    sessions: Object.values(mockSessions),
  },
};

export const ComplexSpeakers: Story = {
  args: {
    sessions: [
      mockSessions.dualKeynote,
      mockSessions.multiSpeakerWorkshop,
      mockSessions.complexPanel,
    ],
  },
};

export const MegaPanel: Story = {
  args: {
    sessions: [mockSessions.megaPanel],
  },
};

export const AllSessionTypes: Story = {
  args: {
    sessions: [
      mockSessions.dualKeynote,
      mockSessions.multiSpeakerWorkshop,
      mockSessions.lunch,
      mockSessions.complexPanel,
      mockSessions.megaPanel,
      mockSessions.qa,
    ],
  },
};

// Update ComplexLayout to include more speaker variations
export const ComplexLayout: Story = {
  args: {
    sessions: [
      mockSessions.dualKeynote,
      mockSessions.multiSpeakerWorkshop,
      mockSessions.complexPanel,
      {
        ...mockSessions.typescriptWorkshop,
        id: 12,
        start_time: '10:00 AM',
        end_time: '11:00 AM',
      },
      {
        ...mockSessions.megaPanel,
        id: 13,
        start_time: '10:00 AM',
        end_time: '11:00 AM',
      },
    ],
  },
};

export const FiveSpeakers: Story = {
  args: {
    sessions: [extraMockSessions.fiveSpeakerPanel],
  },
};

export const SixSpeakers: Story = {
  args: {
    sessions: [extraMockSessions.sixSpeakerPanel],
  },
};

export const SevenSpeakers: Story = {
  args: {
    sessions: [extraMockSessions.sevenSpeakerPanel],
  },
};

export const MultipleWrappingSessions: Story = {
  args: {
    sessions: [
      extraMockSessions.fiveSpeakerPanel,
      extraMockSessions.sixSpeakerPanel,
      extraMockSessions.sevenSpeakerPanel,
    ],
  },
};
export const FiveConcurrentSessions: Story = {
  args: {
    sessions: [
      concurrentMockSessions.session1,
      concurrentMockSessions.session2,
      concurrentMockSessions.session3,
      concurrentMockSessions.session4,
      concurrentMockSessions.session5,
    ],
  },
};

export const SixConcurrentSessions: Story = {
  args: {
    sessions: [
      concurrentMockSessions.session1,
      concurrentMockSessions.session2,
      concurrentMockSessions.session3,
      concurrentMockSessions.session4,
      concurrentMockSessions.session5,
      concurrentMockSessions.session6,
    ],
  },
};

export const SevenConcurrentSessions: Story = {
  args: {
    sessions: [
      concurrentMockSessions.session1,
      concurrentMockSessions.session2,
      concurrentMockSessions.session3,
      concurrentMockSessions.session4,
      concurrentMockSessions.session5,
      concurrentMockSessions.session6,
      concurrentMockSessions.session7,
    ],
  },
};

export const ComplexTimeSlot: Story = {
  args: {
    sessions: [mockSessions.keynote, ...Object.values(concurrentMockSessions), mockSessions.lunch],
  },
};
