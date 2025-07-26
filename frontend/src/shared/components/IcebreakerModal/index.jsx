import { useState } from 'react';
import {
  Modal,
  Stack,
  Text,
  Group,
  Avatar,
  Alert,
} from '@mantine/core';
import { IconSend, IconInfoCircle } from '@tabler/icons-react';
import { Button } from '@/shared/components/buttons';
import styles from './styles/index.module.css';

export function IcebreakerModal({
  opened,
  onClose,
  recipient,
  eventIcebreakers = [],
  onSend,
  isLoading = false,
}) {
  const [selectedIcebreaker, setSelectedIcebreaker] = useState('');

  const handleSend = () => {
    if (selectedIcebreaker) {
      onSend(selectedIcebreaker);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setSelectedIcebreaker('');
    onClose();
  };

  const canSend = selectedIcebreaker !== '';

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Send Connection Request"
      size="md"
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
      }}
    >
      <Stack spacing="md" p="lg">
        {/* Recipient info */}
        <div className={styles.recipientSection}>
          <Group spacing="sm">
            <Avatar src={recipient?.avatarUrl} radius="xl" size="md">
              {recipient?.firstName?.[0]?.toUpperCase() || '?'}
            </Avatar>
            <div>
              <Text size="sm" weight={600}>
                {recipient?.firstName} {recipient?.lastName}
              </Text>
              {recipient?.title && (
                <Text size="xs" c="dimmed">
                  {recipient.title}
                </Text>
              )}
            </div>
          </Group>
        </div>

        {eventIcebreakers.length > 0 ? (
          <Text size="sm" c="dimmed" className={styles.instructionText}>
            Choose an icebreaker to start the conversation:
          </Text>
        ) : (
          <Alert 
            icon={<IconInfoCircle size={20} />}
            color="blue"
            variant="light"
            className={styles.infoAlert}
          >
            No icebreakers available for this event. Event organizers haven't set up icebreakers yet.
          </Alert>
        )}

        {eventIcebreakers.length > 0 ? (
          <div className={styles.icebreakerList}>
            {eventIcebreakers.map((icebreaker, index) => (
              <div
                key={index}
                className={`${styles.icebreakerOption} ${
                  selectedIcebreaker === icebreaker ? styles.selected : ''
                }`}
                onClick={() => setSelectedIcebreaker(icebreaker)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedIcebreaker(icebreaker);
                  }
                }}
              >
                <Text size="sm">{icebreaker}</Text>
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.buttonGroup}>
          <Button variant="subtle" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!canSend || eventIcebreakers.length === 0}
            loading={isLoading}
            leftIcon={<IconSend size={16} />}
          >
            Send Request
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}