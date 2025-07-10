import { useState, useEffect } from 'react';
import { Card, Text, Stack, ActionIcon, Group, Center, Badge, Transition } from '@mantine/core';
import { IconMessage, IconX } from '@tabler/icons-react';
import styles from './styles/index.module.css';

export const SessionChat = ({ sessionId, isEnabled = true, onToggle }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  useEffect(() => {
    onToggle?.(isOpen);
  }, [isOpen, onToggle]);

  return (
    <>
      {/* Collapsed State - Floating Chat Button */}
      {!isOpen && (
        <ActionIcon 
          onClick={() => setIsOpen(true)}
          size="xl"
          radius="xl"
          className={styles.floatingChatButton}
          style={{
            position: 'fixed',
            top: '100px',
            right: '24px',
            zIndex: 50
          }}
        >
          <IconMessage size={24} />
        </ActionIcon>
      )}

      {/* Expanded State - Show full chat */}
      <Transition 
        mounted={isOpen} 
        transition="slide-left" 
        duration={300} 
        timingFunction="ease"
      >
        {(styles2) => (
          <Card 
            className={styles.chatSidebar} 
            style={{
              ...styles2,
              position: 'fixed',
              top: '100px',
              right: '24px',
              bottom: '100px',
              width: '320px',
              zIndex: 50
            }}
          >
            <Group justify="space-between" className={styles.header}>
              <Group gap="xs">
                <IconMessage size={18} />
                <Text size="md" fw={500}>Session Chat</Text>
                <Badge size="xs" variant="light" color="green">
                  Coming Soon
                </Badge>
              </Group>
              <ActionIcon 
                onClick={() => setIsOpen(false)}
                variant="subtle"
                size="sm"
              >
                <IconX size={16} />
              </ActionIcon>
            </Group>

            <Stack gap="md" className={styles.chatContent}>
              <Center className={styles.placeholder}>
                <Stack align="center" gap="xs">
                  <IconMessage size={48} stroke={1} color="var(--mantine-color-gray-4)" />
                  <Text size="sm" color="dimmed" ta="center">
                    Session chat will be available here during live sessions
                  </Text>
                  <Text size="xs" color="dimmed" ta="center">
                    Participants will be able to ask questions and interact in real-time
                  </Text>
                </Stack>
              </Center>
            </Stack>
          </Card>
        )}
      </Transition>
    </>
  );
};