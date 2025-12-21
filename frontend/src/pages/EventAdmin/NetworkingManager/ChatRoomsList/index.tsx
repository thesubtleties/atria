import { useMemo, useState, useEffect } from 'react';
import { Text } from '@mantine/core';
import { LoadingOverlay } from '@/shared/components/loading';
import { useMediaQuery } from '@mantine/hooks';
import { move } from '@dnd-kit/helpers';
import { notifications } from '@mantine/notifications';
import { useReorderChatRoomMutation } from '@/app/features/chat/api';
import { cn } from '@/lib/cn';
import RoomTypeSection from './RoomTypeSection';
import EmptyState from './EmptyState';
import type { ChatRoom, ChatRoomType, ApiError } from '@/types';
import styles from './styles.module.css';

type RoomWithId = ChatRoom & { _id: string; message_count?: number };

type ChatRoomsListProps = {
  chatRooms: ChatRoom[];
  isLoading: boolean;
  onEdit: (room: ChatRoom) => void;
};

type RoomsByType = Record<ChatRoomType, RoomWithId[]>;
type LocalRooms = Record<ChatRoomType, string[]>;
type RoomLookup = Record<string, RoomWithId>;

const ChatRoomsList = ({ chatRooms, isLoading, onEdit }: ChatRoomsListProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [reorderChatRoom] = useReorderChatRoomMutation();

  const [rooms, setRooms] = useState<RoomWithId[]>(() => {
    return chatRooms.map((room) => ({
      ...room,
      _id: `room-${room.id}`,
    }));
  });

  useEffect(() => {
    setRooms(
      chatRooms.map((room) => ({
        ...room,
        _id: `room-${room.id}`,
      })),
    );
  }, [chatRooms]);

  const [localRooms, setLocalRooms] = useState<LocalRooms>({
    GLOBAL: [],
    PUBLIC: [],
    BACKSTAGE: [],
    ADMIN: [],
    GREEN_ROOM: [],
  });

  const roomLookup = useMemo<RoomLookup>(() => {
    const lookup: RoomLookup = {};
    rooms.forEach((room) => {
      lookup[room._id] = room;
    });
    return lookup;
  }, [rooms]);

  const roomsByType = useMemo<RoomsByType>(() => {
    const grouped: RoomsByType = {
      GLOBAL: [],
      PUBLIC: [],
      BACKSTAGE: [],
      ADMIN: [],
      GREEN_ROOM: [],
    };

    rooms.forEach((room) => {
      if (grouped[room.room_type]) {
        grouped[room.room_type].push(room);
      }
    });

    // Sort each group by display_order
    (Object.keys(grouped) as ChatRoomType[]).forEach((type) => {
      grouped[type].sort((a, b) => a.display_order - b.display_order);
    });

    return grouped;
  }, [rooms]);

  useEffect(() => {
    const grouped: LocalRooms = {
      GLOBAL: [],
      PUBLIC: [],
      BACKSTAGE: [],
      ADMIN: [],
      GREEN_ROOM: [],
    };

    (Object.entries(roomsByType) as [ChatRoomType, RoomWithId[]][]).forEach(([type, typeRooms]) => {
      grouped[type] = typeRooms.map((room) => room._id);
    });

    setLocalRooms(grouped);
  }, [roomsByType]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragOver = (roomType: ChatRoomType) => (event: any) => {
    setLocalRooms((current) => {
      const result = move(current, event);
      if (result && result[roomType]) {
        return {
          ...current,
          [roomType]: result[roomType],
        };
      }
      return current;
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (roomType: ChatRoomType) => async (event: any) => {
      const { operation } = event;
      if (!operation) return;

      const draggedId = operation.source.id;
      const draggedRoom = roomLookup[draggedId];

      if (!draggedRoom) return;

      const newOrder = localRooms[roomType] || [];
      const newIndex = newOrder.indexOf(draggedId);

      if (newIndex === -1) return;

      // Calculate new display_order
      let newDisplayOrder: number;
      const roomsInType = newOrder.map((id) => roomLookup[id]).filter(Boolean);

      if (newIndex === 0) {
        const nextRoom = roomsInType[1];
        newDisplayOrder = nextRoom ? nextRoom.display_order / 2 : 1;
      } else if (newIndex === roomsInType.length - 1) {
        const prevRoom = roomsInType[newIndex - 1];
        newDisplayOrder = prevRoom ? prevRoom.display_order + 10 : (newIndex + 1) * 10;
      } else {
        const prevRoom = roomsInType[newIndex - 1];
        const nextRoom = roomsInType[newIndex + 1];

        if (prevRoom && nextRoom) {
          newDisplayOrder = (prevRoom.display_order + nextRoom.display_order) / 2;
        } else {
          newDisplayOrder = (newIndex + 1) * 10;
        }
      }

      try {
        await reorderChatRoom({
          roomId: draggedRoom.id,
          display_order: newDisplayOrder,
        }).unwrap();

        notifications.show({
          title: 'Success',
          message: `Moved ${draggedRoom.name} successfully`,
          color: 'green',
        });
      } catch (err) {
        const error = err as ApiError;
        notifications.show({
          title: 'Error',
          message: error.data?.message || 'Failed to reorder chat room',
          color: 'red',
        });

        // Revert on error
        const grouped: LocalRooms = {
          GLOBAL: [],
          PUBLIC: [],
          BACKSTAGE: [],
          ADMIN: [],
          GREEN_ROOM: [],
        };

        (Object.entries(roomsByType) as [ChatRoomType, RoomWithId[]][]).forEach(
          ([type, typeRooms]) => {
            grouped[type] = typeRooms.map((room) => room._id);
          },
        );

        setLocalRooms(grouped);
      }
    };

  if (chatRooms.length === 0 && !isLoading) {
    return <EmptyState />;
  }

  const roomTypeInfo: Record<
    string,
    { title: string; color: string; help: string }
  > = {
    GLOBAL: {
      title: 'General Chat Rooms',
      color: 'blue',
      help: 'Accessible to all event attendees',
    },
    ADMIN: {
      title: 'Admin Chat Rooms',
      color: 'violet',
      help: 'Restricted to event admins and organizers',
    },
    GREEN_ROOM: {
      title: 'Green Room',
      color: 'teal',
      help: 'For speakers, admins, and organizers',
    },
  };

  return (
    <div className={styles.roomsList}>
      <LoadingOverlay visible={isLoading} />

      {isMobile && chatRooms.length > 0 && (
        <Text className={cn(styles.dragHint)}>Press and hold cards to reorder</Text>
      )}

      {Object.entries(roomTypeInfo).map(([type, { title, color, help }]) => {
        const typeRooms = roomsByType[type as ChatRoomType];
        if (!typeRooms || typeRooms.length === 0) return null;

        return (
          <RoomTypeSection
            key={type}
            type={type as ChatRoomType}
            title={title}
            color={color}
            help={help}
            rooms={typeRooms}
            localRooms={localRooms}
            roomLookup={roomLookup}
            isMobile={isMobile ?? false}
            onEdit={onEdit}
            onDragOver={handleDragOver(type as ChatRoomType)}
            onDragEnd={handleDragEnd(type as ChatRoomType)}
          />
        );
      })}
    </div>
  );
};

export default ChatRoomsList;

