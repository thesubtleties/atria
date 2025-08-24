import { useMemo, useState, useEffect } from 'react';
import { Table, Text, Box, ActionIcon, LoadingOverlay } from '@mantine/core';
import { IconGripVertical } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';
import { useSortable } from '@dnd-kit/react/sortable';
import { notifications } from '@mantine/notifications';
import { useReorderChatRoomMutation } from '@/app/features/chat/api';
import ChatRoomRow from '../ChatRoomRow';
import styles from './styles.module.css';

// Draggable table row wrapper
const DraggableTableRow = ({ id, room, color, onEdit, children }) => {
  const { ref, isDragging } = useSortable({ 
    id,
    type: `chatroom-${room.room_type}`,
    accept: [`chatroom-${room.room_type}`],
  });

  return (
    <Table.Tr 
      ref={ref}
      className={`${styles.draggableRow} ${isDragging ? styles.dragging : ''}`}
    >
      <Table.Td className={styles.dragHandleCell}>
        <ActionIcon 
          variant="subtle" 
          size="sm" 
          className={styles.dragHandle}
        >
          <IconGripVertical size={16} />
        </ActionIcon>
      </Table.Td>
      {children}
    </Table.Tr>
  );
};

// Draggable card wrapper for mobile
const DraggableCard = ({ id, room, color, onEdit }) => {
  const { ref, isDragging } = useSortable({ 
    id,
    type: `chatroom-${room.room_type}`,
    accept: [`chatroom-${room.room_type}`],
  });

  return (
    <div 
      ref={ref}
      className={`${styles.mobileCard} ${isDragging ? styles.dragging : ''}`}
    >
      <ChatRoomRow
        room={room}
        color={color}
        onEdit={onEdit}
        isMobile={true}
      />
    </div>
  );
};

const ChatRoomsList = ({ chatRooms, isLoading, onEdit }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [reorderChatRoom] = useReorderChatRoomMutation();
  
  // Initialize rooms with stable IDs
  const [rooms, setRooms] = useState(() => {
    return chatRooms.map((room) => ({
      ...room,
      _id: `room-${room.id}`
    }));
  });

  // Update rooms when chatRooms prop changes
  useEffect(() => {
    setRooms(chatRooms.map((room) => ({
      ...room,
      _id: `room-${room.id}`
    })));
  }, [chatRooms]);

  // Local state for drag and drop per room type
  const [localRooms, setLocalRooms] = useState({
    GLOBAL: [],
    ADMIN: [],
    GREEN_ROOM: []
  });

  // Create lookup maps
  const roomLookup = useMemo(() => {
    const lookup = {};
    rooms.forEach(room => {
      lookup[room._id] = room;
    });
    return lookup;
  }, [rooms]);

  // Group chat rooms by type
  const roomsByType = useMemo(() => {
    const grouped = {
      GLOBAL: [],
      ADMIN: [],
      GREEN_ROOM: [],
    };
    
    rooms.forEach(room => {
      if (grouped[room.room_type]) {
        grouped[room.room_type].push(room);
      }
    });

    // Sort each group by display_order
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => a.display_order - b.display_order);
    });
    
    return grouped;
  }, [rooms]);

  // Initialize local rooms when rooms change
  useEffect(() => {
    const grouped = {
      GLOBAL: [],
      ADMIN: [],
      GREEN_ROOM: []
    };
    
    Object.entries(roomsByType).forEach(([type, typeRooms]) => {
      grouped[type] = typeRooms.map(room => room._id);
    });
    
    setLocalRooms(grouped);
  }, [roomsByType]);

  // Handle drag operations
  const handleDragOver = (roomType) => (event) => {
    setLocalRooms((current) => {
      const result = move(current, event);
      if (result && result[roomType]) {
        return {
          ...current,
          [roomType]: result[roomType]
        };
      }
      return current;
    });
  };

  const handleDragEnd = (roomType) => async (event) => {
    const { operation } = event;
    if (!operation) return;

    const draggedId = operation.source.id;
    const draggedRoom = roomLookup[draggedId];
    
    if (!draggedRoom) {
      console.error('Could not find room with id:', draggedId);
      return;
    }

    // Find new position
    const newOrder = localRooms[roomType] || [];
    const newIndex = newOrder.indexOf(draggedId);
    
    if (newIndex === -1) return;

    // Calculate new display_order
    let newDisplayOrder;
    const roomsInType = newOrder.map(id => roomLookup[id]).filter(Boolean);
    
    if (newIndex === 0) {
      // Moving to the beginning
      const nextRoom = roomsInType[1];
      newDisplayOrder = nextRoom ? nextRoom.display_order / 2 : 1;
    } else if (newIndex === roomsInType.length - 1) {
      // Moving to the end
      const prevRoom = roomsInType[newIndex - 1];
      newDisplayOrder = prevRoom ? prevRoom.display_order + 10 : (newIndex + 1) * 10;
    } else {
      // Moving between two rooms
      const prevRoom = roomsInType[newIndex - 1];
      const nextRoom = roomsInType[newIndex + 1];
      
      if (prevRoom && nextRoom) {
        newDisplayOrder = (prevRoom.display_order + nextRoom.display_order) / 2;
      } else {
        newDisplayOrder = (newIndex + 1) * 10;
      }
    }

    // Update via API
    try {
      await reorderChatRoom({
        roomId: draggedRoom.id,
        display_order: newDisplayOrder
      }).unwrap();

      notifications.show({
        title: 'Success',
        message: `Moved ${draggedRoom.name} successfully`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error reordering room:', error);
      notifications.show({
        title: 'Error',
        message: error.data?.message || 'Failed to reorder chat room',
        color: 'red',
      });
      
      // Revert the local state on error
      const grouped = {
        GLOBAL: [],
        ADMIN: [],
        GREEN_ROOM: []
      };
      
      Object.entries(roomsByType).forEach(([type, typeRooms]) => {
        grouped[type] = typeRooms.map(room => room._id);
      });
      
      setLocalRooms(grouped);
    }
  };

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
    <div className={styles.roomsList}>
      <LoadingOverlay visible={isLoading} />
      
      {/* Mobile hint text */}
      {isMobile && chatRooms.length > 0 && (
        <Text className={styles.dragHint}>
          Press and hold cards to reorder
        </Text>
      )}
      
      {Object.entries(roomTypeInfo).map(([type, { title, color, help }]) => {
        const rooms = roomsByType[type];
        if (!rooms || rooms.length === 0) return null;
        
        return (
          <Box key={type} className={styles.typeSection}>
            <Box className={styles.typeHeader}>
              <h4>{title}</h4>
              <p>
                {help} • {rooms.length} room{rooms.length !== 1 ? 's' : ''}
              </p>
            </Box>
            
            <DragDropProvider 
              onDragOver={handleDragOver(type)}
              onDragEnd={handleDragEnd(type)}
            >
              {isMobile ? (
                // Mobile: Card view
                <div className={styles.mobileCardList}>
                  {(localRooms[type] || []).map((roomId) => {
                    const room = roomLookup[roomId];
                    if (!room) return null;
                    
                    return (
                      <DraggableCard
                        key={roomId}
                        id={roomId}
                        room={room}
                        color={color}
                        onEdit={onEdit}
                      />
                    );
                  })}
                </div>
              ) : (
                // Desktop: Table view
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: '40px' }}></Table.Th>
                      <Table.Th>Room Name</Table.Th>
                      <Table.Th>Description</Table.Th>
                      <Table.Th style={{ width: '80px', textAlign: 'center' }}>Messages</Table.Th>
                      <Table.Th style={{ width: '80px', textAlign: 'center' }}>Active</Table.Th>
                      <Table.Th style={{ width: '100px', textAlign: 'center' }}>Status</Table.Th>
                      <Table.Th style={{ width: '70px', textAlign: 'center' }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {(localRooms[type] || []).map((roomId) => {
                      const room = roomLookup[roomId];
                      if (!room) return null;
                      
                      return (
                        <DraggableTableRow
                          key={roomId}
                          id={roomId}
                          room={room}
                          color={color}
                          onEdit={onEdit}
                        >
                          <ChatRoomRow
                            room={room}
                            color={color}
                            onEdit={onEdit}
                            isTableRow={true}
                          />
                        </DraggableTableRow>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              )}
            </DragDropProvider>
          </Box>
        );
      })}
    </div>
  );
};

export default ChatRoomsList;