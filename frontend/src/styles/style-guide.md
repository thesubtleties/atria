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

### Empty State
```css
.empty-state {
  text-align: center;
  padding: clamp(var(--space-lg), 4vw, var(--space-xl));
  color: var(--color-text-secondary);
}
```

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