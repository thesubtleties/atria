# Loading State Components Usage Guide

## Quick Reference

```javascript
import LoadingState from 'shared/components/loading';
// or specific imports
import { LoadingSpinner, LoadingContent } from 'shared/components/loading';
```

## Component Catalog

### 1. LoadingSpinner

**Use for:** Inline loading indicators, buttons, small areas

```jsx
// Default
<LoadingSpinner />

// Sizes: xs, sm, md, lg, xl
<LoadingSpinner size="xs" />  // For buttons
<LoadingSpinner size="lg" />  // For larger areas

// Custom color (rarely needed)
<LoadingSpinner color="var(--color-success)" />
```

### 2. LoadingContent

**Use for:** Card content, modal content, centered loading states

```jsx
// Default with message
<LoadingContent />

// Custom message
<LoadingContent message="Fetching events..." />

// No message
<LoadingContent showMessage={false} />

// Large size
<LoadingContent size="lg" message="Processing..." />
```

### 3. LoadingSection

**Use for:** Full sections, tab panels, empty containers

```jsx
// Default
<LoadingSection />

// Custom height and message
<LoadingSection height={400} message="Loading attendees..." />
```

### 4. LoadingOverlay

**Use for:** Forms being submitted, content being updated, modals

```jsx
// Basic usage
<div style={{ position: 'relative' }}>
  <LoadingOverlay visible={isSubmitting} />
  <form>...</form>
</div>

// With custom message (not supported by Mantine by default)
<LoadingOverlay visible={isLoading} blur={3} />
```

### 5. LoadingSkeleton

**Use for:** Text content placeholders

```jsx
// Default 3 lines
<LoadingSkeleton />

// Custom lines
<LoadingSkeleton lines={5} />

// Custom height
<LoadingSkeleton lines={2} height={20} />
```

### 6. LoadingCard

**Use for:** Card list placeholders

```jsx
// In a list
{
  isLoading ?
    <>
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
    </>
  : events.map((event) => <EventCard key={event.id} event={event} />);
}
```

### 7. LoadingTableRow

**Use for:** Table loading states

```jsx
<tbody>
  {isLoading ?
    <>
      <LoadingTableRow columns={5} />
      <LoadingTableRow columns={5} />
      <LoadingTableRow columns={5} />
    </>
  : data.map((row) => <tr>...</tr>)}
</tbody>
```

### 8. LoadingPage

**Use for:** Initial page loads, route transitions

```jsx
if (isLoading) {
  return <LoadingPage message='Loading event details...' />;
}
```

### 9. ButtonLoader

**Use for:** Inside button components

```jsx
<Button disabled={isSubmitting}>
  {isSubmitting ?
    <ButtonLoader />
  : 'Submit'}
</Button>
```

## Common Patterns

### RTK Query Loading States

```jsx
const { data, isLoading } = useGetEventsQuery();

if (isLoading) {
  return <LoadingSection message='Loading events...' />;
}
```

### Form Submission

```jsx
const [isSubmitting, setIsSubmitting] = useState(false);

return (
  <div style={{ position: 'relative' }}>
    <LoadingOverlay visible={isSubmitting} />
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <Button type='submit' disabled={isSubmitting}>
        {isSubmitting ?
          <ButtonLoader />
        : 'Save Changes'}
      </Button>
    </form>
  </div>
);
```

### List Loading with Skeletons

```jsx
const { data: attendees, isLoading } = useGetAttendeesQuery();

return (
  <div className={styles.cardList}>
    {isLoading ?
      // Show 3 skeleton cards while loading
      Array.from({ length: 3 }).map((_, i) => <LoadingCard key={i} />)
    : attendees.map((attendee) => <AttendeeCard key={attendee.id} data={attendee} />)}
  </div>
);
```

### Conditional Content Loading

```jsx
const [activeTab, setActiveTab] = useState('details');
const { data, isLoading } = useGetEventDetailsQuery(eventId);

return (
  <Tabs value={activeTab} onChange={setActiveTab}>
    <Tabs.List>
      <Tabs.Tab value='details'>Details</Tabs.Tab>
      <Tabs.Tab value='attendees'>Attendees</Tabs.Tab>
    </Tabs.List>

    <Tabs.Panel value='details'>
      {isLoading ?
        <LoadingContent message='Loading event details...' />
      : <EventDetails data={data} />}
    </Tabs.Panel>
  </Tabs>
);
```

### Empty State vs Loading

```jsx
const { data: events = [], isLoading } = useGetEventsQuery();

if (isLoading) {
  return <LoadingSection message='Loading events...' />;
}

if (events.length === 0) {
  return <EmptyState message='No events found' />;
}

return <EventsList events={events} />;
```

## Migration Guide

### Replacing Generic Loading Text

```jsx
// Before
if (isLoading) return <div>Loading...</div>;

// After
if (isLoading) return <LoadingContent />;
```

### Replacing Mantine Loader

```jsx
// Before
<Loader size="sm" />

// After
<LoadingSpinner size="sm" />
```

### Replacing Custom Loading States

```jsx
// Before
<div className={styles.loadingContainer}>
  <Loader color="grape" />
  <Text>Please wait...</Text>
</div>

// After
<LoadingContent message="Please wait..." />
```

## Best Practices

1. **Use semantic messages** - Be specific about what's loading
   - ❌ "Loading..."
   - ✅ "Loading event details..."

2. **Match size to context**
   - Buttons: `size="xs"`
   - Cards: `size="sm"` or `size="md"`
   - Pages: `size="lg"`

3. **Show skeletons for lists** - Better perceived performance

   ```jsx
   // Good - shows structure while loading
   {
     isLoading ? <LoadingCard /> : <EventCard />;
   }
   ```

4. **Use overlays for updates** - Keep content visible

   ```jsx
   // Good - shows form is being submitted
   <LoadingOverlay visible={isSubmitting} />
   ```

5. **Handle empty states separately** - Don't confuse loading with no data
   ```jsx
   if (isLoading) return <LoadingContent />;
   if (!data) return <EmptyState />;
   ```

## Consistency Rules

- **Always use brand purple** (#8B5CF6) - already set as default
- **Use consistent messages** - "Loading [what]..."
- **Match loading component to content type**:
  - Lists → LoadingCard or LoadingSkeleton
  - Tables → LoadingTableRow
  - Forms → LoadingOverlay
  - Pages → LoadingPage
  - Sections → LoadingSection
  - Inline → LoadingSpinner

## Performance Notes

- Skeletons are better for perceived performance than spinners
- Use `showMessage={false}` for very quick operations (<500ms)
- Consider showing content immediately with loading overlay for updates
- Avoid multiple spinners on the same page - use one at the appropriate level
