'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useBuilderStore, BuilderField } from '@/stores/builder-store';
import FieldPalette from '@/components/builder/FieldPalette';
import BuilderCanvas from '@/components/builder/BuilderCanvas';
import FieldEditor from '@/components/builder/FieldEditor';
import Button from '@/components/ui/Button';
import { Eye, Globe, ChevronRight, Layers, Paintbrush } from 'lucide-react';
import Link from 'next/link';
import DesignEditor from '@/components/builder/DesignEditor';
import { DEFAULT_THEME } from '@/types';

type EditorTab = 'content' | 'design' | 'share' | 'results';

export default function FormEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: formId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formStatus, setFormStatus] = useState('DRAFT');
  const [activeTab, setActiveTab] = useState<EditorTab>('content');

  const {
    formTitle,
    setFormId,
    setFormTitle,
    setFields,
    fields,
    isDirty,
    isSaving,
    setSaving,
    setDirty,
    theme,
    setTheme,
  } = useBuilderStore();

  // Load form data
  useEffect(() => {
    const loadForm = async () => {
      try {
        const res = await fetch(`/api/forms/${formId}`);
        if (!res.ok) {
          router.push('/forms');
          return;
        }
        const form = await res.json();
        setFormId(form.id);
        setFormTitle(form.title);
        setFormStatus(form.status);

        // Load theme
        if (form.theme) {
          try {
            const parsed = typeof form.theme === 'string' ? JSON.parse(form.theme) : form.theme;
            setTheme({ ...DEFAULT_THEME, ...parsed });
          } catch {
            setTheme({ ...DEFAULT_THEME });
          }
        } else {
          setTheme({ ...DEFAULT_THEME });
        }

        const parsedFields: BuilderField[] = form.fields.map((f: Record<string, unknown>) => ({
          id: f.id,
          type: f.type,
          title: f.title,
          description: f.description,
          required: f.required,
          hidden: f.hidden ?? false,
          order: f.order,
          properties: f.properties ? JSON.parse(f.properties as string) : null,
          validations: f.validations ? JSON.parse(f.validations as string) : null,
          logic: f.logic ? JSON.parse(f.logic as string) : null,
        }));

        setFields(parsedFields);
      } catch (error) {
        console.error('Error loading form:', error);
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [formId, router, setFormId, setFormTitle, setFields]);

  // Auto-save
  const saveForm = useCallback(async () => {
    if (!isDirty || isSaving) return;
    setSaving(true);

    try {
      await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle, theme: JSON.stringify(theme) }),
      });

      const existingRes = await fetch(`/api/fields?formId=${formId}`);
      const existingFields: { id: string }[] = existingRes.ok ? await existingRes.json() : [];
      const existingIds = new Set(existingFields.map((f) => f.id));

      const newFields = fields.filter((f) => f.id.startsWith('temp_'));
      const updatedFields = fields.filter((f) => !f.id.startsWith('temp_'));

      for (const field of newFields) {
        await fetch('/api/fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formId,
            type: field.type,
            title: field.title,
            description: field.description,
            required: field.required,
            hidden: field.hidden,
            order: field.order,
            properties: field.properties,
            validations: field.validations,
            logic: field.logic,
          }),
        });
      }

      if (updatedFields.length > 0) {
        await fetch('/api/fields', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formId,
            fields: updatedFields.map((f) => ({
              id: f.id,
              order: f.order,
              title: f.title,
              description: f.description,
              required: f.required,
              hidden: f.hidden,
              properties: f.properties ? JSON.stringify(f.properties) : null,
              validations: f.validations ? JSON.stringify(f.validations) : null,
              logic: f.logic ? JSON.stringify(f.logic) : null,
            })),
          }),
        });
      }

      const currentIds = new Set(fields.filter((f) => !f.id.startsWith('temp_')).map((f) => f.id));
      for (const existingId of existingIds) {
        if (!currentIds.has(existingId)) {
          await fetch(`/api/fields?id=${existingId}`, { method: 'DELETE' });
        }
      }

      setDirty(false);

      const reloadRes = await fetch(`/api/forms/${formId}`);
      if (reloadRes.ok) {
        const form = await reloadRes.json();
        const parsedFields: BuilderField[] = form.fields.map((f: Record<string, unknown>) => ({
          id: f.id,
          type: f.type,
          title: f.title,
          description: f.description,
          required: f.required,
          hidden: f.hidden ?? false,
          order: f.order,
          properties: f.properties ? JSON.parse(f.properties as string) : null,
          validations: f.validations ? JSON.parse(f.validations as string) : null,
          logic: f.logic ? JSON.parse(f.logic as string) : null,
        }));
        setFields(parsedFields);
      }
    } catch (error) {
      console.error('Error saving form:', error);
    } finally {
      setSaving(false);
    }
  }, [formId, formTitle, fields, isDirty, isSaving, setSaving, setDirty, setFields, theme]);

  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(saveForm, 3000);
    return () => clearTimeout(timer);
  }, [isDirty, saveForm]);

  const togglePublish = async () => {
    const newStatus = formStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await saveForm();
    const res = await fetch(`/api/forms/${formId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setFormStatus(newStatus);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin w-6 h-6 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  const tabs = [
    { id: 'content' as const, label: 'Content' },
    { id: 'design' as const, label: 'Design' },
    { id: 'share' as const, label: 'Share', href: `/forms/${formId}/settings` },
    { id: 'results' as const, label: 'Results', href: `/forms/${formId}/responses` },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col">
      {/* Top Navigation Bar — Typeform Style */}
      <div className="h-14 bg-white border-b border-border flex items-center justify-between px-4">
        {/* Left: breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push('/forms')}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Layers size={16} />
            <span>Forms</span>
          </button>
          <ChevronRight size={14} className="text-muted" />
          <input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="bg-transparent text-foreground font-medium border-none outline-none max-w-[200px] text-sm"
            placeholder="Titulo do formulario"
          />
          {isDirty && (
            <span className="text-[10px] text-muted bg-surface-hover px-1.5 py-0.5 rounded">
              nao salvo
            </span>
          )}
          {isSaving && (
            <span className="text-[10px] text-accent px-1.5 py-0.5">Salvando...</span>
          )}
        </div>

        {/* Center: Tabs */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0">
          {tabs.map((tab) => (
            tab.href ? (
              <Link
                key={tab.id}
                href={tab.href}
                className="px-4 py-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative flex items-center gap-1.5"
              >
                {tab.label}
              </Link>
            ) : (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.id === 'design' && <Paintbrush size={14} />}
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
                )}
              </button>
            )
          ))}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {formStatus === 'PUBLISHED' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/f/${formId}`, '_blank')}
            >
              <Eye size={14} /> Preview
            </Button>
          )}
          <Button
            size="sm"
            onClick={togglePublish}
            variant={formStatus === 'PUBLISHED' ? 'secondary' : 'accent'}
          >
            <Globe size={14} />
            {formStatus === 'PUBLISHED' ? 'Publicado' : 'Publicar'}
          </Button>
        </div>
      </div>

      {/* Builder Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'content' && <FieldPalette />}
        <BuilderCanvas />
        {activeTab === 'content' && <FieldEditor />}
        {activeTab === 'design' && <DesignEditor />}
      </div>
    </div>
  );
}
