import { useState, useEffect } from 'react';
import { 
  TextInput, 
  Textarea, 
  Stack, 
  Group, 
  Button,
  Paper,
  Title,
  Text,
  Card,
  ActionIcon,
  Divider,
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
import { useUpdateEventMutation } from '@/app/features/events/api';
import { highlightSchema, faqSchema } from '../schemas/eventSettingsSchemas';
import styles from './styles.module.css';

const ContentSections = ({ event, eventId }) => {
  const [updateEvent, { isLoading }] = useUpdateEventMutation();
  const [hasChanges, setHasChanges] = useState(false);
  
  // Modal states
  const [highlightModal, setHighlightModal] = useState({ open: false, mode: 'create', index: null });
  const [faqModal, setFaqModal] = useState({ open: false, mode: 'create', index: null });

  // Drag state
  const [draggedHighlight, setDraggedHighlight] = useState(null);
  const [dragOverHighlightIndex, setDragOverHighlightIndex] = useState(null);
  const [draggedFAQ, setDraggedFAQ] = useState(null);
  const [dragOverFAQIndex, setDragOverFAQIndex] = useState(null);

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

  // State for lists
  const [highlights, setHighlights] = useState(event?.sections?.highlights || []);
  const [faqs, setFaqs] = useState(event?.sections?.faqs || []);

  // Track changes
  useEffect(() => {
    const welcomeChanged = 
      welcomeForm.values.welcome_title !== event?.sections?.welcome?.title ||
      welcomeForm.values.welcome_content !== event?.sections?.welcome?.content;
    
    const highlightsChanged = JSON.stringify(highlights) !== JSON.stringify(event?.sections?.highlights || []);
    const faqsChanged = JSON.stringify(faqs) !== JSON.stringify(event?.sections?.faqs || []);
    
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
    setHighlightModal({ open: true, mode: 'create', index: null });
  };

  const handleEditHighlight = (index) => {
    const highlight = highlights[index];
    highlightForm.setValues(highlight);
    setHighlightModal({ open: true, mode: 'edit', index });
  };

  const handleSaveHighlight = (values) => {
    if (highlightModal.mode === 'create') {
      setHighlights([...highlights, values]);
    } else {
      const updated = [...highlights];
      updated[highlightModal.index] = values;
      setHighlights(updated);
    }
    setHighlightModal({ open: false, mode: 'create', index: null });
  };

  const handleDeleteHighlight = (index) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  // Highlight drag handlers
  const handleHighlightDragStart = (e, index) => {
    setDraggedHighlight({ index, highlight: highlights[index] });
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleHighlightDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedHighlight(null);
    setDragOverHighlightIndex(null);
  };

  const handleHighlightDragOver = (e, index) => {
    e.preventDefault();
    if (!draggedHighlight) return;
    
    e.dataTransfer.dropEffect = 'move';
    
    if (dragOverHighlightIndex !== index) {
      setDragOverHighlightIndex(index);
    }
  };

  const handleHighlightDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverHighlightIndex(null);
    
    if (!draggedHighlight || draggedHighlight.index === targetIndex) {
      return;
    }

    const newHighlights = [...highlights];
    const [removed] = newHighlights.splice(draggedHighlight.index, 1);
    newHighlights.splice(targetIndex, 0, removed);
    setHighlights(newHighlights);
  };

  // FAQ handlers
  const handleAddFAQ = () => {
    faqForm.reset();
    setFaqModal({ open: true, mode: 'create', index: null });
  };

  const handleEditFAQ = (index) => {
    const faq = faqs[index];
    faqForm.setValues(faq);
    setFaqModal({ open: true, mode: 'edit', index });
  };

  const handleSaveFAQ = (values) => {
    if (faqModal.mode === 'create') {
      setFaqs([...faqs, values]);
    } else {
      const updated = [...faqs];
      updated[faqModal.index] = values;
      setFaqs(updated);
    }
    setFaqModal({ open: false, mode: 'create', index: null });
  };

  const handleDeleteFAQ = (index) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  // FAQ drag handlers
  const handleFAQDragStart = (e, index) => {
    setDraggedFAQ({ index, faq: faqs[index] });
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleFAQDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedFAQ(null);
    setDragOverFAQIndex(null);
  };

  const handleFAQDragOver = (e, index) => {
    e.preventDefault();
    if (!draggedFAQ) return;
    
    e.dataTransfer.dropEffect = 'move';
    
    if (dragOverFAQIndex !== index) {
      setDragOverFAQIndex(index);
    }
  };

  const handleFAQDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverFAQIndex(null);
    
    if (!draggedFAQ || draggedFAQ.index === targetIndex) {
      return;
    }

    const newFAQs = [...faqs];
    const [removed] = newFAQs.splice(draggedFAQ.index, 1);
    newFAQs.splice(targetIndex, 0, removed);
    setFaqs(newFAQs);
  };

  // Save all changes
  const handleSubmit = async () => {
    try {
      await updateEvent({
        id: eventId,
        sections: {
          welcome: {
            title: welcomeForm.values.welcome_title,
            content: welcomeForm.values.welcome_content,
          },
          highlights,
          faqs,
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
    setHighlights(event?.sections?.highlights || []);
    setFaqs(event?.sections?.faqs || []);
    setHasChanges(false);
  };

  return (
    <>
      <Paper className={styles.section}>
        <Title order={3} mb="lg">Content Sections</Title>
        
        <Stack spacing="xl">
          {/* Welcome Section */}
          <div>
            <Title order={4} mb="md">Welcome Section</Title>
            <Stack spacing="md">
              <TextInput
                label="Welcome Title"
                placeholder="Welcome to our event"
                {...welcomeForm.getInputProps('welcome_title')}
              />
              <Textarea
                label="Welcome Content"
                placeholder="Enter welcome message for attendees"
                minRows={3}
                {...welcomeForm.getInputProps('welcome_content')}
              />
            </Stack>
          </div>

          <Divider />

          {/* Highlights Section */}
          <div>
            <Group justify="space-between" mb="md">
              <Title order={4}>Event Highlights</Title>
              <Button
                size="sm"
                leftSection={<IconPlus size={16} />}
                onClick={handleAddHighlight}
              >
                Add Highlight
              </Button>
            </Group>

            <Stack>
              {highlights.length === 0 ? (
                <Text c="dimmed" ta="center" py="md">
                  No highlights added yet
                </Text>
              ) : (
                highlights.map((highlight, index) => (
                  <Card
                    key={index}
                    withBorder
                    p="sm"
                    draggable
                    onDragStart={(e) => handleHighlightDragStart(e, index)}
                    onDragEnd={handleHighlightDragEnd}
                    onDragOver={(e) => handleHighlightDragOver(e, index)}
                    onDrop={(e) => handleHighlightDrop(e, index)}
                    className={
                      dragOverHighlightIndex === index && draggedHighlight?.index !== index
                        ? styles.dragOver
                        : ''
                    }
                    style={{
                      cursor: 'move',
                      opacity: draggedHighlight?.index === index ? 0.5 : 1,
                    }}
                  >
                    <Group justify="space-between">
                      <Group>
                        <IconGripVertical size={18} className={styles.dragHandle} />
                        <IconStarFilled size={20} />
                        <div>
                          <Text fw={500}>{highlight.title}</Text>
                          <Text size="sm" c="dimmed">{highlight.description}</Text>
                        </div>
                      </Group>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => handleEditHighlight(index)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDeleteHighlight(index)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Card>
                ))
              )}
            </Stack>
          </div>

          <Divider />

          {/* FAQs Section */}
          <div>
            <Group justify="space-between" mb="md">
              <Title order={4}>Frequently Asked Questions</Title>
              <Button
                size="sm"
                leftSection={<IconPlus size={16} />}
                onClick={handleAddFAQ}
              >
                Add FAQ
              </Button>
            </Group>

            <Stack>
              {faqs.length === 0 ? (
                <Text c="dimmed" ta="center" py="md">
                  No FAQs added yet
                </Text>
              ) : (
                faqs.map((faq, index) => (
                  <Card
                    key={index}
                    withBorder
                    p="sm"
                    draggable
                    onDragStart={(e) => handleFAQDragStart(e, index)}
                    onDragEnd={handleFAQDragEnd}
                    onDragOver={(e) => handleFAQDragOver(e, index)}
                    onDrop={(e) => handleFAQDrop(e, index)}
                    className={
                      dragOverFAQIndex === index && draggedFAQ?.index !== index
                        ? styles.dragOver
                        : ''
                    }
                    style={{
                      cursor: 'move',
                      opacity: draggedFAQ?.index === index ? 0.5 : 1,
                    }}
                  >
                    <Group justify="space-between" align="flex-start">
                      <Group align="flex-start">
                        <IconGripVertical size={18} className={styles.dragHandle} />
                        <IconQuestionMark size={20} />
                        <div style={{ flex: 1 }}>
                          <Text fw={500}>{faq.question}</Text>
                          <Text size="sm" c="dimmed" mt="xs">{faq.answer}</Text>
                        </div>
                      </Group>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => handleEditFAQ(index)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDeleteFAQ(index)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Card>
                ))
              )}
            </Stack>
          </div>

          {hasChanges && (
            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={isLoading}>
                Save Changes
              </Button>
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Highlight Modal */}
      <Modal
        opened={highlightModal.open}
        onClose={() => setHighlightModal({ open: false, mode: 'create', index: null })}
        title={highlightModal.mode === 'create' ? 'Add Highlight' : 'Edit Highlight'}
      >
        <form onSubmit={highlightForm.onSubmit(handleSaveHighlight)}>
          <Stack>
            <TextInput
              label="Title"
              placeholder="Enter highlight title"
              required
              {...highlightForm.getInputProps('title')}
            />
            <Textarea
              label="Description"
              placeholder="Enter highlight description"
              required
              {...highlightForm.getInputProps('description')}
            />
            <Select
              label="Icon"
              data={iconOptions}
              {...highlightForm.getInputProps('icon')}
            />
            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => setHighlightModal({ open: false, mode: 'create', index: null })}
              >
                Cancel
              </Button>
              <Button type="submit">
                {highlightModal.mode === 'create' ? 'Add' : 'Update'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* FAQ Modal */}
      <Modal
        opened={faqModal.open}
        onClose={() => setFaqModal({ open: false, mode: 'create', index: null })}
        title={faqModal.mode === 'create' ? 'Add FAQ' : 'Edit FAQ'}
      >
        <form onSubmit={faqForm.onSubmit(handleSaveFAQ)}>
          <Stack>
            <TextInput
              label="Question"
              placeholder="Enter question"
              required
              {...faqForm.getInputProps('question')}
            />
            <Textarea
              label="Answer"
              placeholder="Enter answer"
              minRows={3}
              required
              {...faqForm.getInputProps('answer')}
            />
            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => setFaqModal({ open: false, mode: 'create', index: null })}
              >
                Cancel
              </Button>
              <Button type="submit">
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