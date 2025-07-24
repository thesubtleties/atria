import { useState, useEffect, useMemo } from 'react';
import { 
  TextInput, 
  Textarea, 
  Stack, 
  Group, 
  Title,
  Text,
  ActionIcon,
  Modal,
  Select
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { 
  IconPlus, 
  IconTrash, 
  IconEdit,
  IconGripVertical,
  IconStarFilled,
  IconQuestionMark
} from '@tabler/icons-react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { useSortable } from '@dnd-kit/react/sortable';
import { Button } from '@/shared/components/buttons';
import { useUpdateEventMutation } from '@/app/features/events/api';
import { highlightSchema, faqSchema } from '../schemas/eventSettingsSchemas';
import styles from './styles.module.css';
import parentStyles from '../styles/index.module.css';

// Draggable Highlight Card Component
const DraggableHighlight = ({ id, highlight, onEdit, onDelete }) => {
  const { ref, isDragging } = useSortable({ 
    id,
    type: 'highlight',
    accept: ['highlight'],
  });

  return (
    <div
      ref={ref}
      className={`${styles.draggableCard} ${isDragging ? styles.dragging : ''}`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <Group justify="space-between">
        <Group>
          <ActionIcon 
            variant="subtle" 
            size="sm" 
            className={styles.dragHandle}
            style={{ cursor: 'grab' }}
          >
            <IconGripVertical size={16} />
          </ActionIcon>
          <IconStarFilled size={20} className={styles.highlightIcon} />
          <div>
            <Text fw={500}>{highlight.title}</Text>
            <Text size="sm" c="dimmed">{highlight.description}</Text>
          </div>
        </Group>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            onClick={() => onEdit(id)}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => onDelete(id)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </div>
  );
};

// Draggable FAQ Card Component
const DraggableFAQ = ({ id, faq, onEdit, onDelete }) => {
  const { ref, isDragging } = useSortable({ 
    id,
    type: 'faq',
    accept: ['faq'],
  });

  return (
    <div
      ref={ref}
      className={`${styles.draggableCard} ${isDragging ? styles.dragging : ''}`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <Group justify="space-between" align="flex-start">
        <Group align="flex-start">
          <ActionIcon 
            variant="subtle" 
            size="sm" 
            className={styles.dragHandle}
            style={{ cursor: 'grab' }}
          >
            <IconGripVertical size={16} />
          </ActionIcon>
          <IconQuestionMark size={20} className={styles.faqIcon} />
          <div style={{ flex: 1 }}>
            <Text fw={500}>{faq.question}</Text>
            <Text size="sm" c="dimmed" mt="xs">{faq.answer}</Text>
          </div>
        </Group>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            onClick={() => onEdit(id)}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => onDelete(id)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </div>
  );
};

const ContentSections = ({ event, eventId }) => {
  const [updateEvent, { isLoading }] = useUpdateEventMutation();
  const [hasChanges, setHasChanges] = useState(false);
  
  // Modal states
  const [highlightModal, setHighlightModal] = useState({ open: false, mode: 'create', id: null });
  const [faqModal, setFaqModal] = useState({ open: false, mode: 'create', id: null });

  // Local state for drag and drop
  const [localHighlights, setLocalHighlights] = useState({});
  const [localFaqs, setLocalFaqs] = useState({});
  
  // ID generation counter (persists across renders)
  const [nextHighlightId, setNextHighlightId] = useState(1);
  const [nextFaqId, setNextFaqId] = useState(1);

  // Form for welcome section
  const welcomeForm = useForm({
    initialValues: {
      welcome_title: event?.sections?.welcome?.title || '',
      welcome_content: event?.sections?.welcome?.content || '',
    },
  });

  // Form for highlights
  const highlightForm = useForm({
    initialValues: {
      title: '',
      description: '',
      icon: 'IconStarFilled',
    },
    resolver: zodResolver(highlightSchema),
  });

  // Form for FAQs
  const faqForm = useForm({
    initialValues: {
      question: '',
      answer: '',
    },
    resolver: zodResolver(faqSchema),
  });

  // State for lists with stable IDs
  const [highlights, setHighlights] = useState(() => {
    const initialHighlights = event?.sections?.highlights || [];
    return initialHighlights.map((highlight, index) => ({
      ...highlight,
      _id: `h-${Date.now()}-${index}` // Stable ID
    }));
  });

  const [faqs, setFaqs] = useState(() => {
    const initialFaqs = event?.sections?.faqs || [];
    return initialFaqs.map((faq, index) => ({
      ...faq,
      _id: `f-${Date.now()}-${index}` // Stable ID
    }));
  });

  // Create lookup maps
  const highlightLookup = useMemo(() => {
    const lookup = {};
    highlights.forEach(highlight => {
      lookup[highlight._id] = highlight;
    });
    return lookup;
  }, [highlights]);

  const faqLookup = useMemo(() => {
    const lookup = {};
    faqs.forEach(faq => {
      lookup[faq._id] = faq;
    });
    return lookup;
  }, [faqs]);

  // Initialize local items for drag and drop (only on mount or when items added/removed)
  useEffect(() => {
    const highlightIds = highlights.map(h => h._id);
    setLocalHighlights({ default: highlightIds });
  }, [highlights.length]); // Only re-run when count changes

  useEffect(() => {
    const faqIds = faqs.map(f => f._id);
    setLocalFaqs({ default: faqIds });
  }, [faqs.length]); // Only re-run when count changes

  // Track changes
  useEffect(() => {
    const welcomeChanged = 
      welcomeForm.values.welcome_title !== event?.sections?.welcome?.title ||
      welcomeForm.values.welcome_content !== event?.sections?.welcome?.content;
    
    // Compare without _id field
    const highlightsWithoutId = highlights.map(({ _id, ...rest }) => rest);
    const faqsWithoutId = faqs.map(({ _id, ...rest }) => rest);
    
    const highlightsChanged = JSON.stringify(highlightsWithoutId) !== JSON.stringify(event?.sections?.highlights || []);
    const faqsChanged = JSON.stringify(faqsWithoutId) !== JSON.stringify(event?.sections?.faqs || []);
    
    setHasChanges(welcomeChanged || highlightsChanged || faqsChanged);
  }, [welcomeForm.values, highlights, faqs, event]);

  // Icon options for highlights
  const iconOptions = [
    { value: 'IconStarFilled', label: 'Star' },
    { value: 'IconInfoCircle', label: 'Info' },
    { value: 'IconUsers', label: 'Users' },
    { value: 'IconCalendar', label: 'Calendar' },
    { value: 'IconClock', label: 'Clock' },
    { value: 'IconMapPin', label: 'Location' },
    { value: 'IconTrophy', label: 'Trophy' },
    { value: 'IconHeart', label: 'Heart' },
  ];

  // Highlight handlers
  const handleAddHighlight = () => {
    highlightForm.reset();
    setHighlightModal({ open: true, mode: 'create', id: null });
  };

  const handleEditHighlight = (highlightId) => {
    const highlight = highlightLookup[highlightId];
    if (highlight) {
      const { _id, ...rest } = highlight;
      highlightForm.setValues(rest);
      setHighlightModal({ open: true, mode: 'edit', id: highlightId });
    }
  };

  const handleSaveHighlight = (values) => {
    if (highlightModal.mode === 'create') {
      const newHighlight = {
        ...values,
        _id: `h-${Date.now()}-${nextHighlightId}`
      };
      setHighlights([...highlights, newHighlight]);
      setNextHighlightId(nextHighlightId + 1);
    } else {
      const updated = highlights.map(h => 
        h._id === highlightModal.id ? { ...values, _id: h._id } : h
      );
      setHighlights(updated);
    }
    setHighlightModal({ open: false, mode: 'create', id: null });
  };

  const handleDeleteHighlight = (highlightId) => {
    setHighlights(highlights.filter(h => h._id !== highlightId));
  };

  // Highlight drag handlers
  const handleHighlightDragOver = (event) => {
    setLocalHighlights((items) => move(items, event));
  };

  const handleHighlightDragEnd = (event) => {
    const { operation } = event;
    if (!operation) return;

    const draggedId = operation.source.id;
    const draggedHighlight = highlightLookup[draggedId];
    
    if (!draggedHighlight) {
      console.error('Could not find highlight with id:', draggedId);
      return;
    }

    // Find new position based on the current order in localHighlights
    const newOrder = localHighlights.default || [];
    const newHighlights = newOrder.map(id => highlightLookup[id]).filter(Boolean);
    
    setHighlights(newHighlights);
  };

  // FAQ handlers
  const handleAddFAQ = () => {
    faqForm.reset();
    setFaqModal({ open: true, mode: 'create', id: null });
  };

  const handleEditFAQ = (faqId) => {
    const faq = faqLookup[faqId];
    if (faq) {
      const { _id, ...rest } = faq;
      faqForm.setValues(rest);
      setFaqModal({ open: true, mode: 'edit', id: faqId });
    }
  };

  const handleSaveFAQ = (values) => {
    if (faqModal.mode === 'create') {
      const newFaq = {
        ...values,
        _id: `f-${Date.now()}-${nextFaqId}`
      };
      setFaqs([...faqs, newFaq]);
      setNextFaqId(nextFaqId + 1);
    } else {
      const updated = faqs.map(f => 
        f._id === faqModal.id ? { ...values, _id: f._id } : f
      );
      setFaqs(updated);
    }
    setFaqModal({ open: false, mode: 'create', id: null });
  };

  const handleDeleteFAQ = (faqId) => {
    setFaqs(faqs.filter(f => f._id !== faqId));
  };

  // FAQ drag handlers
  const handleFAQDragOver = (event) => {
    setLocalFaqs((items) => move(items, event));
  };

  const handleFAQDragEnd = (event) => {
    const { operation } = event;
    if (!operation) return;

    const draggedId = operation.source.id;
    const draggedFaq = faqLookup[draggedId];
    
    if (!draggedFaq) {
      console.error('Could not find FAQ with id:', draggedId);
      return;
    }

    // Find new position based on the current order in localFaqs
    const newOrder = localFaqs.default || [];
    const newFaqs = newOrder.map(id => faqLookup[id]).filter(Boolean);
    
    setFaqs(newFaqs);
  };

  // Save all changes
  const handleSubmit = async () => {
    try {
      // Strip _id fields before sending to API
      const highlightsForApi = highlights.map(({ _id, ...rest }) => rest);
      const faqsForApi = faqs.map(({ _id, ...rest }) => rest);

      await updateEvent({
        id: eventId,
        sections: {
          welcome: {
            title: welcomeForm.values.welcome_title,
            content: welcomeForm.values.welcome_content,
          },
          highlights: highlightsForApi,
          faqs: faqsForApi,
        },
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: 'Content sections updated successfully',
        color: 'green',
      });
      setHasChanges(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to update content sections',
        color: 'red',
      });
    }
  };

  const handleReset = () => {
    welcomeForm.setValues({
      welcome_title: event?.sections?.welcome?.title || '',
      welcome_content: event?.sections?.welcome?.content || '',
    });
    // Re-add stable IDs when resetting
    const timestamp = Date.now();
    const resetHighlights = (event?.sections?.highlights || []).map((highlight, index) => ({
      ...highlight,
      _id: `h-${timestamp}-${index}`
    }));
    const resetFaqs = (event?.sections?.faqs || []).map((faq, index) => ({
      ...faq,
      _id: `f-${timestamp}-${index}`
    }));
    setHighlights(resetHighlights);
    setFaqs(resetFaqs);
    
    // Reset the local drag state with new IDs
    const resetHighlightIds = resetHighlights.map(h => h._id);
    const resetFaqIds = resetFaqs.map(f => f._id);
    setLocalHighlights({ default: resetHighlightIds });
    setLocalFaqs({ default: resetFaqIds });
    
    // Reset the ID counters
    setNextHighlightId(resetHighlights.length + 1);
    setNextFaqId(resetFaqs.length + 1);
    
    setHasChanges(false);
  };

  return (
    <>
      <div className={`${parentStyles.section} ${styles.glassSection}`}>
        <h3 className={parentStyles.sectionTitle}>Content Sections</h3>
        <Text c="dimmed" size="sm" mb="xl">
          Customize highlights, FAQs, and welcome messages for your event
        </Text>
        
        <Stack spacing="xl">
              {/* Welcome Section */}
              <div className={styles.welcomeSection}>
                <Title order={4} className={styles.subsectionTitle}>Welcome Section</Title>
                <Stack spacing="md">
                  <TextInput
                    label="Welcome Title"
                    placeholder="Welcome to our event"
                    classNames={{ input: styles.formInput }}
                    {...welcomeForm.getInputProps('welcome_title')}
                  />
                  <Textarea
                    label="Welcome Content"
                    placeholder="Enter welcome message for attendees"
                    minRows={3}
                    classNames={{ input: styles.formTextarea }}
                    {...welcomeForm.getInputProps('welcome_content')}
                  />
                </Stack>
              </div>

              <div className={styles.divider} />

              {/* Highlights Section */}
              <div>
                <Group justify="space-between" mb="md">
                  <Title order={4} className={styles.subsectionTitle}>Event Highlights</Title>
                  <Button
                    variant="primary"
                    onClick={handleAddHighlight}
                  >
                    <IconPlus size={16} />
                    Add Highlight
                  </Button>
                </Group>

                <DragDropProvider onDragOver={handleHighlightDragOver} onDragEnd={handleHighlightDragEnd}>
                  <div className={styles.draggableList}>
                    {highlights.length === 0 ? (
                      <div className={styles.emptyState}>
                        <Text c="dimmed" ta="center">
                          No highlights added yet
                        </Text>
                      </div>
                    ) : (
                      localHighlights.default?.map((id) => {
                        const highlight = highlightLookup[id];
                        if (!highlight) return null;
                        
                        return (
                          <DraggableHighlight
                            key={id}
                            id={id}
                            highlight={highlight}
                            onEdit={handleEditHighlight}
                            onDelete={handleDeleteHighlight}
                          />
                        );
                      })
                    )}
                  </div>
                </DragDropProvider>
              </div>

              <div className={styles.divider} />

              {/* FAQs Section */}
              <div>
                <Group justify="space-between" mb="md">
                  <Title order={4} className={styles.subsectionTitle}>Frequently Asked Questions</Title>
                  <Button
                    variant="primary"
                    onClick={handleAddFAQ}
                  >
                    <IconPlus size={16} />
                    Add FAQ
                  </Button>
                </Group>

                <DragDropProvider onDragOver={handleFAQDragOver} onDragEnd={handleFAQDragEnd}>
                  <div className={styles.draggableList}>
                    {faqs.length === 0 ? (
                      <div className={styles.emptyState}>
                        <Text c="dimmed" ta="center">
                          No FAQs added yet
                        </Text>
                      </div>
                    ) : (
                      localFaqs.default?.map((id) => {
                        const faq = faqLookup[id];
                        if (!faq) return null;
                        
                        return (
                          <DraggableFAQ
                            key={id}
                            id={id}
                            faq={faq}
                            onEdit={handleEditFAQ}
                            onDelete={handleDeleteFAQ}
                          />
                        );
                      })
                    )}
                  </div>
                </DragDropProvider>
              </div>

              {hasChanges && (
                <Group justify="flex-end" mt="xl">
                  <Button variant="subtle" onClick={handleReset}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
                    Save Changes
                  </Button>
                </Group>
              )}
            </Stack>
      </div>

      {/* Highlight Modal */}
      <Modal
        opened={highlightModal.open}
        onClose={() => setHighlightModal({ open: false, mode: 'create', id: null })}
        title={highlightModal.mode === 'create' ? 'Add Highlight' : 'Edit Highlight'}
        classNames={{
          content: styles.modalContent,
          header: styles.modalHeader,
        }}
      >
        <form onSubmit={highlightForm.onSubmit(handleSaveHighlight)}>
          <Stack>
            <TextInput
              label="Title"
              placeholder="Enter highlight title"
              required
              classNames={{ input: styles.formInput }}
              {...highlightForm.getInputProps('title')}
            />
            <Textarea
              label="Description"
              placeholder="Enter highlight description"
              required
              classNames={{ input: styles.formTextarea }}
              {...highlightForm.getInputProps('description')}
            />
            <Select
              label="Icon"
              data={iconOptions}
              classNames={{ input: styles.formSelect }}
              {...highlightForm.getInputProps('icon')}
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => setHighlightModal({ open: false, mode: 'create', id: null })}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {highlightModal.mode === 'create' ? 'Add' : 'Update'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* FAQ Modal */}
      <Modal
        opened={faqModal.open}
        onClose={() => setFaqModal({ open: false, mode: 'create', id: null })}
        title={faqModal.mode === 'create' ? 'Add FAQ' : 'Edit FAQ'}
        classNames={{
          content: styles.modalContent,
          header: styles.modalHeader,
        }}
      >
        <form onSubmit={faqForm.onSubmit(handleSaveFAQ)}>
          <Stack>
            <TextInput
              label="Question"
              placeholder="Enter question"
              required
              classNames={{ input: styles.formInput }}
              {...faqForm.getInputProps('question')}
            />
            <Textarea
              label="Answer"
              placeholder="Enter answer"
              minRows={3}
              required
              classNames={{ input: styles.formTextarea }}
              {...faqForm.getInputProps('answer')}
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => setFaqModal({ open: false, mode: 'create', id: null })}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {faqModal.mode === 'create' ? 'Add' : 'Update'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
};

export default ContentSections;