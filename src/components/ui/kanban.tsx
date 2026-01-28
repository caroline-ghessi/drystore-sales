'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  DndContext,
  rectIntersection,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import type { ReactNode } from 'react';

export type KanbanBoardProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export const KanbanBoard = ({ id, children, className }: KanbanBoardProps) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-lg transition-colors duration-200',
        isOver && 'bg-muted/50 ring-2 ring-primary/20',
        className
      )}
    >
      {children}
    </div>
  );
};

export type KanbanCardProps = {
  id: string;
  name: string;
  index: number;
  parent: string;
  children?: ReactNode;
  className?: string;
};

export const KanbanCard = ({
  id,
  name,
  index,
  parent,
  children,
  className,
}: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data: { index, parent },
    });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'transition-all duration-200 touch-none',
        isDragging && 'opacity-50 z-50 ring-2 ring-primary shadow-lg',
        className
      )}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
    >
      {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
    </div>
  );
};

export type KanbanCardsProps = {
  children: ReactNode;
  className?: string;
};

export const KanbanCards = ({ children, className }: KanbanCardsProps) => (
  <div className={cn('flex flex-col gap-2 p-2', className)}>{children}</div>
);

export type KanbanHeaderProps =
  | {
      children: ReactNode;
    }
  | {
      name: string;
      color: string;
      className?: string;
    };

export const KanbanHeader = (props: KanbanHeaderProps) =>
  'children' in props ? (
    props.children
  ) : (
    <div
      className={cn(
        'flex items-center gap-2 p-3 border-b border-border',
        props.className
      )}
    >
      <div className={cn('w-1 h-6 rounded-full', props.color)} />
      <p className="m-0 font-semibold text-sm">{props.name}</p>
    </div>
  );

export type KanbanProviderProps = {
  children: ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
  className?: string;
};

export const KanbanProvider = ({
  children,
  onDragEnd,
  className,
}: KanbanProviderProps) => (
  <DndContext onDragEnd={onDragEnd} collisionDetection={rectIntersection}>
    <div className={cn('flex gap-4', className)}>{children}</div>
  </DndContext>
);

export type { DragEndEvent };
