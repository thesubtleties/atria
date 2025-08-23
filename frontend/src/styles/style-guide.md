# Atria Universal Design System Guide

> Complete developer guide for using Atria's design tokens and component patterns

## Table of Contents

- [Quick Start](#quick-start)
- [Design Tokens](#design-tokens)
- [Semantic Component Classes](#semantic-component-classes)
- [Usage Examples](#usage-examples)
- [Responsive Patterns](#responsive-patterns)
- [Component Patterns](#component-patterns)
- [Best Practices](#best-practices)

## Quick Start

### 1. Design tokens are globally available
Design tokens are automatically imported in `main.jsx`, so you can use them anywhere:

```css
.myComponent {
  background: var(--color-primary);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

### 2. Use semantic classes for common patterns
```css
.mySection {
  composes: section-container from '../../styles/design-tokens.css';
}

.myCard {
  composes: card-base from '../../styles/design-tokens.css';
}
```

### 3. Import shared Button component
```jsx
import { Button } from 'shared/components/buttons/Button';

<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>
```

## Design Tokens

### Colors

#### Brand Colors (from actual assets)
```css
var(--color-primary)        /* #8B5CF6 - Purple from wave-drape.svg */
var(--color-primary-hover)  /* #7C3AED - Darker purple for hover */
var(--color-accent-yellow)  /* #FFD666 - Yellow from atria-logo.svg */
```

#### Text Colors
```css
var(--color-text-primary)   /* #1E293B - Dark gray for headings */
var(--color-text-secondary) /* #64748B - Medium gray for body text */
var(--color-text-muted)     /* #94A3B8 - Light gray for meta info */
```

#### Background Colors
```css
var(--color-background)       /* #FBFAFF - Very light purple, almost white */
var(--color-background-glass) /* rgba(255, 255, 255, 0.8) - Glass effect */
```

#### Status Colors
```css
var(--color-success) /* #16A34A - Green */
var(--color-warning) /* #F59E0B - Amber */
var(--color-error)   /* #DC2626 - Red */
var(--color-info)    /* #06B6D4 - Teal */
```

#### Gradient Color Palette

**Purple Family (Primary Brand Colors)**
```css
var(--gradient-purple-light)  /* #8B5CF6 - Our brand purple */
var(--gradient-purple-medium) /* #A855F7 - Medium purple */
var(--gradient-purple-dark)   /* #7C3AED - Dark purple */
var(--gradient-purple-deep)   /* #6D28D9 - Deep purple */
```

**Orange/Yellow Family**
```css
var(--gradient-orange-bright) /* #FFD93D - Bright yellow (from logo) */
var(--gradient-orange-light)  /* #FCD34D - Light orange */
var(--gradient-orange-medium) /* #F59E0B - Medium orange */
var(--gradient-orange-dark)   /* #EAB308 - Dark orange */
```

**Usage Example**:
```css
.backgroundShape {
  background: linear-gradient(45deg, 
    var(--gradient-orange-medium), 
    var(--gradient-orange-dark)
  );
}
```

[Additional color families: Pink, Blue/Teal, Green, Red/Orange, Neutral - see design-tokens.css for complete list]

### Typography Scale
```css
var(--text-xs)   /* 0.75rem  - 12px */
var(--text-sm)   /* 0.875rem - 14px */
var(--text-base) /* 1rem     - 16px */
var(--text-lg)   /* 1.125rem - 18px */
var(--text-xl)   /* 1.25rem  - 20px */
var(--text-2xl)  /* 1.5rem   - 24px */
```

### Spacing Scale
```css
var(--space-xs)  /* 0.25rem - 4px */
var(--space-sm)  /* 0.5rem  - 8px */
var(--space-md)  /* 1rem    - 16px */
var(--space-lg)  /* 1.5rem  - 24px */
var(--space-xl)  /* 2rem    - 32px */
var(--space-2xl) /* 3rem    - 48px */
```

### Shadows (purple-tinted)
```css
var(--shadow-sm) /* 0 1px 2px rgba(139, 92, 246, 0.05) */
var(--shadow-md) /* 0 2px 8px rgba(139, 92, 246, 0.1) */
var(--shadow-lg) /* 0 4px 16px rgba(139, 92, 246, 0.15) */
var(--shadow-xl) /* 0 8px 32px rgba(139, 92, 246, 0.2) */
```

### Border Radius
```css
var(--radius-sm) /* 4px */
var(--radius-md) /* 6px */
var(--radius-lg) /* 8px */
```

## Semantic Component Classes

### Section Container
Base class for page sections with glassmorphism:

```css
.section-container {
  background: var(--color-background-glass);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  padding: clamp(var(--space-md), 4vw, var(--space-xl));
  box-shadow: var(--shadow-lg);
  /* Additional properties... */
}
```

**Usage:**
```css
.mySection {
  composes: section-container from '../../styles/design-tokens.css';
}
```

### Page Header Layout Pattern
Structured layout for management page headers with responsive mobile adaptation:

```css
/* Header container with glass effect */
.headerSection {
  background: var(--color-background-glass);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  padding: clamp(1.25rem, 3vw, 2rem);
  margin-bottom: clamp(1.25rem, 3vw, 2rem);
}

/* Flex wrapper for header content */
.headerContent {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: clamp(1rem, 3vw, 2rem);
  flex-wrap: wrap;
}

/* Left side: title and badges */
.headerLeft {
  flex: 1;
  min-width: 0; /* Prevent flex item overflow */
}

/* Right side: action buttons */
.headerRight {
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 1rem);
}

/* Mobile responsive (< 768px) */
@media (max-width: 768px) {
  .headerContent {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .headerLeft, .headerRight {
    width: 100%;
  }
  
  .headerRight {
    justify-content: center;
  }
}
```

**Usage Example:**
```jsx
<div className={styles.headerSection}>
  <div className={styles.headerContent}>
    <div className={styles.headerLeft}>
      <h1 className={styles.pageTitle}>Page Title</h1>
      <div className={styles.badgeGroup}>
        {/* Badge components */}
      </div>
    </div>
    <div className={styles.headerRight}>
      <Button>Action</Button>
    </div>
  </div>
</div>
```

### Section Header Layout
```css
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(1rem, 3vw, 2rem);
  /* ... */
}

.section-title {
  font-size: clamp(var(--text-lg), 3vw, var(--text-2xl));
  font-weight: 600;
  color: var(--color-text-primary);
  /* ... */
}
```

### Card System
```css
.card-base {
  background: var(--color-background-glass);
  border-radius: var(--radius-md);
  padding: clamp(var(--space-md), 3vw, var(--space-lg));
  box-shadow: var(--shadow-sm);
  /* Hover effects included... */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  /* ... */
}

.card-content {
  flex: 1;
  min-width: 0; /* Allow text truncation */
}

.card-title {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: clamp(var(--text-base), 2.5vw, var(--text-lg));
  /* ... */
}
```

**Important Note on Card Variations:**
Cards are currently implemented as context-specific custom components rather than a single modular system. Each card type is optimized for its specific use case:

- **AttendeeCard** (`EventAdmin/AttendeesManager`) - Adaptive for attendees/invitations, moderation actions
- **SpeakerCard** (`EventAdmin/SpeakersManager`) - Speaker role badges, session info
- **MemberCard** (`Organizations/OrganizationDashboard`) - Organization role management
- **ConnectionCard** (`Network`) - Large message button, social links, connection context
- **EventCard** (`Events/EventsList`) - Event type indicators, date ranges
- **OrganizationCard** - Organization-specific actions

Each card prioritizes different information and actions based on user needs in that context. Future consideration: Create a modular card system if pattern convergence emerges.

### Badge Composition System
Badge styling using CSS Modules composition pattern for consistent role and status indicators:

```css
/* In design-tokens.css */
.badge-base {
  padding: 6px 10px !important;
  border-radius: var(--radius-md) !important;
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  /* ... base properties */
}

/* Role-specific badges */
.badge-admin {
  background: rgba(59, 130, 246, 0.08) !important;
  color: #3b82f6 !important;
  border: 1px solid rgba(59, 130, 246, 0.15) !important;
}

.badge-organizer {
  background: rgba(251, 146, 60, 0.08) !important;
  color: #fb923c !important;
  border: 1px solid rgba(251, 146, 60, 0.15) !important;
}

/* Moderation state badges */
.badge-banned {
  background: rgba(239, 68, 68, 0.08) !important;
  color: #ef4444 !important;
  border: 1px solid rgba(239, 68, 68, 0.15) !important;
}

.badge-chat-banned {
  background: rgba(251, 146, 60, 0.08) !important;
  color: #fb923c !important;
  border: 1px solid rgba(251, 146, 60, 0.15) !important;
}
```

**Usage with Composition:**
```css
/* In component CSS module */
.adminBadge {
  composes: badge-base badge-admin from '../../../../styles/design-tokens.css' !important;
}

.organizerBadge {
  composes: badge-base badge-organizer from '../../../../styles/design-tokens.css' !important;
}
```

**Why !important:** Required to override Mantine's inline styles and ensure consistent appearance across all badge instances.

**Available Badge Types:**
- Role badges: `badge-admin`, `badge-organizer`, `badge-speaker`, `badge-attendee`
- Status badges: `badge-success`, `badge-warning`, `badge-danger`, `badge-info`
- Moderation badges: `badge-banned`, `badge-chat-banned`
- Generic: `badge-primary`, `badge-neutral`

### Two-Row Badge Layout for Mobile
Mobile-optimized badge layout that separates total count from role breakdowns:

```css
/* Badge group container */
.badgeGroup {
  display: flex;
  gap: clamp(0.375rem, 1.5vw, 0.5rem);
  flex-wrap: wrap;
  margin-top: clamp(0.5rem, 1.5vw, 0.75rem);
}

/* Badge row for grouping related badges */
.badgeRow {
  display: flex;
  gap: clamp(0.375rem, 1.5vw, 0.5rem);
  align-items: center;
}

/* Mobile layout (< 768px) */
@media (max-width: 768px) {
  .badgeGroup {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin: 0.75rem auto 0;
  }
  
  /* Center content and allow wrapping */
  .badgeRow {
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.375rem;
  }
  
  /* Separate total from other badges */
  .badgeRow:first-child {
    margin-bottom: 0.25rem;
  }
}
```

**Usage Pattern:**
```jsx
<div className={styles.badgeGroup}>
  {/* First row: Total count */}
  <div className={styles.badgeRow}>
    <Badge className={styles.totalBadge}>
      {total} Total
    </Badge>
  </div>
  
  {/* Second row: Role breakdowns */}
  <div className={styles.badgeRow}>
    <Badge className={styles.adminBadge}>
      {adminCount} Admins
    </Badge>
    <Badge className={styles.speakerBadge}>
      {speakerCount} Speakers
    </Badge>
    {/* More role badges... */}
  </div>
</div>
```

This pattern provides visual hierarchy on mobile by emphasizing the total count while keeping role breakdowns accessible but secondary.

### Empty State
```css
.empty-state {
  text-align: center;
  padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  color: var(--color-text-secondary);
}
```

### Mobile View Selector Pattern
Replace desktop tabs with dropdown on mobile for better space utilization:

```css
/* Mobile dropdown container - hidden on desktop */
.mobileViewSelector {
  display: none;
  padding: 1rem;
  background: rgba(139, 92, 246, 0.04);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.08);
}

/* Mantine Select overrides for consistent styling */
.mobileSelectInput {
  background: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid rgba(139, 92, 246, 0.15) !important;
  font-weight: 500 !important;
}

.mobileSelectDropdown {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.1) !important;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.08) !important;
}

/* Mobile breakpoint */
@media (max-width: 768px) {
  /* Show dropdown, hide tabs */
  .mobileViewSelector {
    display: block;
  }
  
  .tabsList {
    display: none !important;
  }
}
```

**Implementation Pattern:**
```jsx
{isMobile ? (
  <div className={styles.mobileViewSelector}>
    <Select
      value={activeView}
      onChange={setActiveView}
      data={[
        { value: 'attendees', label: 'Attendees' },
        { value: 'invitations', label: 'Pending Invitations' }
      ]}
      className={styles.mobileSelect}
      classNames={{
        input: styles.mobileSelectInput,
        dropdown: styles.mobileSelectDropdown
      }}
    />
  </div>
) : (
  <Tabs value={activeView} onChange={setActiveView}>
    {/* Desktop tabs */}
  </Tabs>
)}
```

**Key Points:**
- No null/empty option in dropdown - always show a view
- Maintains same state as tabs for consistency
- Custom styling to match glassmorphic theme

### Adaptive Card Components
Pattern for single component handling multiple data types with conditional rendering:

```jsx
const AttendeeCard = ({ 
  data, 
  isInvitation = false,  // Prop to determine data type
  onUpdateRole,
  currentUserRole,
  // ... other props
}) => {
  // Adaptive data extraction
  const displayName = isInvitation 
    ? data.email 
    : data.full_name;
    
  const roleInfo = isInvitation
    ? data.role
    : data.event_role;
    
  // Conditional feature availability
  const canMessage = !isInvitation && data.user_id;
  const showConnectionStatus = !isInvitation && data.is_connected;
  
  return (
    <div className={styles.card}>
      {/* Common elements */}
      <Avatar>
        {isInvitation ? <IconMail /> : getInitials(displayName)}
      </Avatar>
      
      {/* Type-specific elements */}
      {isInvitation ? (
        <Badge>Invitation Pending</Badge>
      ) : (
        <>
          {showConnectionStatus && <IconCheck />}
          {canMessage && <Button>Message</Button>}
        </>
      )}
    </div>
  );
};
```

**Benefits:**
- Single component maintains consistency
- Reduces code duplication
- Easier to maintain styling
- Graceful handling of different data shapes

**When to Use:**
- Entities share most UI/UX patterns
- Data shapes are similar but not identical
- Actions differ based on state/type

## Usage Examples

### Creating a New Page Section
```jsx
// Component
export const NewSection = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Section Title</h2>
        <Button variant="primary">Action</Button>
      </div>
      
      <div className={styles.cardList}>
        {items.map(item => (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardSubtitle}>{item.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

```css
/* styles/index.module.css */
.container {
  composes: section-container from '../../styles/design-tokens.css';
}

.header {
  composes: section-header from '../../styles/design-tokens.css';
}

.title {
  composes: section-title from '../../styles/design-tokens.css';
}

.card {
  composes: card-base from '../../styles/design-tokens.css';
}

.cardHeader {
  composes: card-header from '../../styles/design-tokens.css';
}

.cardContent {
  composes: card-content from '../../styles/design-tokens.css';
}

.cardTitle {
  composes: card-title from '../../styles/design-tokens.css';
}

.cardList {
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 2vw, 1rem);
}
```

### Custom Component with Design Tokens
```css
.customButton {
  background: var(--color-primary);
  color: white;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  border: none;
  font-size: var(--text-sm);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.customButton:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
```

### Background Shapes with Gradient Colors
```css
.bgShape1 {
  position: fixed;
  width: 350px;
  height: 350px;
  background: linear-gradient(45deg, 
    var(--gradient-purple-light), 
    var(--gradient-purple-medium)
  );
  border-radius: 63% 37% 54% 46% / 55% 48% 52% 45%;
  opacity: 0.04;
  animation: float 15s ease-in-out infinite;
  z-index: 1;
  pointer-events: none;
}
```

## Responsive Patterns

### Responsive Typography
Use `clamp()` for fluid typography that scales with viewport:
```css
.responsiveTitle {
  font-size: clamp(var(--text-lg), 3vw, var(--text-2xl));
}
```

**Management Page Patterns:**
```css
/* Page titles - reduced on mobile for better fit */
.pageTitle {
  font-size: clamp(1.25rem, 3vw, 1.5rem);  /* Mobile: 20px, Desktop: 24px */
  font-weight: 600;
  color: var(--color-text-primary);
}

/* Mobile-specific overrides */
@media (max-width: 768px) {
  .pageTitle {
    font-size: 1.25rem;  /* Fixed size on mobile */
    text-align: center;  /* Center for mobile layouts */
  }
}

/* Card titles with fluid scaling */
.cardTitle {
  font-size: clamp(var(--text-base), 2.5vw, var(--text-lg));
}

/* Badge text stays consistent */
.badge {
  font-size: 0.75rem !important;  /* Always 12px for readability */
}
```

**Typography Scale Reference:**
- Headers: `clamp(1.25rem, 3vw, 1.5rem)` 
- Subheaders: `clamp(1rem, 2.5vw, 1.125rem)`
- Body: `clamp(0.875rem, 2vw, 1rem)`
- Small text: `0.75rem` (fixed for legibility)

### Responsive Spacing
```css
.responsivePadding {
  padding: clamp(var(--space-md), 4vw, var(--space-xl));
}

.responsiveGap {
  gap: clamp(0.75rem, 2vw, 1rem);
}
```

### Breakpoints
Use these standard breakpoints:
```css
@media (max-width: 768px) { /* Mobile */ }
@media (min-width: 769px) and (max-width: 1023px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

## Component Patterns

### Button Usage
Use the shared Button component instead of custom buttons:

```jsx
import { Button } from 'shared/components/buttons/Button';

// Variants available:
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="subtle">Subtle Action</Button>
<Button variant="danger">Delete</Button>

// With icons:
<Button variant="primary" icon={<PlusIcon />}>
  Add Item
</Button>
```

### Glass Effect Pattern
```css
.glassElement {
  background: var(--color-background-glass);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* Safari support */
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
```

### Status Indicators
```css
.statusActive {
  background: rgba(34, 197, 94, 0.1);
  color: var(--color-success);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.statusActive::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
}
```

### Moderation Visual Indicators
Visual cues for banned and muted users with different treatments for cards vs tables:

```javascript
// Utility functions from /shared/utils/moderation.js

// Card styling (subtle)
export const getModerationStyles = (user) => {
  if (user.is_banned) {
    return {
      backgroundColor: 'rgba(255, 250, 250, 0.95)',
      borderLeft: '3px solid rgba(239, 68, 68, 0.5)',
    };
  }
  if (user.is_chat_banned) {
    return {
      backgroundColor: 'rgba(255, 254, 250, 0.95)',
      borderLeft: '3px solid rgba(251, 191, 36, 0.5)',
    };
  }
  return {};
};

// Table row styling (more visible)
export const getModerationRowStyles = (user) => {
  if (user.is_banned) {
    return {
      backgroundColor: 'rgba(254, 242, 242, 0.6)',
      borderLeft: '4px solid rgba(239, 68, 68, 0.4)',
    };
  }
  if (user.is_chat_banned && !user.is_banned) {
    return {
      backgroundColor: 'rgba(254, 252, 232, 0.6)',
      borderLeft: '4px solid rgba(251, 146, 60, 0.4)',
    };
  }
  return {};
};
```

**Visual Hierarchy:**
- **Banned (Red)**: Most severe, blocks all event access
- **Chat Banned (Orange/Yellow)**: Can view but not participate in chat
- **Table rows**: More visible indicators for admin scanning
- **Cards**: Subtle indicators to avoid stigmatization

**Badge Usage:**
```jsx
{user.is_banned && (
  <Badge className={styles.bannedBadge}>BANNED</Badge>
)}
{user.is_chat_banned && !user.is_banned && (
  <Badge className={styles.chatBannedBadge}>CHAT BANNED</Badge>
)}
```

### Pagination Styling
Glassmorphic pagination controls with consistent hover states:

```css
/* Usage - wrap Mantine Pagination with this class */
.pagination {
  composes: pagination-styled from '../../../../styles/design-tokens.css';
}
```

**Applied Styles (from design-tokens.css):**
- Glass effect with backdrop blur
- Purple-tinted hover states
- Active page with solid purple background (no gradient)
- Smooth transitions and elevation changes on hover
- Disabled states with reduced opacity

```jsx
// Component usage
<div className={styles.pagination}>
  <Pagination 
    value={currentPage} 
    onChange={setCurrentPage}
    total={totalPages}
  />
</div>
```

**Design Decisions:**
- Uses `:global()` selectors to override Mantine's internal classes
- All controls styled uniformly (prev/next/page numbers)
- `!important` required due to Mantine's specificity
- Maintains accessibility with proper disabled states

### Shared Utility Functions Pattern
Extract common logic to `/shared/utils/` for consistency and reusability:

```javascript
// Example: /shared/utils/moderation.js
export const getModerationPermissions = (currentUserId, currentUserRole, targetUser) => {
  const isInvitation = !targetUser.user_id;
  const userId = targetUser.user_id;
  const isBanned = targetUser.is_banned;
  
  return {
    canModerateUser: !isInvitation && currentUserId !== userId && 
      (currentUserRole === 'ADMIN' || currentUserRole === 'ORGANIZER') &&
      !isBanned,
    canUnbanUser: !isInvitation && currentUserId !== userId && 
      (currentUserRole === 'ADMIN' || currentUserRole === 'ORGANIZER') &&
      isBanned,
    // ... more permissions
  };
};

// Create reusable handlers
export const createModerationHandlers = ({ user, currentUserRole, banUser, unbanUser }) => {
  const handleBan = () => {
    openConfirmationModal({
      title: 'Ban User from Event',
      message: `Ban ${user.full_name} from the event?`,
      onConfirm: async () => {
        await banUser({ eventId: user.event_id, userId: user.user_id });
      }
    });
  };
  
  return { handleBan, handleUnban, handleChatBan, handleChatUnban };
};
```

**Benefits:**
- Single source of truth for business logic
- Consistent behavior across components
- Easier testing and maintenance
- Reduced duplication

**Common Utility Categories:**
- **Formatting** (`/shared/utils/formatting.js`) - dates, names, numbers
- **Validation** (`/shared/utils/validation.js`) - form rules, data checks
- **Permissions** (`/shared/utils/permissions.js`) - role-based access
- **Moderation** (`/shared/utils/moderation.js`) - user management
- **Sorting** (`/shared/utils/sorting.js`) - reusable comparators

### Mobile-First Component Simplification
Reduce complexity on mobile to improve UX and performance:

```jsx
// Example: InviteModal - Desktop has tabs, mobile has single form
const InviteModal = ({ opened, onClose }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <Modal opened={opened} onClose={onClose}>
      {!isMobile ? (
        <Tabs>
          <Tabs.List>
            <Tabs.Tab value="single">Single Invitation</Tabs.Tab>
            <Tabs.Tab value="bulk">Bulk Invitations</Tabs.Tab>
          </Tabs.List>
          {/* Both tab panels */}
        </Tabs>
      ) : (
        /* Mobile: Only single invitation form */
        <form onSubmit={handleSingleSubmit}>
          {/* Simplified single form */}
        </form>
      )}
    </Modal>
  );
};
```

**Simplification Patterns:**
- **Remove secondary features**: Hide bulk operations, advanced filters
- **Consolidate actions**: Group related actions in single menu
- **Reduce visual complexity**: Hide non-essential badges/indicators
- **Optimize interactions**: Larger touch targets, fewer nested menus

**Common Simplifications:**
- Tabs → Single view or dropdown
- Multi-column → Single column
- Inline editing → Separate modal
- Multiple CTAs → Primary action + menu

**Implementation:**
```jsx
const isMobile = useMediaQuery('(max-width: 768px)');

// Conditional rendering based on device
if (isMobile) {
  // Simplified mobile version
} else {
  // Full desktop version
}
```

## Best Practices

### ✅ Do
- Use design tokens for all colors, spacing, and typography
- Compose semantic classes when possible
- Use the shared Button component
- Use `clamp()` for responsive values
- Use gradient colors for decorative backgrounds
- Test on mobile devices regularly

### ❌ Don't
- Hardcode color values
- Create custom buttons when shared component exists
- Use semantic colors (success, warning) for decorative purposes
- Skip the glass effect border for glassmorphism
- Forget Safari prefixes for backdrop-filter
- Use excessive shadows or animations

### Performance Tips
- Backdrop-filter is expensive - use sparingly
- Test glassmorphism performance on lower-end devices
- Keep animations subtle and fast (0.2s transitions)
- Use `pointer-events: none` on decorative elements

### Accessibility
- Maintain proper contrast ratios despite transparency
- Ensure interactive elements are at least 44px tall
- Use semantic HTML with CSS for styling
- Test keyboard navigation

## Migration Guide

### From Hardcoded Values
```css
/* Before */
.oldStyle {
  background: #8b5cf6;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* After */
.newStyle {
  background: var(--color-primary);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

### From Custom Components to Semantic Classes
```css
/* Before */
.customCard {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 6px;
  padding: 16px;
  /* ... more properties */
}

/* After */
.customCard {
  composes: card-base from '../../styles/design-tokens.css';
  /* Only custom properties here */
}
```

## Troubleshooting

### Common Issues

**Design tokens not working?**
- Check that `design-tokens.css` is imported in `main.jsx`
- Ensure you're using CSS custom property syntax: `var(--token-name)`

**Glassmorphism not showing?**
- Add `-webkit-backdrop-filter` for Safari
- Ensure element has a background color
- Check that parent doesn't have `overflow: hidden`

**Responsive values not scaling?**
- Use `clamp()` instead of fixed values
- Test on actual devices, not just browser resize
- Check viewport meta tag is set correctly

**Components not matching design?**
- Import shared components instead of recreating
- Use semantic classes for common patterns
- Reference existing components for examples

---

This guide is a living document. When adding new patterns or components, update this guide to maintain consistency across the application.