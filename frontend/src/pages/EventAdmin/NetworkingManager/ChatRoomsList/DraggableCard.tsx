import { useSortable } from '@dnd-kit/react/sortable';
import ChatRoomRow from '../ChatRoomRow';
import { cn } from '@/lib/cn';
import type { ChatRoom } from '@/types';
import styles from './styles.module.css';

type DraggableCardProps = {
  id: string;
  room: ChatRoom & { message_count?: number };
  color: string;
  onEdit: (room: ChatRoom) => void;
};

const DraggableCard = ({ id, room, color, onEdit }: DraggableCardProps) => {
  // @ts-expect-error - dnd-kit types are not fully compatible with our usage
  const { ref, isDragging } = useSortable({ id });

  return (
    <div ref={ref} className={cn(styles.mobileCard, isDragging && styles.dragging)}>
      <ChatRoomRow room={room} color={color} onEdit={onEdit} isMobile={true} />
    </div>
  );
};

export default DraggableCard;
