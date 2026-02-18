'use client';

import { useState } from 'react';
import { FIELD_TYPES, FieldType } from '@/types';
import { useBuilderStore } from '@/stores/builder-store';
import * as Icons from 'lucide-react';
import { Plus, Search, X, EyeOff } from 'lucide-react';

const categoryConfig: Record<string, { label: string; icon: string }> = {
  text: { label: 'Texto & Video', icon: 'AlignLeft' },
  contact: { label: 'Contato', icon: 'User' },
  choice: { label: 'Escolha', icon: 'CircleDot' },
  number: { label: 'Avaliacao & Ranking', icon: 'Star' },
  advanced: { label: 'Outros', icon: 'Hash' },
  layout: { label: 'Layout', icon: 'Layers' },
};

export default function FieldPalette() {
  const addField = useBuilderStore((s) => s.addField);
  const fields = useBuilderStore((s) => s.fields);
  const selectField = useBuilderStore((s) => s.selectField);
  const selectedFieldId = useBuilderStore((s) => s.selectedFieldId);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const categories = FIELD_TYPES.reduce<Record<string, typeof FIELD_TYPES>>((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {});

  const filteredCategories = searchTerm
    ? Object.entries(categories).reduce<Record<string, typeof FIELD_TYPES>>((acc, [cat, fields]) => {
        const filtered = fields.filter(
          (f) =>
            f.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) acc[cat] = filtered;
        return acc;
      }, {})
    : categories;

  const handleAddField = (type: FieldType) => {
    addField(type);
    setShowModal(false);
    setSearchTerm('');
  };

  return (
    <>
      {/* Left Panel — Pages/Questions List (Typeform Style) */}
      <div className="w-60 bg-white border-r border-border h-full flex flex-col">
        {/* Add content button */}
        <div className="p-3">
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-foreground text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} />
            Adicionar campo
          </button>
        </div>

        {/* Pages / Questions list */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <div className="px-2 py-2">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Perguntas</span>
          </div>

          <div className="space-y-0.5">
            {fields.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-xs text-muted">
                  Adicione campos para construir seu formulario
                </p>
              </div>
            ) : (
              fields.map((field, index) => {
                const fieldTypeInfo = FIELD_TYPES.find((ft) => ft.type === field.type);
                const IconName = fieldTypeInfo?.icon || 'Type';
                const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[IconName];
                const isSelected = field.id === selectedFieldId;

                return (
                    <button
                    key={field.id}
                    onClick={() => selectField(field.id)}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-all group ${
                      isSelected
                        ? 'bg-accent-light border border-accent/20'
                        : 'hover:bg-surface-hover border border-transparent'
                    } ${field.hidden ? 'opacity-50' : ''}`}
                  >
                    <span className="text-[11px] font-medium text-muted w-4 flex-shrink-0">{index + 1}</span>
                    {IconComponent && (
                      <IconComponent size={14} className={isSelected ? 'text-accent' : 'text-muted'} />
                    )}
                    <span className={`text-xs truncate flex-1 ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {field.title || 'Sem titulo'}
                    </span>
                    {field.hidden && (
                      <EyeOff size={12} className="text-muted flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Content Modal — Typeform Style */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[8vh]">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowModal(false); setSearchTerm(''); }} />
          <div className="relative w-full max-w-3xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 pt-4">
              <span className="pb-3 text-sm font-medium text-foreground border-b-2 border-foreground">
                Adicionar campo
              </span>
              <button
                onClick={() => { setShowModal(false); setSearchTerm(''); }}
                className="p-1 rounded-md hover:bg-surface-hover text-muted"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 pt-4 pb-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Buscar campos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-background-secondary rounded-lg text-sm text-foreground placeholder-muted border-none focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            {/* Categories Grid — Typeform style */}
            <div className="px-6 pb-6 pt-2 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-x-8 gap-y-1">
                {Object.entries(filteredCategories).map(([category, fields]) => (
                  <div key={category} className="mb-4">
                    <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">
                      {categoryConfig[category]?.label || category}
                    </h3>
                    <div className="space-y-0.5">
                      {fields.map((field) => {
                        const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[field.icon];
                        return (
                          <button
                            key={field.type}
                            onClick={() => handleAddField(field.type as FieldType)}
                            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all"
                          >
                            {IconComponent && <IconComponent size={16} className="flex-shrink-0" />}
                            <span>{field.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
