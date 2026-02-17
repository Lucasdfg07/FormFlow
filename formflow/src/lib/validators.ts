// ==========================================
// FormFlow — Field Validation Engine
// ==========================================
// Shared between frontend (QuestionScreen) and backend (API)

export interface ValidationRule {
  // Built-in validations (auto-applied by field type)
  format?: 'email' | 'phone' | 'url' | 'cpf' | 'cnpj';
  // Text length
  minLength?: number;
  maxLength?: number;
  // Numeric range
  min?: number;
  max?: number;
  // Custom regex
  pattern?: string;
  // Custom error messages per rule
  messages?: {
    format?: string;
    minLength?: string;
    maxLength?: string;
    min?: string;
    max?: string;
    pattern?: string;
    required?: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ---- Regex Patterns ----

const PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,5}[)]?[-\s.]?[0-9]{3,10}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  cpf: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
  cnpj: /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/,
};

const DEFAULT_MESSAGES = {
  email: 'Digite um email válido (ex: nome@email.com)',
  phone: 'Digite um telefone válido (ex: (11) 99999-9999)',
  url: 'Digite uma URL válida (ex: https://exemplo.com)',
  cpf: 'Digite um CPF válido',
  cnpj: 'Digite um CNPJ válido',
  required: 'Este campo é obrigatório',
};

// ---- Default validations by field type ----

export function getDefaultValidation(fieldType: string): ValidationRule | null {
  switch (fieldType) {
    case 'email':
      return {
        format: 'email',
        messages: { format: DEFAULT_MESSAGES.email },
      };
    case 'phone':
      return {
        format: 'phone',
        messages: { format: DEFAULT_MESSAGES.phone },
      };
    case 'url':
      return {
        format: 'url',
        messages: { format: DEFAULT_MESSAGES.url },
      };
    default:
      return null;
  }
}

// ---- Validate a single field ----

export function validateField(
  value: unknown,
  fieldType: string,
  required: boolean,
  validations?: ValidationRule | null
): ValidationResult {
  const strValue = value != null ? String(value).trim() : '';
  const isEmpty = strValue === '' || value === undefined || value === null;

  // 1. Required check
  if (required && isEmpty) {
    return {
      valid: false,
      error: validations?.messages?.required || DEFAULT_MESSAGES.required,
    };
  }

  // If empty and not required, skip other validations
  if (isEmpty) {
    return { valid: true };
  }

  // Merge default validations with custom ones
  const defaultVal = getDefaultValidation(fieldType);
  const merged: ValidationRule = {
    ...defaultVal,
    ...validations,
    messages: {
      ...defaultVal?.messages,
      ...validations?.messages,
    },
  };

  // 2. Format validation (email, phone, url, cpf, cnpj)
  if (merged.format) {
    const pattern = PATTERNS[merged.format];
    if (pattern && !pattern.test(strValue)) {
      return {
        valid: false,
        error: merged.messages?.format || `Formato inválido`,
      };
    }
  }

  // 3. Min length
  if (merged.minLength != null && strValue.length < merged.minLength) {
    return {
      valid: false,
      error: merged.messages?.minLength || `Mínimo de ${merged.minLength} caracteres`,
    };
  }

  // 4. Max length
  if (merged.maxLength != null && strValue.length > merged.maxLength) {
    return {
      valid: false,
      error: merged.messages?.maxLength || `Máximo de ${merged.maxLength} caracteres`,
    };
  }

  // 5. Numeric min
  if (merged.min != null && !isNaN(Number(strValue)) && Number(strValue) < merged.min) {
    return {
      valid: false,
      error: merged.messages?.min || `Valor mínimo: ${merged.min}`,
    };
  }

  // 6. Numeric max
  if (merged.max != null && !isNaN(Number(strValue)) && Number(strValue) > merged.max) {
    return {
      valid: false,
      error: merged.messages?.max || `Valor máximo: ${merged.max}`,
    };
  }

  // 7. Custom regex
  if (merged.pattern) {
    try {
      const regex = new RegExp(merged.pattern);
      if (!regex.test(strValue)) {
        return {
          valid: false,
          error: merged.messages?.pattern || 'Formato inválido',
        };
      }
    } catch {
      // Invalid regex, skip
    }
  }

  return { valid: true };
}

// ---- Available validation options per field type ----

export interface ValidationOption {
  key: string;
  label: string;
  type: 'toggle' | 'number' | 'text' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
}

export function getValidationOptions(fieldType: string): ValidationOption[] {
  const options: ValidationOption[] = [];

  // Format validation (built-in for contact fields)
  if (['email', 'phone', 'url'].includes(fieldType)) {
    // These have built-in format validation — no config needed
    // But allow customizing the error message
    options.push({
      key: 'formatMessage',
      label: 'Mensagem de erro',
      type: 'text',
      placeholder: fieldType === 'email'
        ? DEFAULT_MESSAGES.email
        : fieldType === 'phone'
          ? DEFAULT_MESSAGES.phone
          : DEFAULT_MESSAGES.url,
      description: 'Mensagem exibida quando o formato é inválido',
    });
  }

  // Text length for text fields
  if (['short_text', 'long_text'].includes(fieldType)) {
    options.push(
      {
        key: 'minLength',
        label: 'Mín. caracteres',
        type: 'number',
        placeholder: 'Ex: 3',
        description: 'Quantidade mínima de caracteres',
      },
      {
        key: 'maxLength',
        label: 'Máx. caracteres',
        type: 'number',
        placeholder: 'Ex: 500',
        description: 'Quantidade máxima de caracteres',
      },
      {
        key: 'format',
        label: 'Formato especial',
        type: 'select',
        options: [
          { value: '', label: 'Nenhum' },
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Telefone' },
          { value: 'url', label: 'URL' },
          { value: 'cpf', label: 'CPF' },
          { value: 'cnpj', label: 'CNPJ' },
        ],
        description: 'Validar como um formato específico',
      }
    );
  }

  // Date min/max not implemented as HTML handles it

  return options;
}

// ---- Phone mask helper ----

export function formatPhone(value: string): string {
  // Remove non-digits
  const digits = value.replace(/\D/g, '');

  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// ---- CPF mask helper ----

export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

// ---- CNPJ mask helper ----

export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}
