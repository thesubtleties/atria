import { Table, ActionIcon } from '@mantine/core';
import { IconGripVertical } from '@tabler/icons-react';
import { useSortable } from '@dnd-kit/react/sortable';
import { cn } from '@/lib/cn';
import type { ChatRoom } from '@/types';
import styles from './styles.module.css';

type DraggableTableRowProps = {
  id: string;
  room: ChatRoom;
  children: React.ReactNode;
};

const DraggableTableRow = ({ id, room: _room, children }: DraggableTableRowProps) => {
  // @ts-expect-error - dnd-kit types are not fully compatible with our usage
  const { ref, isDragging } = useSortable({ id });

  return (
    <Table.Tr ref={ref} className={cn(styles.draggableRow, isDragging && styles.dragging)}>
      <Table.Td className={cn(styles.dragHandleCell)}>
        <ActionIcon variant='subtle' size='sm' className={cn(styles.dragHandle)}>
          <IconGripVertical size={16} />
        </ActionIcon>
      </Table.Td>
      {children}
    </Table.Tr>
  );
};

export default DraggableTableRow;
