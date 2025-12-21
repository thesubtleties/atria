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
  Menu,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconGripVertical,
  IconDots,
  IconBolt,
  IconQuestionMark,
} from '@tabler/icons-react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { useSortable } from '@dnd-kit/react/sortable';
import { Button } from '@/shared/components/buttons';
import { useUpdateEventMutation } from '@/app/features/events/api';
import { highlightSchema, faqSchema } from '../schemas/eventSettingsSchemas';
import { cn } from '@/lib/cn';
import type { Event, ApiError } from '@/types';
import styles from './styles.module.css';
import parentStyles from '../styles/index.module.css';

type Highlight = {
  title: string;
  description: string;
  icon?: string | null;
  _id: string;
};

type FAQ = {
  question: string;
  answer: string;
  _id: string;
};

type HighlightFormValues = {
  title: string;
  description: string;
};

type FAQFormValues = {
  question: string;
  answer: string;
};

type ModalState = {
  open: boolean;
  mode: 'create' | 'edit';
  id: string | null;
};

type DraggableHighlightProps = {
  id: string;
  highlight: Highlight;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isMobile: boolean | undefined;
};

type DesktopHighlightCardProps = {
  id: string;
  highlight: Highlight;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

type DesktopFAQCardProps = {
  id: string;
  faq: FAQ;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

type DraggableFAQProps = {
  id: string;
  faq: FAQ;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isMobile: boolean | undefined;
};

type ContentSectionsProps = {
  event: Event | undefined;
  eventId: number;
};

// Draggable Highlight Card Component
const DraggableHighlight = ({
  id,
  highlight,
  onEdit,
  onDelete,
  isMobile,
}: DraggableHighlightProps) => {
  const { ref, isDragging } = useSortable({ id, index: 0 });

  return (
    <div
      ref={ref}
      className={cn(styles.draggableCard, isDragging && styles.dragging)}
      style={{
        cursor:
          isMobile ? 'default'
          : isDragging ? 'grabbing'
          : 'grab',
      }}
    >
      <div className={cn(styles.cardInner)}>
        <div className={cn(styles.cardTopRow)}>
          {!isMobile && (
            <ActionIcon
              variant='subtle'
              size='lg'
              className={cn(styles.dragHandle)}
              style={{ cursor: 'grab' }}
            >
              <IconGripVertical size={20} />
            </ActionIcon>
          )}
          <Menu position='bottom-end' withinPortal>
            <Menu.Target>
              <ActionIcon variant='subtle' className={cn(styles.menuButton)}>
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => onEdit(id)}>
                Edit
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={16} />}
                onClick={() => onDelete(id)}
                color='red'
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
        <Text fw={600} className={cn(styles.cardTitle)}>
          {highlight.title}
        </Text>
        <div className={cn(styles.cardDivider)} />
        <Text size='sm' c='dimmed' className={cn(styles.cardDescription)}>
          {highlight.description}
        </Text>
      </div>
    </div>
  );
};

// Desktop Highlight Card Component
const DesktopHighlightCard = ({ id, highlight, onEdit, onDelete }: DesktopHighlightCardProps) => {
  const { ref, isDragging } = useSortable({ id, index: 0 });

  return (
    <div
      ref={ref}
      className={cn(styles.desktopCard, isDragging && styles.dragging)}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <Group
        align='center'
        justify='space-between'
        wrap='nowrap'
        className={cn(styles.desktopCardInner)}
      >
        <Group wrap='nowrap' gap='md' align='center'>
          <div className={cn(styles.desktopCardIcon)}>
            <IconBolt size={24} style={{ color: '#FFC107' }} />
          </div>
          <div className={cn(styles.desktopCardTextContent)}>
            <Text fw={600} size='md' className={cn(styles.desktopCardTitle)}>
              {highlight.title}
            </Text>
            <Text size='sm' c='dimmed' className={cn(styles.desktopCardDescription)}>
              {highlight.description}
            </Text>
          </div>
        </Group>

        <Menu position='bottom-end' withinPortal>
          <Menu.Target>
            <ActionIcon variant='subtle' className={cn(styles.desktopMenuButton)}>
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => onEdit(id)}>
              Edit
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrash size={16} />}
              onClick={() => onDelete(id)}
              color='red'
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </div>
  );
};

// Desktop FAQ Card Component
const DesktopFAQCard = ({ id, faq, onEdit, onDelete }: DesktopFAQCardProps) => {
  const { ref, isDragging } = useSortable({ id, index: 0 });

  return (
    <div
      ref={ref}
      className={cn(styles.desktopCard, isDragging && styles.dragging)}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <Group
        align='center'
        justify='space-between'
        wrap='nowrap'
        className={cn(styles.desktopCardInner)}
      >
        <Group wrap='nowrap' gap='md' align='center'>
          <div className={cn(styles.desktopCardIcon)}>
            <IconQuestionMark size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className={cn(styles.desktopCardTextContent)}>
            <Text fw={600} size='md' className={cn(styles.desktopCardTitle)}>
              {faq.question}
            </Text>
            <Text size='sm' c='dimmed' className={cn(styles.desktopCardDescription)}>
              {faq.answer}
            </Text>
          </div>
        </Group>

        <Menu position='bottom-end' withinPortal>
          <Menu.Target>
            <ActionIcon variant='subtle' className={cn(styles.desktopMenuButton)}>
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => onEdit(id)}>
              Edit
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrash size={16} />}
              onClick={() => onDelete(id)}
              color='red'
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </div>
  );
};

// Draggable FAQ Card Component (Mobile)
const DraggableFAQ = ({ id, faq, onEdit, onDelete, isMobile }: DraggableFAQProps) => {
  const { ref, isDragging } = useSortable({ id, index: 0 });

  return (
    <div
      ref={ref}
      className={cn(styles.draggableCard, isDragging && styles.dragging)}
      style={{
        cursor:
          isMobile ? 'default'
          : isDragging ? 'grabbing'
          : 'grab',
      }}
    >
      <div className={cn(styles.cardInner)}>
        <div className={cn(styles.cardTopRow)}>
          {!isMobile && (
            <ActionIcon
              variant='subtle'
              size='lg'
              className={cn(styles.dragHandle)}
              style={{ cursor: 'grab' }}
            >
              <IconGripVertical size={20} />
            </ActionIcon>
          )}
          <Menu position='bottom-end' withinPortal>
            <Menu.Target>
              <ActionIcon variant='subtle' className={cn(styles.menuButton)}>
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => onEdit(id)}>
                Edit
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={16} />}
                onClick={() => onDelete(id)}
                color='red'
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
        <Text fw={600} className={cn(styles.cardTitle)}>
          {faq.question}
        </Text>
        <div className={cn(styles.cardDivider)} />
        <Text size='sm' c='dimmed' className={cn(styles.cardDescription)}>
          {faq.answer}
        </Text>
      </div>
    </div>
  );
};

const ContentSections = ({ event, eventId }: ContentSectionsProps) => {
  const [updateEvent, { isLoading }] = useUpdateEventMutation();
  const [hasChanges, setHasChanges] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Modal states
  const [highlightModal, setHighlightModal] = useState<ModalState>({
    open: false,
    mode: 'create',
    id: null,
  });
  const [faqModal, setFaqModal] = useState<ModalState>({ open: false, mode: 'create', id: null });

  // Local state for drag and drop
  const [localHighlights, setLocalHighlights] = useState<Record<string, string[]>>({});
  const [localFaqs, setLocalFaqs] = useState<Record<string, string[]>>({});

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
  const highlightForm = useForm<HighlightFormValues>({
    initialValues: {
      title: '',
      description: '',
    },
    validate: zodResolver(highlightSchema),
  });

  // Form for FAQs
  const faqForm = useForm<FAQFormValues>({
    initialValues: {
      question: '',
      answer: '',
    },
    validate: zodResolver(faqSchema),
  });

  // State for lists with stable IDs
  const [highlights, setHighlights] = useState<Highlight[]>(() => {
    const initialHighlights = event?.sections?.highlights || [];
    return initialHighlights.map((highlight, index) => ({
      ...highlight,
      _id: `h-${Date.now()}-${index}`,
    }));
  });

  const [faqs, setFaqs] = useState<FAQ[]>(() => {
    const initialFaqs = event?.sections?.faqs || [];
    return initialFaqs.map((faq, index) => ({
      ...faq,
      _id: `f-${Date.now()}-${index}`,
    }));
  });

  // Create lookup maps
  const highlightLookup = useMemo(() => {
    const lookup: Record<string, Highlight> = {};
    highlights.forEach((highlight) => {
      lookup[highlight._id] = highlight;
    });
    return lookup;
  }, [highlights]);

  const faqLookup = useMemo(() => {
    const lookup: Record<string, FAQ> = {};
    faqs.forEach((faq) => {
      lookup[faq._id] = faq;
    });
    return lookup;
  }, [faqs]);

  // Initialize local items for drag and drop (only on mount or when items added/removed)
  useEffect(() => {
    const highlightIds = highlights.map((h) => h._id);
    setLocalHighlights({ default: highlightIds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlights.length]);

  useEffect(() => {
    const faqIds = faqs.map((f) => f._id);
    setLocalFaqs({ default: faqIds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faqs.length]);

  // Track changes
  useEffect(() => {
    const welcomeChanged =
      welcomeForm.values.welcome_title !== event?.sections?.welcome?.title ||
      welcomeForm.values.welcome_content !== event?.sections?.welcome?.content;

    const highlightsWithoutId = highlights.map(({ _id: _, ...rest }) => rest);
    const faqsWithoutId = faqs.map(({ _id: _, ...rest }) => rest);

    const highlightsChanged =
      JSON.stringify(highlightsWithoutId) !== JSON.stringify(event?.sections?.highlights || []);
    const faqsChanged =
      JSON.stringify(faqsWithoutId) !== JSON.stringify(event?.sections?.faqs || []);

    setHasChanges(welcomeChanged || highlightsChanged || faqsChanged);
  }, [welcomeForm.values, highlights, faqs, event]);

  // Highlight handlers
  const handleAddHighlight = () => {
    highlightForm.reset();
    setHighlightModal({ open: true, mode: 'create', id: null });
  };

  const handleEditHighlight = (highlightId: string) => {
    const highlight = highlightLookup[highlightId];
    if (highlight) {
      const { _id: _, ...rest } = highlight;
      highlightForm.setValues(rest);
      setHighlightModal({ open: true, mode: 'edit', id: highlightId });
    }
  };

  const handleSaveHighlight = (values: HighlightFormValues) => {
    if (highlightModal.mode === 'create') {
      const newHighlight: Highlight = {
        ...values,
        _id: `h-${Date.now()}-${nextHighlightId}`,
      };
      setHighlights([...highlights, newHighlight]);
      setNextHighlightId(nextHighlightId + 1);
    } else {
      const updated = highlights.map((h) =>
        h._id === highlightModal.id ? { ...values, _id: h._id } : h,
      );
      setHighlights(updated);
    }
    setHighlightModal({ open: false, mode: 'create', id: null });
  };

  const handleDeleteHighlight = (highlightId: string) => {
    setHighlights(highlights.filter((h) => h._id !== highlightId));
  };

  // Highlight drag handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleHighlightDragOver = (dragEvent: any) => {
    setLocalHighlights((items) => move(items, dragEvent));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleHighlightDragEnd = (dragEvent: any) => {
    const { operation } = dragEvent;
    if (!operation) return;

    const draggedId = operation.source.id;
    const draggedHighlight = highlightLookup[draggedId];

    if (!draggedHighlight) {
      console.error('Could not find highlight with id:', draggedId);
      return;
    }

    const newOrder = localHighlights.default || [];
    const newHighlights = newOrder.map((id) => highlightLookup[id]).filter(Boolean) as Highlight[];

    setHighlights(newHighlights);
  };

  // FAQ handlers
  const handleAddFAQ = () => {
    faqForm.reset();
    setFaqModal({ open: true, mode: 'create', id: null });
  };

  const handleEditFAQ = (faqId: string) => {
    const faq = faqLookup[faqId];
    if (faq) {
      const { _id: _, ...rest } = faq;
      faqForm.setValues(rest);
      setFaqModal({ open: true, mode: 'edit', id: faqId });
    }
  };

  const handleSaveFAQ = (values: FAQFormValues) => {
    if (faqModal.mode === 'create') {
      const newFaq: FAQ = {
        ...values,
        _id: `f-${Date.now()}-${nextFaqId}`,
      };
      setFaqs([...faqs, newFaq]);
      setNextFaqId(nextFaqId + 1);
    } else {
      const updated = faqs.map((f) => (f._id === faqModal.id ? { ...values, _id: f._id } : f));
      setFaqs(updated);
    }
    setFaqModal({ open: false, mode: 'create', id: null });
  };

  const handleDeleteFAQ = (faqId: string) => {
    setFaqs(faqs.filter((f) => f._id !== faqId));
  };

  // FAQ drag handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFAQDragOver = (dragEvent: any) => {
    setLocalFaqs((items) => move(items, dragEvent));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFAQDragEnd = (dragEvent: any) => {
    const { operation } = dragEvent;
    if (!operation) return;

    const draggedId = operation.source.id;
    const draggedFaq = faqLookup[draggedId];

    if (!draggedFaq) {
      console.error('Could not find FAQ with id:', draggedId);
      return;
    }

    const newOrder = localFaqs.default || [];
    const newFaqs = newOrder.map((id) => faqLookup[id]).filter(Boolean) as FAQ[];

    setFaqs(newFaqs);
  };

  // Save all changes
  const handleSubmit = async () => {
    try {
      const highlightsForApi = highlights.map(({ _id: _, ...rest }) => ({
        ...rest,
        icon: rest.icon ?? null,
      }));
      const faqsForApi = faqs.map(({ _id: _, ...rest }) => rest);

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
      const apiError = error as ApiError;
      notifications.show({
        title: 'Error',
        message: apiError.data?.message || 'Failed to update content sections',
        color: 'red',
      });
    }
  };

  const handleReset = () => {
    welcomeForm.setValues({
      welcome_title: event?.sections?.welcome?.title || '',
      welcome_content: event?.sections?.welcome?.content || '',
    });
    const timestamp = Date.now();
    const resetHighlights = (event?.sections?.highlights || []).map((highlight, index) => ({
      ...highlight,
      _id: `h-${timestamp}-${index}`,
    }));
    const resetFaqs = (event?.sections?.faqs || []).map((faq, index) => ({
      ...faq,
      _id: `f-${timestamp}-${index}`,
    }));
    setHighlights(resetHighlights);
    setFaqs(resetFaqs);

    const resetHighlightIds = resetHighlights.map((h) => h._id);
    const resetFaqIds = resetFaqs.map((f) => f._id);
    setLocalHighlights({ default: resetHighlightIds });
    setLocalFaqs({ default: resetFaqIds });

    setNextHighlightId(resetHighlights.length + 1);
    setNextFaqId(resetFaqs.length + 1);

    setHasChanges(false);
  };

  return (
    <>
      <div className={cn(parentStyles.section, styles.glassSection)}>
        <h3 className={cn(parentStyles.sectionTitle)}>Content Sections</h3>
        <Text c='dimmed' size='sm' mb='xl'>
          Customize highlights, FAQs, and welcome messages for your event
        </Text>

        <Stack gap='xl'>
          {/* Welcome Section */}
          <div className={cn(styles.welcomeSection)}>
            <Title order={4} className={cn(styles.subsectionTitle)}>
              Welcome Section
            </Title>
            <Stack gap='md'>
              <TextInput
                label='Welcome Title'
                placeholder='Welcome to our event'
                classNames={{ input: styles.formInput ?? '' }}
                {...welcomeForm.getInputProps('welcome_title')}
              />
              <Textarea
                label='Welcome Content'
                placeholder='Enter welcome message for attendees'
                minRows={3}
                classNames={{ input: styles.formTextarea ?? '' }}
                {...welcomeForm.getInputProps('welcome_content')}
              />
            </Stack>
          </div>

          <div className={cn(styles.divider)} />

          {/* Highlights Section */}
          <div className={cn(styles.sectionWrapper)}>
            <Group
              justify={isMobile ? 'center' : 'space-between'}
              mb='md'
              className={cn(styles.sectionHeader)}
            >
              <div className={isMobile ? cn(styles.mobileCenter) : ''}>
                <Title order={4} className={cn(styles.subsectionTitle)}>
                  Event Highlights
                </Title>
                <Text size='sm' c='dimmed' mt='xs'>
                  Key points attendees should know about your event
                </Text>
              </div>
              <Button
                variant='primary'
                onClick={handleAddHighlight}
                className={isMobile ? cn(styles.centerButton) : ''}
              >
                <IconPlus size={16} />
                Add Highlight
              </Button>
            </Group>

            <Text className={cn(styles.dragHint)}>Press down on cards and drag to reorder</Text>

            <DragDropProvider
              onDragOver={handleHighlightDragOver}
              onDragEnd={handleHighlightDragEnd}
            >
              <div className={cn(styles.draggableList)}>
                {highlights.length === 0 ?
                  <div className={cn(styles.emptyState)}>
                    <Text c='dimmed' ta='center'>
                      No highlights added yet
                    </Text>
                  </div>
                : localHighlights.default?.map((id) => {
                    const highlight = highlightLookup[id];
                    if (!highlight) return null;

                    return isMobile ?
                        <DraggableHighlight
                          key={id}
                          id={id}
                          highlight={highlight}
                          onEdit={handleEditHighlight}
                          onDelete={handleDeleteHighlight}
                          isMobile={isMobile}
                        />
                      : <DesktopHighlightCard
                          key={id}
                          id={id}
                          highlight={highlight}
                          onEdit={handleEditHighlight}
                          onDelete={handleDeleteHighlight}
                        />;
                  })
                }
              </div>
            </DragDropProvider>
          </div>

          <div className={cn(styles.divider)} />

          {/* FAQs Section */}
          <div className={cn(styles.sectionWrapper)}>
            <Group
              justify={isMobile ? 'center' : 'space-between'}
              mb='md'
              className={cn(styles.sectionHeader)}
            >
              <div className={isMobile ? cn(styles.mobileCenter) : ''}>
                <Title order={4} className={cn(styles.subsectionTitle)}>
                  Frequently Asked Questions
                </Title>
                <Text size='sm' c='dimmed' mt='xs'>
                  Common questions and answers about your event
                </Text>
              </div>
              <Button
                variant='primary'
                onClick={handleAddFAQ}
                className={isMobile ? cn(styles.centerButton) : ''}
              >
                <IconPlus size={16} />
                Add FAQ
              </Button>
            </Group>

            <Text className={cn(styles.dragHint)}>Press down on cards and drag to reorder</Text>

            <DragDropProvider onDragOver={handleFAQDragOver} onDragEnd={handleFAQDragEnd}>
              <div className={cn(styles.draggableList)}>
                {faqs.length === 0 ?
                  <div className={cn(styles.emptyState)}>
                    <Text c='dimmed' ta='center'>
                      No FAQs added yet
                    </Text>
                  </div>
                : localFaqs.default?.map((id) => {
                    const faq = faqLookup[id];
                    if (!faq) return null;

                    return isMobile ?
                        <DraggableFAQ
                          key={id}
                          id={id}
                          faq={faq}
                          onEdit={handleEditFAQ}
                          onDelete={handleDeleteFAQ}
                          isMobile={isMobile}
                        />
                      : <DesktopFAQCard
                          key={id}
                          id={id}
                          faq={faq}
                          onEdit={handleEditFAQ}
                          onDelete={handleDeleteFAQ}
                        />;
                  })
                }
              </div>
            </DragDropProvider>
          </div>

          {hasChanges && (
            <Group justify='flex-end' mt='xl'>
              <Button variant='secondary' onClick={handleReset}>
                Cancel
              </Button>
              <Button variant='primary' onClick={handleSubmit} disabled={isLoading}>
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
        lockScroll={false}
        classNames={{
          content: styles.modalContent ?? '',
          header: styles.modalHeader ?? '',
        }}
      >
        <form onSubmit={highlightForm.onSubmit(handleSaveHighlight)}>
          <Stack>
            <TextInput
              label='Title'
              placeholder='Enter highlight title'
              required
              classNames={{ input: styles.formInput ?? '' }}
              {...highlightForm.getInputProps('title')}
            />
            <Textarea
              label='Description'
              placeholder='Enter highlight description'
              required
              classNames={{ input: styles.formTextarea ?? '' }}
              {...highlightForm.getInputProps('description')}
            />
            <Group justify='flex-end'>
              <Button
                variant='secondary'
                onClick={() => setHighlightModal({ open: false, mode: 'create', id: null })}
              >
                Cancel
              </Button>
              <Button variant='primary' type='submit'>
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
        lockScroll={false}
        classNames={{
          content: styles.modalContent ?? '',
          header: styles.modalHeader ?? '',
        }}
      >
        <form onSubmit={faqForm.onSubmit(handleSaveFAQ)}>
          <Stack>
            <TextInput
              label='Question'
              placeholder='Enter question'
              required
              classNames={{ input: styles.formInput ?? '' }}
              {...faqForm.getInputProps('question')}
            />
            <Textarea
              label='Answer'
              placeholder='Enter answer'
              minRows={3}
              required
              classNames={{ input: styles.formTextarea ?? '' }}
              {...faqForm.getInputProps('answer')}
            />
            <Group justify='flex-end'>
              <Button
                variant='secondary'
                onClick={() => setFaqModal({ open: false, mode: 'create', id: null })}
              >
                Cancel
              </Button>
              <Button variant='primary' type='submit'>
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
