'use client';

import { useBuilderStore, BuilderField } from '@/stores/builder-store';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableFieldItem from './SortableFieldItem';
import { FileText } from 'lucide-react';

function getFontSizePx(size: string) {
  switch (size) {
    case 'small': return '14px';
    case 'large': return '20px';
    default: return '16px';
  }
}

function getRoundness(roundness: string) {
  switch (roundness) {
    case 'none': return '0px';
    case 'small': return '4px';
    case 'large': return '16px';
    default: return '8px';
  }
}

export default function BuilderCanvas() {
  const fields = useBuilderStore((s) => s.fields);
  const reorderFields = useBuilderStore((s) => s.reorderFields);
  const theme = useBuilderStore((s) => s.theme);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderFields(active.id as string, over.id as string);
    }
  };

  const canvasStyle: React.CSSProperties = {
    backgroundColor: theme.backgroundColor,
    backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
    backgroundSize: theme.backgroundImage ? 'cover' : undefined,
    backgroundPosition: theme.backgroundImage ? 'center' : undefined,
    fontFamily: theme.fontFamily,
    fontSize: getFontSizePx(theme.fontSize),
  };

  if (fields.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center transition-all duration-300" style={canvasStyle}>
        <div className="text-center">
          <div
            className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
            style={{
              borderRadius: getRoundness(theme.roundness),
              backgroundColor: `${theme.questionColor}15`,
            }}
          >
            <FileText size={28} style={{ color: `${theme.questionColor}99` }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: theme.questionColor }}>
            Comece a construir
          </h3>
          <p className="text-sm max-w-xs" style={{ color: `${theme.questionColor}80` }}>
            Clique em &quot;Adicionar campo&quot; para comecar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex justify-center transition-all duration-300" style={canvasStyle}>
      <div className="w-full max-w-2xl py-12 px-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {fields.map((field: BuilderField, index: number) => (
                <SortableFieldItem key={field.id} field={field} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
