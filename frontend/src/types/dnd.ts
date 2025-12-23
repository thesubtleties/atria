/**
 * Type definitions for @dnd-kit/react drag and drop events
 *
 * These types are used for the DragDropProvider's onDragOver and onDragEnd handlers.
 * The types are derived from @dnd-kit/abstract but simplified for our use case.
 */

import type {
  DragDropEvents,
  Draggable,
  Droppable,
  DragDropManager,
  DragOperation,
} from '@dnd-kit/abstract';

/**
 * Extract the event parameter type from DragDropEvents handlers.
 * These are the types for onDragOver and onDragEnd callbacks.
 */
export type DragOverEvent = Parameters<
  DragDropEvents<Draggable, Droppable, DragDropManager<Draggable, Droppable>>['dragover']
>[0];

export type DragEndEvent = Parameters<
  DragDropEvents<Draggable, Droppable, DragDropManager<Draggable, Droppable>>['dragend']
>[0];

export type DragStartEvent = Parameters<
  DragDropEvents<Draggable, Droppable, DragDropManager<Draggable, Droppable>>['dragstart']
>[0];

export type DragMoveEvent = Parameters<
  DragDropEvents<Draggable, Droppable, DragDropManager<Draggable, Droppable>>['dragmove']
>[0];

/**
 * Re-export commonly used types for convenience
 */
export type { DragOperation, Draggable, Droppable };
