import { create } from 'zustand';
import { FieldType, FormTheme, DEFAULT_THEME } from '@/types';

export interface BuilderField {
  id: string;
  type: FieldType;
  title: string;
  description: string | null;
  required: boolean;
  order: number;
  properties: Record<string, unknown> | null;
  validations: Record<string, unknown> | null;
  logic: Record<string, unknown> | null;
}

interface BuilderStore {
  // State
  formId: string | null;
  formTitle: string;
  fields: BuilderField[];
  selectedFieldId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  previewMode: boolean;
  theme: FormTheme;

  // Actions
  setFormId: (id: string) => void;
  setFormTitle: (title: string) => void;
  setFields: (fields: BuilderField[]) => void;
  addField: (type: FieldType) => void;
  updateField: (id: string, updates: Partial<BuilderField>) => void;
  removeField: (id: string) => void;
  duplicateField: (id: string) => void;
  reorderFields: (activeId: string, overId: string) => void;
  selectField: (id: string | null) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  togglePreview: () => void;
  setTheme: (theme: FormTheme) => void;
  updateTheme: (updates: Partial<FormTheme>) => void;
}

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const defaultFieldTitle: Record<string, string> = {
  short_text: 'Texto curto',
  long_text: 'Texto longo',
  multiple_choice: 'Multipla escolha',
  checkbox: 'Checkbox',
  dropdown: 'Dropdown',
  rating: 'Avaliacao',
  nps: 'NPS',
  yes_no: 'Sim ou Nao',
  date: 'Data',
  email: 'Email',
  phone: 'Telefone',
  url: 'URL',
  file_upload: 'Upload de arquivo',
  matrix: 'Matriz',
  signature: 'Assinatura',
  statement: 'Statement',
  question_group: 'Grupo de perguntas',
  calendly: 'Agendamento Calendly',
};

const defaultProperties: Record<string, Record<string, unknown>> = {
  multiple_choice: {
    choices: [
      { id: '1', label: 'Opcao 1', value: 'opcao_1' },
      { id: '2', label: 'Opcao 2', value: 'opcao_2' },
      { id: '3', label: 'Opcao 3', value: 'opcao_3' },
    ],
  },
  checkbox: {
    choices: [
      { id: '1', label: 'Opcao 1', value: 'opcao_1' },
      { id: '2', label: 'Opcao 2', value: 'opcao_2' },
    ],
  },
  dropdown: {
    choices: [
      { id: '1', label: 'Opcao 1', value: 'opcao_1' },
      { id: '2', label: 'Opcao 2', value: 'opcao_2' },
    ],
  },
  rating: { max: 5, step: 1 },
  nps: { min: 0, max: 10 },
  yes_no: {},
  statement: { buttonText: 'Continuar' },
};

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  formId: null,
  formTitle: '',
  fields: [],
  selectedFieldId: null,
  isDirty: false,
  isSaving: false,
  previewMode: false,
  theme: { ...DEFAULT_THEME },

  setFormId: (id) => set({ formId: id }),
  setFormTitle: (title) => set({ formTitle: title, isDirty: true }),

  setFields: (fields) => set({ fields, isDirty: false }),

  addField: (type) => {
    const fields = get().fields;
    const newField: BuilderField = {
      id: generateTempId(),
      type,
      title: defaultFieldTitle[type] || 'Nova pergunta',
      description: null,
      required: false,
      order: fields.length,
      properties: defaultProperties[type] || null,
      validations: null,
      logic: null,
    };
    set({
      fields: [...fields, newField],
      selectedFieldId: newField.id,
      isDirty: true,
    });
  },

  updateField: (id, updates) => {
    set({
      fields: get().fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      isDirty: true,
    });
  },

  removeField: (id) => {
    const fields = get().fields.filter((f) => f.id !== id);
    const reordered = fields.map((f, i) => ({ ...f, order: i }));
    set({
      fields: reordered,
      selectedFieldId: get().selectedFieldId === id ? null : get().selectedFieldId,
      isDirty: true,
    });
  },

  duplicateField: (id) => {
    const fields = get().fields;
    const original = fields.find((f) => f.id === id);
    if (!original) return;

    const idx = fields.indexOf(original);
    const duplicate: BuilderField = {
      ...original,
      id: generateTempId(),
      title: `${original.title} (copia)`,
      order: idx + 1,
    };

    const newFields = [...fields];
    newFields.splice(idx + 1, 0, duplicate);
    const reordered = newFields.map((f, i) => ({ ...f, order: i }));

    set({
      fields: reordered,
      selectedFieldId: duplicate.id,
      isDirty: true,
    });
  },

  reorderFields: (activeId, overId) => {
    const fields = [...get().fields];
    const activeIdx = fields.findIndex((f) => f.id === activeId);
    const overIdx = fields.findIndex((f) => f.id === overId);

    if (activeIdx === -1 || overIdx === -1) return;

    const [moved] = fields.splice(activeIdx, 1);
    fields.splice(overIdx, 0, moved);

    const reordered = fields.map((f, i) => ({ ...f, order: i }));
    set({ fields: reordered, isDirty: true });
  },

  selectField: (id) => set({ selectedFieldId: id }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  setSaving: (saving) => set({ isSaving: saving }),
  togglePreview: () => set({ previewMode: !get().previewMode }),
  setTheme: (theme) => set({ theme }),
  updateTheme: (updates) => set({ theme: { ...get().theme, ...updates }, isDirty: true }),
}));
