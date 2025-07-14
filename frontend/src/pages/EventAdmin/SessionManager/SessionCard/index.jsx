import { useState, useCallback, useEffect } from 'react';
import {
  TextInput,
  Textarea,
  Select,
  Group,
  Button,
  Text,
  ActionIcon,
  Menu,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { 
  IconDots, 
  IconTrash, 
  IconAlertCircle 
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useUpdateSessionMutation, useDeleteSessionMutation } from '@/app/features/sessions/api';
import { SessionSpeakers } from '@/pages/Session/SessionSpeakers';
import { modals } from '@mantine/modals';
import { validateField, validateTimeOrder } from '../schemas/sessionCardSchema';
import styles from '../styles/index.module.css';

const SESSION_TYPES = [
  { value: 'KEYNOTE', label: 'Keynote' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'PANEL', label: 'Panel' },
  { value: 'PRESENTATION', label: 'Presentation' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'QA', label: 'Q&A' },
];

export const SessionCard = ({ session, eventId, hasConflict }) => {
  const [updateSession] = useUpdateSessionMutation();
  const [deleteSession] = useDeleteSessionMutation();

  // Local state for immediate UI updates
  const [title, setTitle] = useState(session.title);
  const [description, setDescription] = useState(session.description || '');
  const [shortDescription, setShortDescription] = useState(session.short_description || '');
  const [sessionType, setSessionType] = useState(session.session_type);
  const [startTime, setStartTime] = useState(session.start_time);
  const [endTime, setEndTime] = useState(session.end_time);
  const [streamUrl, setStreamUrl] = useState(session.stream_url || '');
  
  // Validation error states
  const [errors, setErrors] = useState({});

  // Debounce values for auto-save
  const [debouncedTitle] = useDebouncedValue(title, 500);
  const [debouncedDescription] = useDebouncedValue(description, 500);
  const [debouncedShortDescription] = useDebouncedValue(shortDescription, 500);
  const [debouncedStreamUrl] = useDebouncedValue(streamUrl, 500);

  // Auto-save when debounced values change
  const handleUpdate = useCallback(async (updates) => {
    try {
      await updateSession({
        id: session.id,
        ...updates,
      }).unwrap();
    } catch (error) {
      console.error('Failed to update session:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update session',
        color: 'red',
      });
    }
  }, [session.id, updateSession]);

  // Validate field before updating
  const validateAndUpdate = useCallback((field, value) => {
    const validation = validateField(field, value);
    
    if (!validation.success) {
      setErrors(prev => ({ ...prev, [field]: validation.error.errors[0].message }));
      return false;
    }
    
    // Clear error if validation passes
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    
    return true;
  }, []);

  // Update on debounced changes
  useEffect(() => {
    if (debouncedTitle !== session.title && validateAndUpdate('title', debouncedTitle)) {
      handleUpdate({ title: debouncedTitle });
    }
  }, [debouncedTitle, session.title, handleUpdate, validateAndUpdate]);

  useEffect(() => {
    if (debouncedDescription !== session.description) {
      handleUpdate({ description: debouncedDescription });
    }
  }, [debouncedDescription, session.description, handleUpdate]);

  useEffect(() => {
    if (debouncedShortDescription !== session.short_description && validateAndUpdate('short_description', debouncedShortDescription)) {
      handleUpdate({ short_description: debouncedShortDescription });
    }
  }, [debouncedShortDescription, session.short_description, handleUpdate, validateAndUpdate]);

  useEffect(() => {
    if (debouncedStreamUrl !== session.stream_url && (debouncedStreamUrl === '' || validateAndUpdate('stream_url', debouncedStreamUrl))) {
      handleUpdate({ stream_url: debouncedStreamUrl });
    }
  }, [debouncedStreamUrl, session.stream_url, handleUpdate, validateAndUpdate]);

  // Calculate duration
  const calculateDuration = (start, end) => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleTimeChange = (field, value) => {
    if (!value) return;
    
    // Validate time format
    if (!validateAndUpdate(field, value)) {
      return;
    }
    
    // Update local state
    if (field === 'start_time') {
      setStartTime(value);
      // Validate time order
      const timeOrderValidation = validateTimeOrder(value, endTime);
      if (!timeOrderValidation.success) {
        setErrors(prev => ({ ...prev, time_order: timeOrderValidation.error.message }));
        return;
      }
    } else {
      setEndTime(value);
      // Validate time order
      const timeOrderValidation = validateTimeOrder(startTime, value);
      if (!timeOrderValidation.success) {
        setErrors(prev => ({ ...prev, time_order: timeOrderValidation.error.message }));
        return;
      }
    }
    
    // Clear time order error if validation passes
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.time_order;
      return newErrors;
    });
    
    const updates = { [field]: value };
    handleUpdate(updates);
  };

  const handleDelete = () => {
    modals.openConfirmModal({
      title: 'Delete Session',
      children: (
        <Text size="sm">
          Are you sure you want to delete "{session.title}"? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteSession(session.id).unwrap();
        } catch (error) {
          console.error('Failed to delete session:', error);
        }
      },
    });
  };


  return (
    <div className={`${styles.sessionCard} ${hasConflict ? styles.hasConflict : ''}`}>
      {/* Header with title and actions */}
      <div className={styles.header}>
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant="unstyled"
          className={styles.titleInput}
          placeholder="Session Title"
          error={errors.title}
        />
        
        {/* Actions Menu */}
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item 
              color="red" 
              icon={<IconTrash size={14} />}
              onClick={handleDelete}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>

      {/* Time Block */}
      <div className={styles.timeBlock}>
        <Group>
          <TimeInput
            value={startTime}
            onChange={(event) => handleTimeChange('start_time', event.target.value)}
            format="24"
            className={styles.timeInput}
            error={errors.start_time}
          />
          <Text size="sm" c="dimmed">to</Text>
          <TimeInput
            value={endTime}
            onChange={(event) => handleTimeChange('end_time', event.target.value)}
            format="24"
            className={styles.timeInput}
            error={errors.end_time || errors.time_order}
          />
        </Group>
        
        {/* Pills - pushed to the right */}
        <Group ml="auto" gap="sm">
          <div className={styles.durationPill}>
            {calculateDuration(startTime, endTime)}
          </div>
          {hasConflict && (
            <div className={styles.conflictPill}>
              <IconAlertCircle size={12} />
              Time Conflict
            </div>
          )}
        </Group>
      </div>

      {/* Content */}
      <div className={styles.content}>

        {/* Info Bar */}
        <Group className={styles.infoBar}>
          <Select
            value={sessionType}
            onChange={(value) => {
              setSessionType(value);
              handleUpdate({ session_type: value });
            }}
            data={SESSION_TYPES}
            size="sm"
            style={{ width: 200 }}
            styles={{
              input: { cursor: 'pointer' },
              rightSection: { pointerEvents: 'none' }
            }}
          />
          <TextInput
            placeholder="Stream URL (e.g., Vimeo URL)"
            size="sm"
            style={{ flex: 1 }}
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            error={errors.stream_url}
          />
        </Group>

        {/* Speakers */}
        <div className={styles.speakersSection}>
          <SessionSpeakers 
            sessionId={session.id} 
            canEdit={true}
          />
        </div>

        {/* Short Description */}
        <Textarea
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Short description for agenda (max 200 characters)"
          maxLength={200}
          autosize
          minRows={1}
          maxRows={3}
          size="sm"
          error={errors.short_description}
        />

        {/* Full Description */}
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Full session description"
          autosize
          minRows={2}
          maxRows={6}
          className={styles.descriptionTextarea}
        />
      </div>
    </div>
  );
};