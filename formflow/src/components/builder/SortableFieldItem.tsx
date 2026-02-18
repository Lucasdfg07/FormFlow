'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilderStore, BuilderField } from '@/stores/builder-store';
import { GripVertical, Copy, Trash2, ToggleLeft, Eye, EyeOff } from 'lucide-react';
import * as Icons from 'lucide-react';
import { FIELD_TYPES } from '@/types';

interface SortableFieldItemProps {
  field: BuilderField;
  index?: number;
}

export default function SortableFieldItem({ field, index = 0 }: SortableFieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const selectedFieldId = useBuilderStore((s) => s.selectedFieldId);
  const selectField = useBuilderStore((s) => s.selectField);
  const removeField = useBuilderStore((s) => s.removeField);
  const duplicateField = useBuilderStore((s) => s.duplicateField);
  const updateField = useBuilderStore((s) => s.updateField);
  const theme = useBuilderStore((s) => s.theme);

  const isSelected = selectedFieldId === field.id;
  const fieldTypeInfo = FIELD_TYPES.find((ft) => ft.type === field.type);
  const IconComponent = fieldTypeInfo
    ? (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>>)[fieldTypeInfo.icon]
    : null;

  const qColor = theme.questionColor;
  const aColor = theme.answerColor;
  const btnColor = theme.buttonColor;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: isSelected ? `${qColor}12` : `${qColor}08`,
        borderColor: isSelected ? `${qColor}40` : `${qColor}15`,
      }}
      onClick={() => selectField(field.id)}
      className={`group relative backdrop-blur-sm border rounded-xl p-6 cursor-pointer transition-all duration-150 hover:border-opacity-30 ${field.hidden ? 'opacity-60' : ''}`}
    >
      {/* Question number */}
      <div className="flex items-start gap-4">
        {/* Drag handle & number */}
        <div className="flex items-center gap-1 mt-0.5">
          <button
            {...attributes}
            {...listeners}
            className="p-0.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: `${qColor}50` }}
          >
            <GripVertical size={14} />
          </button>
          <span className="text-sm font-semibold w-5 text-right" style={{ color: `${qColor}60` }}>
            {index + 1}
          </span>
        </div>

        {/* Field content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {IconComponent && (
              <IconComponent size={15} style={{ color: `${qColor}60` }} />
            )}
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: `${qColor}50` }}>
              {fieldTypeInfo?.label || field.type}
            </span>
            {field.required && (
              <span className="text-[11px] font-bold" style={{ color: btnColor }}>*</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-base" style={{ color: qColor }}>{field.title}</h4>
            {field.hidden && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200">
                <EyeOff size={10} />
                Oculto
              </span>
            )}
          </div>
          {field.description && (
            <p className="text-sm mt-1" style={{ color: `${qColor}80` }}>{field.description}</p>
          )}

          {/* Preview of choices if applicable */}
          {['multiple_choice', 'checkbox', 'dropdown'].includes(field.type) && field.properties && (
            <div className="mt-3 space-y-1.5">
              {((field.properties as Record<string, unknown>)?.choices as { label: string }[] || []).slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-${field.type === 'checkbox' ? 'sm' : 'full'} border`}
                    style={{ borderColor: `${aColor}30` }}
                  />
                  <span className="text-sm" style={{ color: `${aColor}99` }}>{c.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Rating preview */}
          {field.type === 'rating' && (
            <div className="mt-3 flex gap-1">
              {Array.from({ length: ((field.properties as Record<string, unknown>)?.max as number) || 5 }).map((_, i) => (
                <div key={i} className="w-6 h-6" style={{ color: `${btnColor}40` }}>★</div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); updateField(field.id, { hidden: !field.hidden }); }}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: field.hidden ? '#d97706' : `${qColor}50` }}
            title={field.hidden ? 'Tornar visível para o respondente' : 'Ocultar do respondente'}
          >
            {field.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); updateField(field.id, { required: !field.required }); }}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: field.required ? `${qColor}cc` : `${qColor}50` }}
            title="Obrigatorio"
          >
            <ToggleLeft size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); duplicateField(field.id); }}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: `${qColor}50` }}
            title="Duplicar"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
            className="p-1.5 rounded-md hover:text-red-400 transition-colors"
            style={{ color: `${qColor}50` }}
            title="Remover"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
