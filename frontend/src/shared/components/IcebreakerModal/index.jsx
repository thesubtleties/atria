import { useState } from 'react';
import {
  Modal,
  Stack,
  Text,
  Button,
  Group,
  Avatar,
} from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
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
      size="lg"
      className={styles.modal}
    >
      <Stack spacing="md">
        {/* Recipient info */}
        <Group spacing="sm" className={styles.recipientInfo}>
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

        <Text size="sm" c="dimmed">
          {eventIcebreakers.length > 0 
            ? 'Choose an icebreaker to start the conversation:'
            : 'No icebreakers available for this event.'
          }
        </Text>

        {eventIcebreakers.length > 0 ? (
          <Stack spacing="xs" className={styles.icebreakerList}>
            {eventIcebreakers.map((icebreaker, index) => (
              <div
                key={index}
                className={`${styles.icebreakerOption} ${
                  selectedIcebreaker === icebreaker ? styles.selected : ''
                }`}
                onClick={() => setSelectedIcebreaker(icebreaker)}
              >
                <Text size="sm">{icebreaker}</Text>
              </div>
            ))}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            Event organizers haven't set up icebreakers yet.
          </Text>
        )}

        <Group position="right" mt="md">
          <Button variant="default" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            leftIcon={<IconSend size={16} />}
            onClick={handleSend}
            disabled={!canSend || eventIcebreakers.length === 0}
            loading={isLoading}
          >
            Send Request
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}