'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Assignment, CourseGroup } from '@/types/scheduler';
import clsx from 'clsx';

interface AssignmentCellProps {
  teacherId: string;
  assignment: Assignment | null;
  courseGroup: CourseGroup;
  courseName: string;
  onDrop?: (draggedAssignment: Assignment, targetTeacherId: string, targetCourse: string) => void;
}

export default function AssignmentCell({
  teacherId,
  assignment,
  courseGroup,
  courseName,
  onDrop,
}: AssignmentCellProps) {
  const cellId = `${teacherId}-${courseGroup.id}-${courseName}`;

  // Set up draggable if there's an assignment
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    transform: dragTransform,
    isDragging,
  } = useDraggable({
    id: `drag-${cellId}`,
    data: {
      assignment,
      teacherId,
      courseGroup: courseGroup.id,
    },
    disabled: !assignment,
  });

  // Set up droppable
  const {
    setNodeRef: setDropRef,
    isOver,
  } = useDroppable({
    id: `drop-${cellId}`,
    data: {
      teacherId,
      courseGroup: courseGroup.id,
      courseName,
    },
  });

  const dragStyle = dragTransform
    ? {
        transform: CSS.Transform.toString(dragTransform),
      }
    : undefined;

  // Render empty cell
  if (!assignment) {
    return (
      <div
        ref={setDropRef}
        className={clsx(
          'flex min-h-[36px] items-center justify-center rounded text-center text-gray-300 transition-colors',
          isOver && 'ring-2 ring-blue-500 ring-offset-1'
        )}
      >
        -
      </div>
    );
  }

  // Render cell with assignment
  return (
    <div
      ref={node => {
        setDragRef(node);
        setDropRef(node);
      }}
      {...dragAttributes}
      {...dragListeners}
      style={{
        ...dragStyle,
        backgroundColor: courseGroup.color,
      }}
      className={clsx(
        'flex cursor-move items-center justify-center rounded px-2 py-1 text-center font-semibold transition-all',
        isDragging && 'opacity-50',
        isOver && 'ring-2 ring-blue-500 ring-offset-1',
        'hover:shadow-md'
      )}
    >
      <span className="text-sm">{assignment.load}</span>
    </div>
  );
}
