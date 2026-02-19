'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Check } from 'lucide-react';
import QuestionScreen from './QuestionScreen';
import CalendlyEmbed, { type CalendlyEventData } from './CalendlyEmbed';
import { validateField, type ValidationRule } from '@/lib/validators';

interface RendererField {
  id: string;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  order: number;
  properties: string | null;
  validations: string | null;
  logic: string | null;
}

interface FormThemeProps {
  backgroundColor?: string;
  backgroundImage?: string;
  questionColor?: string;
  answerColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  fontFamily?: string;
  fontSize?: 'small' | 'medium' | 'large';
  roundness?: 'none' | 'small' | 'medium' | 'large';
  // Legacy fields
  primaryColor?: string;
  textColor?: string;
}

interface FormRendererProps {
  formId: string;
  title: string;
  fields: RendererField[];
  welcomeScreen?: { title: string; description?: string; buttonText?: string } | null;
  thankYouScreen?: { title: string; description?: string; redirectUrl?: string } | null;
  theme?: FormThemeProps | null;
}

function getBodyFontSize(size?: string) {
  switch (size) {
    case 'small': return '16px';
    case 'large': return '24px';
    default: return '20px';
  }
}

function getTitleFontSize(size?: string) {
  switch (size) {
    case 'small': return '1.5rem';
    case 'large': return '2.5rem';
    default: return '2rem';
  }
}

function getBorderRadius(roundness?: string) {
  switch (roundness) {
    case 'none': return '0px';
    case 'small': return '4px';
    case 'large': return '16px';
    default: return '8px';
  }
}

export default function FormRenderer({
  formId,
  title,
  fields,
  welcomeScreen,
  thankYouScreen,
  theme,
}: FormRendererProps) {
  const [currentIndex, setCurrentIndex] = useState(welcomeScreen ? -1 : 0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);
  const [startedAt] = useState(new Date().toISOString());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  // Ref sincrono para bloquear submissoes concorrentes (state e assincrono)
  const submittingRef = useRef(false);

  const totalQuestions = fields.length;
  const isWelcome = currentIndex === -1;
  const isThankYou = submitted;
  const currentField = fields[currentIndex];
  const progress = Math.max(0, ((currentIndex + 1) / totalQuestions) * 100);

  // Support both legacy and new theme fields
  const buttonColor = theme?.buttonColor || theme?.primaryColor || '#6366f1';
  const bgColor = theme?.backgroundColor || '#020617';
  const questionColor = theme?.questionColor || theme?.textColor || '#f1f5f9';
  const answerColor = theme?.answerColor || theme?.textColor || '#f1f5f9';
  const buttonTextColor = theme?.buttonTextColor || '#ffffff';
  const fontFamily = theme?.fontFamily || 'Inter';
  const fontSize = theme?.fontSize || 'medium';
  const roundness = theme?.roundness || 'medium';
  const backgroundImage = theme?.backgroundImage;
  const borderRadius = getBorderRadius(roundness);

  // Validate the current field
  const validateCurrentField = useCallback((): boolean => {
    if (!currentField) return true;

    const value = answers[currentField.id];
    const validations: ValidationRule | null = currentField.validations
      ? JSON.parse(currentField.validations)
      : null;

    const result = validateField(value, currentField.type, currentField.required, validations);

    if (!result.valid) {
      setFieldErrors((prev) => ({ ...prev, [currentField.id]: result.error || 'Campo inválido' }));
      return false;
    }

    // Clear error on success
    setFieldErrors((prev) => ({ ...prev, [currentField.id]: null }));
    return true;
  }, [currentField, answers]);

  // Clear error when user types
  const handleAnswer = useCallback((fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error immediately when user starts typing
    setFieldErrors((prev) => ({ ...prev, [fieldId]: null }));
  }, []);

  const goNext = useCallback(() => {
    // Validate before advancing
    if (!validateCurrentField()) return;

    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, totalQuestions, validateCurrentField]);

  const goPrev = useCallback(() => {
    if (currentIndex > (welcomeScreen ? -1 : 0)) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex, welcomeScreen]);

  const handleSubmit = async () => {
    // Guard: bloqueia se ja enviou ou esta enviando (ref sincrono)
    if (submitted || submittingRef.current) return;

    // Validate before submitting
    if (!validateCurrentField()) return;

    // Trava SINCRONA (impede chamadas concorrentes antes do re-render)
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          answers,
          metadata: {
            userAgent: navigator.userAgent,
            startedAt,
            duration: Math.round((Date.now() - new Date(startedAt).getTime()) / 1000),
          },
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        if (thankYouScreen?.redirectUrl) {
          setTimeout(() => {
            window.location.href = thankYouScreen.redirectUrl!;
          }, 3000);
        }
      } else {
        const data = await res.json();
        if (data.validationErrors) {
          // Server returned field-level validation errors
          const errors: Record<string, string | null> = {};
          for (const err of data.validationErrors) {
            errors[err.fieldId] = err.error;
          }
          setFieldErrors((prev) => ({ ...prev, ...errors }));
          // Navigate to first errored field
          const firstErrorFieldId = data.validationErrors[0]?.fieldId;
          if (firstErrorFieldId) {
            const errIdx = fields.findIndex((f) => f.id === firstErrorFieldId);
            if (errIdx >= 0) {
              setCurrentIndex(errIdx);
            }
          }
        }
        // Libera trava apenas se houve erro de validacao (permitir reenvio)
        submittingRef.current = false;
      }
    } catch (error) {
      console.error('Submit error:', error);
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const isLastQuestion = currentIndex === totalQuestions - 1;
  const canProceed = () => {
    if (!currentField) return true;
    if (!currentField.required) return true;
    const answer = answers[currentField.id];
    if (answer === undefined || answer === null || answer === '') return false;
    // For Calendly, check if event was scheduled
    if (currentField.type === 'calendly') {
      return typeof answer === 'object' && (answer as Record<string, unknown>)?.scheduled === true;
    }
    return true;
  };

  // Keyboard navigation (com dependency array para nao duplicar listeners)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloqueia Enter se ja enviou ou esta enviando
      if (submitted || submittingRef.current) return;

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (isWelcome) {
          setDirection(1);
          setCurrentIndex(0);
        } else if (isLastQuestion && canProceed()) {
          handleSubmit();
        } else if (canProceed()) {
          goNext();
        }
      } else if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWelcome, isLastQuestion, submitted, goNext, goPrev]);

  const slideVariants = {
    enter: (dir: number) => ({ y: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (dir: number) => ({ y: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: bgColor,
        color: questionColor,
        fontFamily,
        fontSize: getBodyFontSize(fontSize),
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: backgroundImage ? 'cover' : undefined,
        backgroundPosition: backgroundImage ? 'center' : undefined,
      }}
    >
      {/* Progress bar */}
      {!isWelcome && !isThankYou && (
        <div className="fixed top-0 left-0 right-0 h-1 z-50" style={{ backgroundColor: `${questionColor}15` }}>
          <motion.div
            className="h-full"
            style={{ backgroundColor: buttonColor }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Main content */}
      {currentField?.type === 'calendly' && !isWelcome && !isThankYou ? (
        /* ── CALENDLY SPLIT LAYOUT ── */
        <div className="flex-1 flex min-h-0">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentField.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col lg:flex-row w-full"
            >
              {/* Left side — info */}
              <div className="lg:w-[42%] flex flex-col justify-center px-8 lg:px-16 py-12 lg:py-20">
                <span className="text-sm font-medium mb-3 block" style={{ color: `${questionColor}80` }}>
                  {currentIndex + 1} →
                </span>
                <h2
                  className="font-bold leading-tight mb-4"
                  style={{ color: questionColor, fontSize: getTitleFontSize(fontSize) }}
                >
                  {currentField.title}
                  {currentField.required && <span className="ml-1" style={{ color: buttonColor }}>*</span>}
                </h2>
                {currentField.description && (
                  <p className="text-base mb-8 whitespace-pre-line" style={{ color: `${questionColor}99` }}>
                    {currentField.description}
                  </p>
                )}

                {/* Scheduled success inline */}
                {typeof answers[currentField.id] === 'object' &&
                 (answers[currentField.id] as Record<string, unknown>)?.scheduled && (
                  <div className="flex items-center gap-3 mb-6 p-4 rounded-xl" style={{ backgroundColor: `${buttonColor}15` }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${buttonColor}25` }}>
                      <Check size={20} style={{ color: buttonColor }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: questionColor }}>Agendamento confirmado!</p>
                      <p className="text-xs" style={{ color: `${questionColor}80` }}>Você receberá um email de confirmação.</p>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center gap-4 mt-auto pt-6">
                  {isLastQuestion ? (
                    <button
                      onClick={handleSubmit}
                      disabled={!canProceed() || submitting}
                      className="px-8 py-3 font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                      style={{ backgroundColor: buttonColor, color: buttonTextColor, borderRadius }}
                    >
                      {submitting ? 'Enviando...' : 'Enviar'}
                      <Check size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={goNext}
                      disabled={!canProceed()}
                      className="px-8 py-3 font-medium transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: buttonColor, color: buttonTextColor, borderRadius }}
                    >
                      OK
                    </button>
                  )}
                  <span className="text-sm" style={{ color: `${questionColor}80` }}>
                    pressione <strong>Enter</strong> ↵
                  </span>
                </div>

                {/* Error */}
                {fieldErrors[currentField.id] && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm font-medium" style={{ color: '#ef4444' }}>
                      {fieldErrors[currentField.id]}
                    </span>
                  </div>
                )}
              </div>

              {/* Right side — Calendly widget */}
              <div
                className="lg:w-[58%] flex items-stretch min-h-[500px] lg:min-h-0"
                style={{ backgroundColor: `${questionColor}08` }}
              >
                <div className="flex-1 p-4 lg:p-6">
                  {(() => {
                    const props = currentField.properties ? JSON.parse(currentField.properties) : {};
                    if (!props.calendlyUrl) return null;

                    const prefillNameFieldId = props.prefillNameFieldId;
                    const prefillEmailFieldId = props.prefillEmailFieldId;

                    let resolvedName = '';
                    let resolvedEmail = '';

                    if (prefillNameFieldId && answers[prefillNameFieldId]) {
                      resolvedName = String(answers[prefillNameFieldId]);
                    } else {
                      for (const f of fields) {
                        if (!answers[f.id]) continue;
                        const t = f.title.toLowerCase();
                        if (t.includes('nome') || t.includes('name')) {
                          resolvedName = String(answers[f.id]);
                          break;
                        }
                      }
                    }

                    if (prefillEmailFieldId && answers[prefillEmailFieldId]) {
                      resolvedEmail = String(answers[prefillEmailFieldId]);
                    } else {
                      for (const f of fields) {
                        if (!answers[f.id]) continue;
                        if (f.type === 'email' || f.title.toLowerCase().includes('email')) {
                          resolvedEmail = String(answers[f.id]);
                          break;
                        }
                      }
                    }

                    return (
                      <CalendlyEmbed
                        calendlyUrl={props.calendlyUrl}
                        prefillName={resolvedName}
                        prefillEmail={resolvedEmail}
                        primaryColor={buttonColor}
                        questionColor={questionColor}
                        borderRadius={borderRadius}
                        onEventScheduled={(eventData: CalendlyEventData) => {
                          handleAnswer(currentField.id, {
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
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* ── STANDARD CENTERED LAYOUT ── */
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-xl">
            <AnimatePresence mode="wait" custom={direction}>
              {isWelcome && welcomeScreen && (
                <motion.div
                  key="welcome"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center"
                >
                  <h1
                    className="font-bold mb-4"
                    style={{ color: questionColor, fontSize: getTitleFontSize(fontSize) }}
                  >
                    {welcomeScreen.title}
                  </h1>
                {welcomeScreen.description && (
                  <p className="text-lg mb-8 whitespace-pre-line" style={{ color: `${questionColor}b3` }}>
                    {welcomeScreen.description}
                  </p>
                )}
                  <button
                    onClick={() => { setDirection(1); setCurrentIndex(0); }}
                    className="px-8 py-3 font-medium text-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: buttonColor, color: buttonTextColor, borderRadius }}
                  >
                    {welcomeScreen.buttonText || 'Comecar'}
                  </button>
                </motion.div>
              )}

              {!isWelcome && !isThankYou && currentField && (
                <motion.div
                  key={currentField.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <QuestionScreen
                    field={currentField}
                    value={answers[currentField.id]}
                    onChange={(value) => handleAnswer(currentField.id, value)}
                    questionNumber={currentIndex + 1}
                    primaryColor={buttonColor}
                    questionColor={questionColor}
                    answerColor={answerColor}
                    borderRadius={borderRadius}
                    error={fieldErrors[currentField.id]}
                    allAnswers={answers}
                    allFields={fields.map(f => ({ id: f.id, type: f.type, title: f.title }))}
                  />

                  <div className="mt-8 flex items-center gap-4">
                    {isLastQuestion ? (
                      <button
                        onClick={handleSubmit}
                        disabled={!canProceed() || submitting}
                        className="px-8 py-3 font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                        style={{ backgroundColor: buttonColor, color: buttonTextColor, borderRadius }}
                      >
                        {submitting ? 'Enviando...' : 'Enviar'}
                        <Check size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={goNext}
                        disabled={!canProceed()}
                        className="px-8 py-3 font-medium transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: buttonColor, color: buttonTextColor, borderRadius }}
                      >
                        OK
                      </button>
                    )}
                    <span className="text-sm" style={{ color: `${questionColor}80` }}>
                      pressione <strong>Enter</strong> ↵
                    </span>
                  </div>
                </motion.div>
              )}

              {isThankYou && (
                <motion.div
                  key="thanks"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: buttonColor }}
                  >
                    <Check size={32} style={{ color: buttonTextColor }} />
                  </div>
                  <h1
                    className="font-bold mb-4"
                    style={{ color: questionColor, fontSize: getTitleFontSize(fontSize) }}
                  >
                    {thankYouScreen?.title || 'Obrigado!'}
                  </h1>
                <p className="text-lg whitespace-pre-line" style={{ color: `${questionColor}b3` }}>
                  {thankYouScreen?.description || 'Suas respostas foram enviadas com sucesso.'}
                </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Navigation arrows */}
      {!isWelcome && !isThankYou && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-1">
          <button
            onClick={goPrev}
            disabled={currentIndex <= (welcomeScreen ? -1 : 0)}
            className="w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-30"
            style={{
              backgroundColor: `${questionColor}15`,
              color: questionColor,
              borderRadius,
            }}
          >
            <ChevronUp size={20} />
          </button>
          <button
            onClick={goNext}
            disabled={isLastQuestion || !canProceed()}
            className="w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-30"
            style={{
              backgroundColor: `${questionColor}15`,
              color: questionColor,
              borderRadius,
            }}
          >
            <ChevronDown size={20} />
          </button>
        </div>
      )}

      {/* FormFlow branding */}
      <div className="fixed bottom-4 left-4 text-xs" style={{ color: `${questionColor}4d` }}>
        Powered by FormFlow
      </div>
    </div>
  );
}
