'use client';

import { useBuilderStore } from '@/stores/builder-store';
import { FIELD_TYPES } from '@/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { X, Plus, Trash2, ChevronDown, Shield, EyeOff, CalendarCheck, User, Mail } from 'lucide-react';
import { getValidationOptions, getDefaultValidation, type ValidationRule } from '@/lib/validators';

export default function FieldEditor() {
  const selectedFieldId = useBuilderStore((s) => s.selectedFieldId);
  const fields = useBuilderStore((s) => s.fields);
  const updateField = useBuilderStore((s) => s.updateField);
  const selectField = useBuilderStore((s) => s.selectField);

  const field = fields.find((f) => f.id === selectedFieldId);

  if (!field) {
    return (
      <div className="w-72 bg-white border-l border-border h-full flex items-center justify-center p-6">
        <p className="text-muted text-sm text-center">
          Selecione um campo para editar
        </p>
      </div>
    );
  }

  const fieldTypeInfo = FIELD_TYPES.find((ft) => ft.type === field.type);
  const hasChoices = ['multiple_choice', 'checkbox', 'dropdown'].includes(field.type);

  // Validation helpers
  const validations = (field.validations as ValidationRule) || {};
  const validationOptions = getValidationOptions(field.type);
  const defaultVal = getDefaultValidation(field.type);
  const hasBuiltInFormat = !!defaultVal?.format;

  const updateValidation = (updates: Partial<ValidationRule>) => {
    const current = (field.validations as ValidationRule) || {};
    updateField(field.id, {
      validations: { ...current, ...updates },
    });
  };

  const updateValidationMessage = (key: string, message: string) => {
    const current = (field.validations as ValidationRule) || {};
    updateField(field.id, {
      validations: {
        ...current,
        messages: { ...current.messages, [key]: message || undefined },
      },
    });
  };

  const renderValidations = () => {
    // Skip for types that don't have validation options
    if (
      ['statement', 'question_group', 'yes_no', 'rating', 'nps', 'file_upload', 'signature', 'calendly', 'matrix', 'multiple_choice', 'checkbox', 'dropdown'].includes(field.type)
    ) {
      return null;
    }

    return (
      <>
        <hr className="border-border" />
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Shield size={14} className="text-muted" />
            <label className="text-xs font-medium text-foreground uppercase tracking-wider">
              Validações
            </label>
          </div>

          {/* Built-in format info for email/phone/url */}
          {hasBuiltInFormat && (
            <div className="mb-3 px-3 py-2 bg-accent-light rounded-lg">
              <p className="text-xs text-accent font-medium">
                Validação de {field.type === 'email' ? 'email' : field.type === 'phone' ? 'telefone' : 'URL'} automática
              </p>
            </div>
          )}

          <div className="space-y-3">
            {validationOptions.map((opt) => {
              if (opt.type === 'number') {
                return (
                  <div key={opt.key}>
                    <label className="block text-xs text-muted mb-1">
                      {opt.label}
                    </label>
                    <input
                      type="number"
                      value={(validations as Record<string, unknown>)[opt.key] as number || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        updateValidation({ [opt.key]: val });
                      }}
                      placeholder={opt.placeholder}
                      min={0}
                      className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-sm text-foreground hover:border-border-hover focus:border-foreground transition-all"
                    />
                    {opt.description && (
                      <p className="text-[10px] text-muted mt-0.5">{opt.description}</p>
                    )}
                  </div>
                );
              }

              if (opt.type === 'select') {
                return (
                  <div key={opt.key}>
                    <label className="block text-xs text-muted mb-1">
                      {opt.label}
                    </label>
                    <div className="relative">
                      <select
                        value={(validations as Record<string, unknown>)[opt.key] as string || ''}
                        onChange={(e) => updateValidation({ [opt.key]: e.target.value || undefined })}
                        className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-sm text-foreground appearance-none cursor-pointer hover:border-border-hover transition-all"
                      >
                        {opt.options?.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                    {opt.description && (
                      <p className="text-[10px] text-muted mt-0.5">{opt.description}</p>
                    )}
                  </div>
                );
              }

              if (opt.type === 'text' && opt.key === 'formatMessage') {
                return (
                  <div key={opt.key}>
                    <label className="block text-xs text-muted mb-1">
                      {opt.label}
                    </label>
                    <input
                      type="text"
                      value={validations.messages?.format || ''}
                      onChange={(e) => updateValidationMessage('format', e.target.value)}
                      placeholder={opt.placeholder}
                      className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-sm text-foreground hover:border-border-hover focus:border-foreground transition-all"
                    />
                    {opt.description && (
                      <p className="text-[10px] text-muted mt-0.5">{opt.description}</p>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      </>
    );
  };
  const choices = (field.properties as Record<string, unknown>)?.choices as
    | { id: string; label: string; value: string }[]
    | undefined;

  const addChoice = () => {
    const current = choices || [];
    const newId = String(current.length + 1);
    const updated = [...current, { id: newId, label: `Opcao ${newId}`, value: `opcao_${newId}` }];
    updateField(field.id, {
      properties: { ...(field.properties || {}), choices: updated },
    });
  };

  const updateChoice = (idx: number, label: string) => {
    if (!choices) return;
    const updated = choices.map((c, i) =>
      i === idx ? { ...c, label, value: label.toLowerCase().replace(/\s+/g, '_') } : c
    );
    updateField(field.id, {
      properties: { ...(field.properties || {}), choices: updated },
    });
  };

  const removeChoice = (idx: number) => {
    if (!choices) return;
    const updated = choices.filter((_, i) => i !== idx);
    updateField(field.id, {
      properties: { ...(field.properties || {}), choices: updated },
    });
  };

  return (
    <div className="w-72 bg-white border-l border-border h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <span className="text-[11px] text-muted uppercase font-medium tracking-wider">
            {fieldTypeInfo?.label || 'Propriedades'}
          </span>
        </div>
        <button
          onClick={() => selectField(null)}
          className="p-1 rounded-md hover:bg-surface-hover text-muted"
        >
          <X size={16} />
        </button>
      </div>

      {/* Properties */}
      <div className="p-4 space-y-5">
        {/* Question */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Pergunta
          </label>
          <input
            value={field.title}
            onChange={(e) => updateField(field.id, { title: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground hover:border-border-hover focus:border-foreground transition-all"
            placeholder="Digite a pergunta..."
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Descricao
          </label>
          <textarea
            value={field.description || ''}
            onChange={(e) => updateField(field.id, { description: e.target.value || null })}
            placeholder="Descricao opcional..."
            rows={2}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground placeholder-muted hover:border-border-hover focus:border-foreground transition-all resize-none"
          />
        </div>

        {/* Required toggle */}
        <div className="flex items-center justify-between py-1">
          <label className="text-sm text-foreground">Obrigatório</label>
          <button
            onClick={() => updateField(field.id, { required: !field.required })}
            className={`tf-toggle ${field.required ? 'active' : ''}`}
          />
        </div>

        {/* Hidden toggle */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-1.5">
            <EyeOff size={14} className="text-muted" />
            <label className="text-sm text-foreground">Oculto para respondente</label>
          </div>
          <button
            onClick={() => updateField(field.id, { hidden: !field.hidden })}
            className={`tf-toggle ${field.hidden ? 'active' : ''}`}
          />
        </div>
        {field.hidden && (
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              Este campo não será exibido no formulário público. Ele existe apenas para dados internos.
            </p>
          </div>
        )}

        {/* Divider */}
        <hr className="border-border" />

        {/* Choices editor */}
        {hasChoices && (
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">
              Opcoes
            </label>
            <div className="space-y-2">
              {choices?.map((choice, idx) => (
                <div key={choice.id} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-${field.type === 'checkbox' ? 'sm' : 'full'} border border-border flex-shrink-0`} />
                  <input
                    value={choice.label}
                    onChange={(e) => updateChoice(idx, e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-border rounded-md text-sm text-foreground hover:border-border-hover focus:border-foreground transition-all"
                  />
                  <button
                    onClick={() => removeChoice(idx)}
                    className="p-1 text-muted hover:text-danger transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                onClick={addChoice}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-md hover:border-border-hover transition-all"
              >
                <Plus size={13} /> Adicionar opcao
              </button>
            </div>
          </div>
        )}

        {/* Validations Section */}
        {renderValidations()}

        {/* Rating config */}
        {field.type === 'rating' && (
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Escala maxima
            </label>
            <div className="relative">
              <select
                value={((field.properties as Record<string, unknown>)?.max as number) || 5}
                onChange={(e) =>
                  updateField(field.id, {
                    properties: { ...(field.properties || {}), max: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground appearance-none cursor-pointer hover:border-border-hover transition-all"
              >
                {[3, 4, 5, 7, 10].map((n) => (
                  <option key={n} value={n}>{n} estrelas</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>
        )}

        {/* Statement button text */}
        {field.type === 'statement' && (
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Texto do botao
            </label>
            <input
              value={((field.properties as Record<string, unknown>)?.buttonText as string) || 'Continuar'}
              onChange={(e) =>
                updateField(field.id, {
                  properties: { ...(field.properties || {}), buttonText: e.target.value },
                })
              }
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground hover:border-border-hover focus:border-foreground transition-all"
            />
          </div>
        )}

        {/* Calendly Configuration */}
        {field.type === 'calendly' && (
          <>
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <CalendarCheck size={14} className="text-muted" />
                <label className="text-xs font-medium text-foreground uppercase tracking-wider">
                  Configuração do Calendly
                </label>
              </div>

              <label className="block text-xs text-muted mb-1">
                URL do Calendly
              </label>
              <input
                placeholder="https://calendly.com/seu-link/30min"
                value={((field.properties as Record<string, unknown>)?.calendlyUrl as string) || ''}
                onChange={(e) =>
                  updateField(field.id, {
                    properties: { ...(field.properties || {}), calendlyUrl: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground hover:border-border-hover focus:border-foreground transition-all"
              />
              <p className="text-[10px] text-muted mt-1">
                Cole o link do evento do Calendly. Ex: https://calendly.com/seu-nome/reuniao
              </p>
            </div>

            <hr className="border-border" />

            {/* Prefill mapping */}
            <div>
              <label className="text-xs font-medium text-foreground uppercase tracking-wider mb-2 block">
                Preencher automaticamente
              </label>
              <p className="text-[10px] text-muted mb-3">
                Mapeie campos do formulário para preencher dados no Calendly automaticamente.
              </p>

              {/* Name prefill */}
              <div className="mb-3">
                <label className="flex items-center gap-1.5 text-xs text-muted mb-1">
                  <User size={12} />
                  Nome do participante
                </label>
                <select
                  value={((field.properties as Record<string, unknown>)?.prefillNameFieldId as string) || ''}
                  onChange={(e) =>
                    updateField(field.id, {
                      properties: { ...(field.properties || {}), prefillNameFieldId: e.target.value || undefined },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-sm text-foreground appearance-none cursor-pointer hover:border-border-hover transition-all"
                >
                  <option value="">Auto-detectar</option>
                  {fields.filter(f => f.id !== field.id).map(f => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>
              </div>

              {/* Email prefill */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-muted mb-1">
                  <Mail size={12} />
                  Email do participante
                </label>
                <select
                  value={((field.properties as Record<string, unknown>)?.prefillEmailFieldId as string) || ''}
                  onChange={(e) =>
                    updateField(field.id, {
                      properties: { ...(field.properties || {}), prefillEmailFieldId: e.target.value || undefined },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-sm text-foreground appearance-none cursor-pointer hover:border-border-hover transition-all"
                >
                  <option value="">Auto-detectar</option>
                  {fields.filter(f => f.id !== field.id).map(f => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview info */}
            {((field.properties as Record<string, unknown>)?.calendlyUrl as string) && (
              <div className="px-3 py-2 bg-accent-light rounded-lg">
                <p className="text-xs text-accent font-medium">
                  ✓ Widget do Calendly será exibido inline no formulário
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
