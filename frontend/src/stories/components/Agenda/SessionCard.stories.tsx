import type { Meta, StoryObj } from '@storybook/react';
import { SessionCard } from '../../../pages/Agenda/SessionCard';

// Mock data as a separate object for reuse in stories
const mockSpeakers = [
  {
    id: 1,
    name: 'Sarah Chen',
    title: 'Principal Engineer',
    company_name: 'Netflix',
    role: 'HOST',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    social_links: {
      linkedin: 'https://linkedin.com/in/sarahchen',
      website: 'https://sarahchen.dev',
    },
  },
  {
    id: 2,
    name: 'Marcus Rodriguez',
    title: 'Tech Lead',
    company_name: 'Stripe',
    role: 'KEYNOTE',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    social_links: {
      linkedin: 'https://linkedin.com/in/marcusrodriguez',
    },
  },
];

const meta = {
  title: 'Agenda/SessionCard',
  component: SessionCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    session_type: {
      control: 'select',
      options: ['KEYNOTE', 'WORKSHOP', 'PANEL', 'PRESENTATION', 'QA'],
      description: 'Type of session',
    },
    speakers: {
      control: 'object',
      description: 'Array of speakers',
    },
  },
  args: {
    speakers: mockSpeakers,
  },
} satisfies Meta<typeof SessionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShortDescription: Story = {
  args: {
    title: 'Quick Status Update',
    session_type: 'PRESENTATION',
    start_time: '9:00 AM',
    end_time: '9:30 AM',
    description: 'Brief project status and roadmap review.',
    speakers: [mockSpeakers[0]],
  },
};
export const MediumDescription: Story = {
  args: {
    title: 'The Future of AI in Development',
    session_type: 'PANEL',
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    description:
      'Industry experts discuss the impact of AI on software development practices and explore upcoming trends in AI-assisted development.',
    speakers: mockSpeakers,
  },
};

export const LongDescription: Story = {
  args: {
    title: 'Advanced React Patterns Workshop',
    session_type: 'WORKSHOP',
    start_time: '11:00 AM',
    end_time: '12:30 PM',
    description:
      "Deep dive into advanced React patterns and best practices. We'll cover complex hooks patterns, performance optimization techniques, state management strategies, and real-world application architecture. Bring your laptop for hands-on exercises working with these patterns in a practical context.",
    speakers: [mockSpeakers[1]],
  },
};

export const Keynote: Story = {
  args: {
    title: 'Opening Keynote: Future of Full-Stack Development',
    session_type: 'KEYNOTE',
    start_time: '9:00 AM',
    end_time: '10:00 AM',
    description:
      'Opening keynote discussing the latest trends in full-stack development and what to expect in 2024',
    speakers: [mockSpeakers[0]],
  },
};

export const Panel: Story = {
  args: {
    title: 'The Future of AI in Development',
    session_type: 'PANEL',
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    description:
      'Industry experts discuss the impact of AI on software development practices',
    speakers: mockSpeakers,
  },
};

export const NoSpeakers: Story = {
  args: {
    title: 'Networking Break',
    session_type: 'NETWORKING',
    start_time: '12:00 PM',
    end_time: '1:00 PM',
    description: 'Connect with fellow developers over lunch',
    speakers: [],
  },
};

export const Playground: Story = {
  args: {
    title: 'Customizable Session',
    session_type: 'WORKSHOP',
    start_time: '2:00 PM',
    end_time: '4:00 PM',
    description:
      'This is a playground story where you can test different configurations',
    speakers: mockSpeakers,
  },
  parameters: {
    docs: {
      description: {
        story: 'Use the controls to experiment with different configurations',
      },
    },
  },
};
