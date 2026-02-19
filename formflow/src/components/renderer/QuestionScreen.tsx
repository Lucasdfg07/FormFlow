'use client';

import { Star, AlertCircle } from 'lucide-react';
import { formatPhone, type ValidationRule } from '@/lib/validators';
import CalendlyEmbed, { type CalendlyEventData } from './CalendlyEmbed';

interface QuestionScreenProps {
  field: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    required: boolean;
    properties: string | null;
    validations: string | null;
  };
  value: unknown;
  onChange: (value: unknown) => void;
  questionNumber: number;
  primaryColor: string;
  questionColor?: string;
  answerColor?: string;
  borderRadius?: string;
  error?: string | null;
  allAnswers?: Record<string, unknown>;
  allFields?: { id: string; type: string; title: string }[];
}

export default function QuestionScreen({
  field,
  value,
  onChange,
  questionNumber,
  primaryColor,
  questionColor = '#f1f5f9',
  answerColor = '#f1f5f9',
  borderRadius = '8px',
  error,
  allAnswers = {},
  allFields = [],
}: QuestionScreenProps) {
  const props = field.properties ? JSON.parse(field.properties) : {};
  const validations: ValidationRule | null = field.validations ? JSON.parse(field.validations) : null;

  // Determine format from validations or field type
  const format = validations?.format || (
    field.type === 'email' ? 'email' :
    field.type === 'phone' ? 'phone' :
    field.type === 'url' ? 'url' : null
  );

  const handleTextChange = (rawValue: string) => {
    // Apply phone mask
    if (format === 'phone') {
      onChange(formatPhone(rawValue));
      return;
    }
    onChange(rawValue);
  };

  // Get maxLength from validations
  const maxLength = validations?.maxLength;
  const strValue = typeof value === 'string' ? value : '';
  const charCount = strValue.length;

  return (
    <div>
      {/* Question number & title */}
      <div className="mb-6">
        <span className="text-sm font-medium mb-2 block" style={{ color: `${questionColor}80` }}>
          {questionNumber} →
        </span>
        <h2 className="text-2xl font-bold leading-tight" style={{ color: questionColor }}>
          {field.title}
          {field.required && <span className="ml-1" style={{ color: primaryColor }}>*</span>}
        </h2>
        {field.description && (
          <p className="text-base mt-2" style={{ color: `${questionColor}99` }}>{field.description}</p>
        )}
      </div>

      {/* Field renderer by type */}
      {field.type === 'short_text' && (
        <div>
          <input
            type={format === 'email' ? 'email' : format === 'url' ? 'url' : 'text'}
            value={(value as string) || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={
              format === 'email' ? 'nome@email.com' :
              format === 'phone' ? '(00) 00000-0000' :
              format === 'url' ? 'https://...' :
              format === 'cpf' ? '000.000.000-00' :
              format === 'cnpj' ? '00.000.000/0000-00' :
              'Digite sua resposta aqui...'
            }
            maxLength={maxLength || undefined}
            autoFocus
            className="w-full bg-transparent border-b-2 text-xl py-3 outline-none transition-colors"
            style={{
              color: answerColor,
              borderColor: error ? '#ef4444' : `${answerColor}33`,
            }}
          />
          {maxLength && (
            <div className="flex justify-end mt-1">
              <span className="text-xs" style={{ color: charCount > maxLength ? '#ef4444' : `${questionColor}60` }}>
                {charCount}/{maxLength}
              </span>
            </div>
          )}
        </div>
      )}

      {field.type === 'long_text' && (
        <div>
          <textarea
            value={(value as string) || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Digite sua resposta aqui..."
            maxLength={maxLength || undefined}
            autoFocus
            rows={4}
            className="w-full bg-transparent border-b-2 text-lg py-3 outline-none transition-colors resize-none"
            style={{
              color: answerColor,
              borderColor: error ? '#ef4444' : `${answerColor}33`,
            }}
          />
          {maxLength && (
            <div className="flex justify-end mt-1">
              <span className="text-xs" style={{ color: charCount > maxLength ? '#ef4444' : `${questionColor}60` }}>
                {charCount}/{maxLength}
              </span>
            </div>
          )}
        </div>
      )}

      {field.type === 'email' && (
        <input
          type="email"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="nome@email.com"
          autoFocus
          className="w-full bg-transparent border-b-2 text-xl py-3 outline-none transition-colors"
          style={{
            color: answerColor,
            borderColor: error ? '#ef4444' : `${answerColor}33`,
          }}
        />
      )}

      {field.type === 'phone' && (
        <input
          type="tel"
          value={(value as string) || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="(00) 00000-0000"
          autoFocus
          className="w-full bg-transparent border-b-2 text-xl py-3 outline-none transition-colors"
          style={{
            color: answerColor,
            borderColor: error ? '#ef4444' : `${answerColor}33`,
          }}
        />
      )}

      {field.type === 'url' && (
        <input
          type="url"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          autoFocus
          className="w-full bg-transparent border-b-2 text-xl py-3 outline-none transition-colors"
          style={{
            color: answerColor,
            borderColor: error ? '#ef4444' : `${answerColor}33`,
          }}
        />
      )}

      {field.type === 'date' && (
        <input
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border-b-2 text-xl py-3 outline-none transition-colors"
          style={{
            color: answerColor,
            borderColor: error ? '#ef4444' : `${answerColor}33`,
          }}
        />
      )}

      {field.type === 'multiple_choice' && (
        <div className="space-y-3">
          {(props.choices || []).map((choice: { id: string; label: string; value: string }, idx: number) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = value === choice.value;
            return (
              <button
                key={choice.id}
                onClick={() => onChange(choice.value)}
                className="w-full flex items-center gap-4 px-5 py-4 border-2 text-left transition-all"
                style={{
                  borderRadius,
                  borderColor: isSelected ? primaryColor : `${answerColor}33`,
                  backgroundColor: isSelected ? `${primaryColor}15` : 'transparent',
                  color: answerColor,
                }}
              >
                <span
                  className="w-7 h-7 flex items-center justify-center text-sm font-bold border"
                  style={{
                    borderRadius: '6px',
                    borderColor: isSelected ? primaryColor : `${answerColor}50`,
                    backgroundColor: isSelected ? `${primaryColor}30` : 'transparent',
                  }}
                >
                  {letter}
                </span>
                <span className="text-lg">{choice.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {field.type === 'checkbox' && (
        <div className="space-y-3">
          {(props.choices || []).map((choice: { id: string; label: string; value: string }, idx: number) => {
            const letter = String.fromCharCode(65 + idx);
            const selected = (value as string[]) || [];
            const isSelected = selected.includes(choice.value);
            return (
              <button
                key={choice.id}
                onClick={() => {
                  const updated = isSelected
                    ? selected.filter((v) => v !== choice.value)
                    : [...selected, choice.value];
                  onChange(updated);
                }}
                className="w-full flex items-center gap-4 px-5 py-4 border-2 text-left transition-all"
                style={{
                  borderRadius,
                  borderColor: isSelected ? primaryColor : `${answerColor}33`,
                  backgroundColor: isSelected ? `${primaryColor}15` : 'transparent',
                  color: answerColor,
                }}
              >
                <span
                  className="w-7 h-7 flex items-center justify-center text-sm font-bold border"
                  style={{
                    borderRadius: '6px',
                    borderColor: isSelected ? primaryColor : `${answerColor}50`,
                    backgroundColor: isSelected ? `${primaryColor}30` : 'transparent',
                  }}
                >
                  {letter}
                </span>
                <span className="text-lg">{choice.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {field.type === 'dropdown' && (
        <select
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border-b-2 text-xl py-3 outline-none transition-colors appearance-none"
          style={{
            color: answerColor,
            borderColor: error ? '#ef4444' : `${answerColor}33`,
          }}
        >
          <option value="" style={{ background: '#1a1a2e' }}>Selecione...</option>
          {(props.choices || []).map((choice: { id: string; label: string; value: string }) => (
            <option key={choice.id} value={choice.value} style={{ background: '#1a1a2e' }}>
              {choice.label}
            </option>
          ))}
        </select>
      )}

      {field.type === 'yes_no' && (
        <div className="flex gap-4">
          {[
            { label: 'Sim', val: 'yes', key: 'Y' },
            { label: 'Nao', val: 'no', key: 'N' },
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => onChange(opt.val)}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-5 border-2 text-lg font-medium transition-all"
              style={{
                borderRadius,
                borderColor: value === opt.val ? primaryColor : `${answerColor}33`,
                backgroundColor: value === opt.val ? `${primaryColor}15` : 'transparent',
                color: answerColor,
              }}
            >
              <span
                className="w-7 h-7 flex items-center justify-center text-sm font-bold border"
                style={{
                  borderRadius: '6px',
                  borderColor: `${answerColor}50`,
                }}
              >
                {opt.key}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {field.type === 'rating' && (
        <div className="flex gap-2">
          {Array.from({ length: props.max || 5 }).map((_, i) => (
            <button
              key={i}
              onClick={() => onChange(i + 1)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={40}
                fill={(value as number) > i ? primaryColor : 'transparent'}
                stroke={(value as number) > i ? primaryColor : `${answerColor}50`}
              />
            </button>
          ))}
        </div>
      )}

      {field.type === 'nps' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 11 }).map((_, i) => (
              <button
                key={i}
                onClick={() => onChange(i)}
                className="w-12 h-12 border-2 font-bold text-lg transition-all"
                style={{
                  borderRadius,
                  borderColor: value === i ? primaryColor : `${answerColor}33`,
                  backgroundColor: value === i ? `${primaryColor}15` : 'transparent',
                  color: answerColor,
                }}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-sm" style={{ color: `${questionColor}80` }}>
            <span>Nada provavel</span>
            <span>Extremamente provavel</span>
          </div>
        </div>
      )}

      {field.type === 'statement' && (
        <div className="py-4">
          <button
            onClick={() => onChange('acknowledged')}
            className="px-8 py-3 font-medium transition-all hover:opacity-90"
            style={{
              backgroundColor: primaryColor,
              color: '#ffffff',
              borderRadius,
            }}
          >
            {props.buttonText || 'Continuar'}
          </button>
        </div>
      )}

      {field.type === 'calendly' && props.calendlyUrl && (() => {
        // Resolve prefill from mapped fields or auto-detect
        const prefillNameFieldId = props.prefillNameFieldId;
        const prefillEmailFieldId = props.prefillEmailFieldId;

        let resolvedName = '';
        let resolvedEmail = '';

        if (prefillNameFieldId && allAnswers[prefillNameFieldId]) {
          resolvedName = String(allAnswers[prefillNameFieldId]);
        } else {
          // Auto-detect: find first field that looks like "name"
          for (const f of allFields) {
            if (!allAnswers[f.id]) continue;
            const t = f.title.toLowerCase();
            if (t.includes('nome') || t.includes('name')) {
              resolvedName = String(allAnswers[f.id]);
              break;
            }
          }
        }

        if (prefillEmailFieldId && allAnswers[prefillEmailFieldId]) {
          resolvedEmail = String(allAnswers[prefillEmailFieldId]);
        } else {
          // Auto-detect: find first email field
          for (const f of allFields) {
            if (!allAnswers[f.id]) continue;
            if (f.type === 'email' || f.title.toLowerCase().includes('email')) {
              resolvedEmail = String(allAnswers[f.id]);
              break;
            }
          }
        }

        return (
          <CalendlyEmbed
            calendlyUrl={props.calendlyUrl}
            prefillName={resolvedName}
            prefillEmail={resolvedEmail}
            primaryColor={primaryColor}
            questionColor={questionColor}
            borderRadius={borderRadius}
            onEventScheduled={(eventData: CalendlyEventData) => {
              onChange({
                scheduled: true,
                event_uri: eventData.event_uri,
                invitee_uri: eventData.invitee_uri,
                event_type_name: eventData.event_type_name,
                event_start_time: eventData.event_start_time,
                event_end_time: eventData.event_end_time,
              });
            }}
          />
        );
      })()}

      {field.type === 'signature' && (
        <div className="border-2 p-4 text-center" style={{ borderColor: `${answerColor}33`, borderRadius }}>
          <p className="text-sm mb-2" style={{ color: `${questionColor}80` }}>Assinatura (arraste para assinar)</p>
          <canvas
            width={500}
            height={200}
            className="w-full cursor-crosshair"
            style={{ backgroundColor: `${answerColor}08`, borderRadius }}
            onMouseDown={(e) => {
              const canvas = e.currentTarget;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              ctx.strokeStyle = answerColor;
              ctx.lineWidth = 2;
              ctx.beginPath();
              const rect = canvas.getBoundingClientRect();
              ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
              const draw = (ev: MouseEvent) => {
                ctx.lineTo(ev.clientX - rect.left, ev.clientY - rect.top);
                ctx.stroke();
              };
              const stop = () => {
                canvas.removeEventListener('mousemove', draw);
                canvas.removeEventListener('mouseup', stop);
                onChange(canvas.toDataURL());
              };
              canvas.addEventListener('mousemove', draw);
              canvas.addEventListener('mouseup', stop);
            }}
          />
        </div>
      )}

      {field.type === 'file_upload' && (
        <div
          className="border-2 border-dashed p-8 text-center transition-colors"
          style={{ borderColor: `${answerColor}33`, borderRadius }}
        >
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange(file.name);
            }}
            className="hidden"
            id={`file-${field.id}`}
          />
          <label htmlFor={`file-${field.id}`} className="cursor-pointer">
            <p className="text-lg mb-2" style={{ color: questionColor }}>Clique para enviar arquivo</p>
            <p className="text-sm" style={{ color: `${questionColor}80` }}>ou arraste e solte aqui</p>
            {value ? (
              <p className="mt-4 text-sm" style={{ color: primaryColor }}>
                {String(value)}
              </p>
            ) : null}
          </label>
        </div>
      )}

      {/* Validation error message */}
      {error && (
        <div className="flex items-center gap-2 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle size={16} style={{ color: '#ef4444' }} />
          <span className="text-sm font-medium" style={{ color: '#ef4444' }}>
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
