import { Table, ActionIcon } from '@mantine/core';
import { IconGripVertical } from '@tabler/icons-react';
import { useSortable } from '@dnd-kit/react/sortable';
import styles from './styles.module.css';

const DraggableTableRow = ({ id, room, children }) => {
  const { ref, isDragging } = useSortable({
    id,
    type: `chatroom-${room.room_type}`,
    accept: [`chatroom-${room.room_type}`],
  });

  return (
    <Table.Tr ref={ref} className={`${styles.draggableRow} ${isDragging ? styles.dragging : ''}`}>
      <Table.Td className={styles.dragHandleCell}>
        <ActionIcon variant='subtle' size='sm' className={styles.dragHandle}>
          <IconGripVertical size={16} />
        </ActionIcon>
      </Table.Td>
      {children}
    </Table.Tr>
  );
};

export default DraggableTableRow;
