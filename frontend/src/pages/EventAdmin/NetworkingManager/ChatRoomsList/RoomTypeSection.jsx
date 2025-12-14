import { Box, Table } from '@mantine/core';
import { DragDropProvider } from '@dnd-kit/react';
import DraggableTableRow from './DraggableTableRow';
import DraggableCard from './DraggableCard';
import ChatRoomRow from '../ChatRoomRow';
import styles from './styles.module.css';

const RoomTypeSection = ({
  type,
  title,
  color,
  help,
  rooms,
  localRooms,
  roomLookup,
  isMobile,
  onEdit,
  handleDragOver,
  handleDragEnd,
}) => {
  if (!rooms || rooms.length === 0) return null;

  return (
    <Box className={styles.typeSection}>
      <Box className={styles.typeHeader}>
        <h4>{title}</h4>
        <p>
          {help} • {rooms.length} room{rooms.length !== 1 ? 's' : ''}
        </p>
      </Box>

      <DragDropProvider onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        {
          isMobile ?
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
            // Desktop: Table view
          : <Table>
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
                    <DraggableTableRow key={roomId} id={roomId} room={room}>
                      <ChatRoomRow room={room} color={color} onEdit={onEdit} isTableRow={true} />
                    </DraggableTableRow>
                  );
                })}
              </Table.Tbody>
            </Table>

        }
      </DragDropProvider>
    </Box>
  );
};

export default RoomTypeSection;
