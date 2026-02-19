// ==========================================
// FormFlow — Global Type Definitions
// ==========================================

// Form Status
export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

// Field Types
export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkbox'
  | 'dropdown'
  | 'rating'
  | 'nps'
  | 'yes_no'
  | 'date'
  | 'email'
  | 'phone'
  | 'url'
  | 'file_upload'
  | 'matrix'
  | 'signature'
  | 'statement'
  | 'question_group'
  | 'calendly';

// Field Properties (varies by type)
export interface FieldProperties {
  placeholder?: string;
  choices?: { id: string; label: string; value: string }[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  allowMultiple?: boolean;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  rows?: string[];
  columns?: string[];
  calendlyUrl?: string;
  prefillNameFieldId?: string;
  prefillEmailFieldId?: string;
  buttonText?: string;
}

// Field Validation Rules
export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customMessage?: string;
}

// Conditional Logic
export interface FieldLogic {
  conditions?: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'empty' | 'not_empty';
    value: string;
  }[];
  action: 'show' | 'hide' | 'jump_to';
  targetFieldId?: string;
}

// Theme
export interface FormTheme {
  backgroundColor: string;
  backgroundImage?: string;
  questionColor: string;
  answerColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  roundness: 'none' | 'small' | 'medium' | 'large';
  logoUrl?: string;
}

export const DEFAULT_THEME: FormTheme = {
  backgroundColor: '#1a1a2e',
  questionColor: '#ffffff',
  answerColor: '#ffffff',
  buttonColor: '#b16cff',
  buttonTextColor: '#ffffff',
  fontFamily: 'Inter',
  fontSize: 'medium',
  roundness: 'medium',
};

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Palatino', label: 'Palatino' },
];

export const THEME_PRESETS: { name: string; theme: Partial<FormTheme> }[] = [
  { name: 'Escuro', theme: { backgroundColor: '#1a1a2e', questionColor: '#ffffff', answerColor: '#ffffff', buttonColor: '#b16cff' } },
  { name: 'Claro', theme: { backgroundColor: '#ffffff', questionColor: '#191919', answerColor: '#191919', buttonColor: '#191919' } },
  { name: 'Oceano', theme: { backgroundColor: '#0f172a', questionColor: '#e2e8f0', answerColor: '#e2e8f0', buttonColor: '#3b82f6' } },
  { name: 'Floresta', theme: { backgroundColor: '#14532d', questionColor: '#dcfce7', answerColor: '#dcfce7', buttonColor: '#22c55e' } },
  { name: 'Sunset', theme: { backgroundColor: '#431407', questionColor: '#fed7aa', answerColor: '#fed7aa', buttonColor: '#f97316' } },
  { name: 'Roxo', theme: { backgroundColor: '#3b0764', questionColor: '#e9d5ff', answerColor: '#e9d5ff', buttonColor: '#a855f7' } },
  { name: 'Minimal', theme: { backgroundColor: '#fafafa', questionColor: '#171717', answerColor: '#525252', buttonColor: '#171717' } },
  { name: 'Rose', theme: { backgroundColor: '#4c0519', questionColor: '#ffe4e6', answerColor: '#ffe4e6', buttonColor: '#f43f5e' } },
];

// Welcome / Thank You Screen
export interface ScreenConfig {
  title: string;
  description?: string;
  buttonText?: string;
  imageUrl?: string;
  redirectUrl?: string;
}

// Form Settings
export interface FormSettings {
  closeDate?: string;
  maxResponses?: number;
  showProgressBar?: boolean;
  allowEdit?: boolean;
  notifyEmail?: string;
}

// Full Form with Relations
export interface FormWithFields {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  slug: string;
  status: FormStatus;
  theme: FormTheme | null;
  welcomeScreen: ScreenConfig | null;
  thankYouScreen: ScreenConfig | null;
  settings: FormSettings | null;
  createdAt: Date;
  updatedAt: Date;
  fields: FormField[];
  _count?: {
    responses: number;
  };
}

export interface FormField {
  id: string;
  formId: string;
  type: FieldType;
  title: string;
  description: string | null;
  required: boolean;
  order: number;
  properties: FieldProperties | null;
  validations: FieldValidation | null;
  logic: FieldLogic | null;
}

// Response
export interface FormResponse {
  id: string;
  formId: string;
  answers: Record<string, unknown>;
  metadata: ResponseMetadata | null;
  completedAt: Date | null;
  createdAt: Date;
  tags?: { tag: { id: string; name: string; color: string } }[];
}

export interface ResponseMetadata {
  ip?: string;
  userAgent?: string;
  duration?: number;
  startedAt?: string;
}

// Tag
export interface TagWithCount {
  id: string;
  name: string;
  color: string;
  _count: {
    responses: number;
  };
}

// Tag Rule
export interface TagRuleConfig {
  id: string;
  fieldId: string;
  operator: string;
  value: string;
  tagId: string;
  tag: { name: string; color: string };
  active: boolean;
}

// Webhook
export interface WebhookConfig {
  id: string;
  url: string;
  headers: Record<string, string> | null;
  active: boolean;
}

// Dashboard Stats
export interface DashboardStats {
  totalForms: number;
  totalResponses: number;
  publishedForms: number;
  responsesToday: number;
}

// Field type metadata (for the builder palette)
export interface FieldTypeInfo {
  type: FieldType;
  label: string;
  icon: string;
  category: 'text' | 'choice' | 'number' | 'contact' | 'advanced' | 'layout';
  description: string;
}

export const FIELD_TYPES: FieldTypeInfo[] = [
  // Text
  { type: 'short_text', label: 'Texto Curto', icon: 'Type', category: 'text', description: 'Uma linha de texto' },
  { type: 'long_text', label: 'Texto Longo', icon: 'AlignLeft', category: 'text', description: 'Múltiplas linhas de texto' },
  
  // Choice
  { type: 'multiple_choice', label: 'Múltipla Escolha', icon: 'CircleDot', category: 'choice', description: 'Selecionar uma opção' },
  { type: 'checkbox', label: 'Checkbox', icon: 'CheckSquare', category: 'choice', description: 'Selecionar múltiplas opções' },
  { type: 'dropdown', label: 'Dropdown', icon: 'ChevronDown', category: 'choice', description: 'Lista suspensa' },
  { type: 'yes_no', label: 'Sim / Não', icon: 'ToggleLeft', category: 'choice', description: 'Resposta binária' },
  
  // Number & Rating
  { type: 'rating', label: 'Avaliação', icon: 'Star', category: 'number', description: 'Estrelas ou escala' },
  { type: 'nps', label: 'NPS', icon: 'BarChart3', category: 'number', description: 'Net Promoter Score (0-10)' },
  
  // Contact
  { type: 'email', label: 'Email', icon: 'Mail', category: 'contact', description: 'Endereço de email' },
  { type: 'phone', label: 'Telefone', icon: 'Phone', category: 'contact', description: 'Número de telefone' },
  { type: 'url', label: 'URL', icon: 'Link', category: 'contact', description: 'Endereço web' },
  { type: 'date', label: 'Data', icon: 'Calendar', category: 'contact', description: 'Seletor de data' },
  
  // Advanced
  { type: 'file_upload', label: 'Upload de Arquivo', icon: 'Upload', category: 'advanced', description: 'Enviar arquivo' },
  { type: 'matrix', label: 'Matriz', icon: 'Grid3x3', category: 'advanced', description: 'Tabela de respostas' },
  { type: 'signature', label: 'Assinatura', icon: 'PenTool', category: 'advanced', description: 'Desenho de assinatura' },
  { type: 'calendly', label: 'Calendly', icon: 'CalendarCheck', category: 'advanced', description: 'Agendamento inline' },
  
  // Layout
  { type: 'statement', label: 'Statement', icon: 'MessageSquare', category: 'layout', description: 'Texto informativo sem input' },
  { type: 'question_group', label: 'Grupo', icon: 'Layers', category: 'layout', description: 'Agrupar perguntas' },
];
