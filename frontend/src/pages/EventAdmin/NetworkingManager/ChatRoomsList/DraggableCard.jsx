import { useSortable } from '@dnd-kit/react/sortable';
import ChatRoomRow from '../ChatRoomRow';
import styles from './styles.module.css';

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

export default DraggableCard;