# Component Library Guide

This guide shows how to use the reusable components extracted from the landing page.

## Folder Structure

```
components/
├── animations/         # Reusable animation components
│   ├── BackgroundEffects/
│   ├── ScrollEffects/
│   └── TextEffects/
├── common/            # Common wrappers and utilities
│   └── Wrappers/
├── sections/          # Full section components
│   └── Hero/
├── ui/                # UI components
│   ├── Buttons/
│   ├── Cards/
│   │   ├── EventCard.jsx      # Individual event/session card
│   │   ├── FeatureCard.jsx    # Feature highlight card
│   │   ├── PlatformCard.jsx   # Platform/pricing card
│   │   └── TimeSlotCard.jsx   # Time-based schedule card
│   ├── Layouts/
│   ├── Navigation/
│   ├── NetworkVisualization/
│   ├── Stats/
│   ├── Testimonials/
│   └── Typography/
└── data/             # Data management components

```

## Component Examples

### 1. Hero Section

```jsx
import HeroSection from '@/components/sections/Hero/HeroSection'

// Basic usage
<HeroSection />

// Customized
<HeroSection 
  logo="your brand"
  taglinePrefix="welcome to"
  scrambleWords={['innovation', 'creativity', 'success']}
  ctaText="GET STARTED"
  navLinks={[
    { href: '/login', label: 'Login' },
    { href: '/register', label: 'Register' }
  ]}
/>
```

### 2. Animated Typography

#### ScrambleText
```jsx
import ScrambleText from '@/components/ui/Typography/ScrambleText'

<ScrambleText 
  words={['create', 'build', 'innovate']}
  interval={2000}
  className="highlight-text"
/>
```

#### Reading Speed Reveal
```jsx
import ReadingSpeedReveal from '@/components/animations/TextEffects/ReadingSpeedReveal'

<ReadingSpeedReveal 
  text="Your important message here with highlighted words"
  highlightWords={['important', 'highlighted']}
  backgroundColor={{
    start: '#ffffff',
    end: '#8b5cf6'
  }}
/>
```

### 3. Stats Components

#### Stats Counter
```jsx
import StatsCounter from '@/components/ui/Stats/StatsCounter'
import AnimatedStatCard from '@/components/ui/Stats/AnimatedStatCard'

<StatsCounter 
  stats={{
    users: 10000,
    events: 500,
    satisfaction: 98
  }}
>
  {(animatedStats) => (
    <div className="stats-grid">
      <AnimatedStatCard 
        number={animatedStats.users}
        label="Active Users"
        icon="👥"
      />
      <AnimatedStatCard 
        number={animatedStats.events}
        label="Events Hosted"
        icon="🎉"
      />
      <AnimatedStatCard 
        number={animatedStats.satisfaction}
        label="% Satisfaction"
        icon="⭐"
        formatNumber={false}
      />
    </div>
  )}
</StatsCounter>
```

### 4. Navigation

```jsx
import NavBar from '@/components/ui/Navigation/NavBar'

<NavBar 
  links={[
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/contact', label: 'Contact' }
  ]}
  animated={true}
/>
```

### 5. Background Effects

```jsx
import FloatingShapes from '@/components/animations/BackgroundEffects/FloatingShapes'

// Use default shapes
<FloatingShapes />

// Custom shapes
<FloatingShapes 
  shapes={[
    {
      className: 'customShape1',
      animate: { x: [0, 50, 0], y: [0, -30, 0] },
      duration: 30,
      ease: 'easeInOut'
    }
  ]}
/>
```

### 6. Network Visualization

```jsx
import NetworkGraph from '@/components/ui/NetworkVisualization/NetworkGraph'

<NetworkGraph 
  nodes={[
    { cx: 100, cy: 100, r: 30, fill: '#8b5cf6', icon: '👤' },
    { cx: 300, cy: 100, r: 30, fill: '#fde047', icon: '👥' }
  ]}
  connections={[
    { x1: 100, y1: 100, x2: 300, y2: 100 }
  ]}
/>
```

### 7. Testimonials

```jsx
import TestimonialCard from '@/components/ui/Testimonials/TestimonialCard'

<TestimonialCard 
  quote="This platform changed how we connect at events."
  author={{
    name: "Jane Doe",
    title: "Event Organizer",
    avatar: "JD"
  }}
/>
```

### 8. Section Wrapper

```jsx
import SectionWrapper from '@/components/common/Wrappers/SectionWrapper'

<SectionWrapper 
  background="gradient-subtle"
  padding="large"
  overflow="hidden"
>
  {/* Your content */}
</SectionWrapper>
```

## Styling Notes

- All components use CSS Modules for scoped styling
- Components accept `className` prop for additional styling
- Uses CSS custom properties (variables) defined in globals.css
- Responsive by default with mobile-first approach

## Animation Notes

- Components using GSAP automatically handle cleanup
- ScrollTrigger animations are optimized for performance
- Motion components from Framer Motion provide smooth interactions
- All animations respect user's reduced motion preferences

## Best Practices

1. **Import only what you need** - Components are modular
2. **Customize through props** - Most components are highly configurable
3. **Combine components** - Mix and match to create new sections
4. **Maintain consistency** - Use the design system variables
5. **Test on mobile** - All components are responsive

## Card Components

### EventCard
Individual event or session card with expandable details:

```jsx
import EventCard from '@/components/ui/Cards/EventCard'

<EventCard
  title="Building Community Through Code"
  time="2:00 PM"
  duration="45 min"
  speakers={[
    { name: "Jane Doe", avatar: "JD" },
    { name: "John Smith", avatar: "JS" }
  ]}
  tags={["Workshop", "Technical"]}
  description="Learn how to foster open source communities"
/>
```

### FeatureCard
Compact feature highlight with icon:

```jsx
import FeatureCard from '@/components/ui/Cards/FeatureCard'

<FeatureCard
  icon="🚀"
  title="Lightning Fast"
  description="Built for speed and performance"
  hoverDirection="right"
/>
```

### PlatformCard
Full platform/pricing card with features list:

```jsx
import PlatformCard from '@/components/ui/Cards/PlatformCard'

<PlatformCard
  title="Open Source"
  subtitle="Free forever"
  icon="❤️"
  features={[
    "Full source code access",
    "Self-hosted option",
    "Community support"
  ]}
  ctaText="Get Started"
  variant="primary"
/>
```

### TimeSlotCard
Schedule time slot with status:

```jsx
import TimeSlotCard from '@/components/ui/Cards/TimeSlotCard'

<TimeSlotCard
  time="9:00 AM"
  title="Registration & Coffee"
  subtitle="Network with attendees"
  badge="Open"
  badgeColor="success"
/>
```

## Button Component

Flexible button with multiple variants:

```jsx
import Button from '@/components/ui/Buttons/Button'

// Primary button
<Button variant="primary" size="large">
  Get Started
</Button>

// With icon
<Button 
  variant="outline" 
  icon={<GitHubIcon />}
  iconPosition="left"
>
  View on GitHub
</Button>

// Full width
<Button variant="secondary" fullWidth>
  Continue
</Button>
```

## Layout Components

### AgendaLayout
Grid layout for agenda/schedule items:

```jsx
import AgendaLayout from '@/components/ui/Layouts/AgendaLayout'
import TimeSlotCard from '@/components/ui/Cards/TimeSlotCard'

<AgendaLayout columns={2} gap="medium">
  <TimeSlotCard time="9:00" title="Opening Keynote" />
  <TimeSlotCard time="10:00" title="Workshop Session 1" />
  <TimeSlotCard time="11:00" title="Coffee Break" />
  <TimeSlotCard time="11:30" title="Workshop Session 2" />
</AgendaLayout>
```

## Creating New Sections

Example of combining components to create an Audience section:

```jsx
import SectionWrapper from '@/components/common/Wrappers/SectionWrapper'
import FeatureCard from '@/components/ui/Cards/FeatureCard'
import AgendaLayout from '@/components/ui/Layouts/AgendaLayout'

const AudienceSection = () => {
  const audiences = [
    {
      icon: "👥",
      title: "Community Builders",
      description: "Create lasting connections in your community"
    },
    {
      icon: "🎯",
      title: "Event Organizers",
      description: "Streamline your event management"
    },
    {
      icon: "🚀",
      title: "Startups",
      description: "Build your network from day one"
    }
  ]

  return (
    <SectionWrapper background="gradient-subtle" padding="large">
      <h2>Who It's For</h2>
      
      <AgendaLayout columns={3} gap="large">
        {audiences.map((audience, index) => (
          <FeatureCard
            key={index}
            {...audience}
            delay={index * 0.1}
          />
        ))}
      </AgendaLayout>
    </SectionWrapper>
  )
}
```

Example of building an event schedule:

```jsx
import SectionWrapper from '@/components/common/Wrappers/SectionWrapper'
import EventCard from '@/components/ui/Cards/EventCard'
import TimeSlotCard from '@/components/ui/Cards/TimeSlotCard'
import AgendaLayout from '@/components/ui/Layouts/AgendaLayout'

const ScheduleSection = () => {
  const schedule = [
    {
      time: "9:00 AM",
      sessions: [
        {
          title: "Opening Keynote",
          subtitle: "The Future of Community",
          speakers: [{ name: "Sarah Chen", avatar: "SC" }],
          duration: "45 min"
        }
      ]
    },
    {
      time: "10:00 AM",
      sessions: [
        {
          title: "Building Open Source Communities",
          tags: ["Technical", "Workshop"],
          duration: "90 min"
        },
        {
          title: "Marketing for Developers",
          tags: ["Business", "Talk"],
          duration: "60 min"
        }
      ]
    }
  ]

  return (
    <SectionWrapper>
      <h2>Event Schedule</h2>
      
      {schedule.map((slot, index) => (
        <div key={index} className="time-slot">
          <TimeSlotCard 
            time={slot.time}
            title={`${slot.sessions.length} Sessions`}
          />
          
          <AgendaLayout columns={2} gap="medium">
            {slot.sessions.map((session, idx) => (
              <EventCard key={idx} {...session} />
            ))}
          </AgendaLayout>
        </div>
      ))}
    </SectionWrapper>
  )
}
```