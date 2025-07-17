import { useMemo } from 'react';
import { Table, Text, Box, Title, Stack, Badge } from '@mantine/core';
import ChatRoomRow from '../ChatRoomRow';
import styles from './styles.module.css';

const ChatRoomsList = ({ chatRooms, eventId, isLoading, onEdit }) => {
  // Group chat rooms by type
  const roomsByType = useMemo(() => {
    const grouped = {
      GLOBAL: [],
      ADMIN: [],
      GREEN_ROOM: [],
    };
    
    chatRooms.forEach(room => {
      if (grouped[room.room_type]) {
        grouped[room.room_type].push(room);
      }
    });
    
    return grouped;
  }, [chatRooms]);

  if (chatRooms.length === 0 && !isLoading) {
    return (
      <Box className={styles.emptyState}>
        <Text c="dimmed" ta="center">
          No chat rooms configured. Click "Add Chat Room" to enable networking.
        </Text>
      </Box>
    );
  }

  const roomTypeInfo = {
    GLOBAL: { title: 'General Chat Rooms', color: 'blue', help: 'Accessible to all event attendees' },
    ADMIN: { title: 'Admin Chat Rooms', color: 'violet', help: 'Restricted to event admins and organizers' },
    GREEN_ROOM: { title: 'Green Room', color: 'teal', help: 'For speakers, admins, and organizers' },
  };

  return (
    <Stack spacing="xl">
      {Object.entries(roomsByType).map(([type, rooms]) => {
        const { title, color, help } = roomTypeInfo[type];
        
        if (rooms.length === 0) return null;
        
        return (
          <Box key={type} className={styles.typeSection}>
            <Box className={styles.typeHeader}>
              <Title order={4}>{title}</Title>
              <Text size="sm" c="dimmed">
                {help} • {rooms.length} room{rooms.length !== 1 ? 's' : ''}
              </Text>
            </Box>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '80px' }}>Type</Table.Th>
                  <Table.Th>Room Name</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th style={{ width: '80px', textAlign: 'center' }}>Messages</Table.Th>
                  <Table.Th style={{ width: '80px', textAlign: 'center' }}>Active</Table.Th>
                  <Table.Th style={{ width: '100px', textAlign: 'center' }}>Status</Table.Th>
                  <Table.Th style={{ width: '70px', textAlign: 'center' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rooms.map(room => (
                  <ChatRoomRow
                    key={room.id}
                    room={room}
                    color={color}
                    onEdit={onEdit}
                  />
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        );
      })}
    </Stack>
  );
};

export default ChatRoomsList;