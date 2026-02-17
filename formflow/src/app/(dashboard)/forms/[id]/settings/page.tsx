'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, Link as LinkIcon, Webhook, Tag, Plus, Trash2, X,
  ExternalLink, ChevronRight, Layers,
  Share2, MessageSquare,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';

interface TagData {
  id: string;
  name: string;
  color: string;
  _count: { responses: number };
}

interface TagRuleData {
  id: string;
  fieldId: string;
  operator: string;
  value: string;
  active: boolean;
  tag: { id: string; name: string; color: string };
}

interface FormField {
  id: string;
  title: string;
  type: string;
}

const OPERATOR_LABELS: Record<string, string> = {
  equals: 'Igual a',
  contains: 'Contem',
  gt: 'Maior que',
  lt: 'Menor que',
  empty: 'Esta vazio',
  not_empty: 'Nao esta vazio',
};

const TAG_COLORS = [
  '#b16cff', '#7c3aed', '#ec4899', '#e5484d', '#f97316',
  '#f2a900', '#2eb67d', '#10b981', '#06b6d4', '#3b82f6',
];

type SettingsSection = 'share' | 'welcome' | 'thankyou' | 'tags' | 'rules' | 'webhook';

export default function FormSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: formId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [activeSection, setActiveSection] = useState<SettingsSection>('share');
  const [copied, setCopied] = useState(false);

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookHeaders, setWebhookHeaders] = useState('');

  // Welcome/Thank You
  const [welcomeTitle, setWelcomeTitle] = useState('');
  const [welcomeDesc, setWelcomeDesc] = useState('');
  const [welcomeButton, setWelcomeButton] = useState('Comecar');
  const [thanksTitle, setThanksTitle] = useState('Obrigado!');
  const [thanksDesc, setThanksDesc] = useState('Suas respostas foram enviadas com sucesso.');

  // Tags
  const [tags, setTags] = useState<TagData[]>([]);
  const [tagRules, setTagRules] = useState<TagRuleData[]>([]);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#b16cff');
  const [showNewRule, setShowNewRule] = useState(false);
  const [newRuleTagId, setNewRuleTagId] = useState('');
  const [newRuleFieldId, setNewRuleFieldId] = useState('');
  const [newRuleOperator, setNewRuleOperator] = useState('equals');
  const [newRuleValue, setNewRuleValue] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [formRes, tagsRes, rulesRes] = await Promise.all([
          fetch(`/api/forms/${formId}`),
          fetch('/api/tags'),
          fetch(`/api/tags/rules?formId=${formId}`),
        ]);

        if (formRes.ok) {
          const data = await formRes.json();
          setForm(data);
          setFields(data.fields || []);

          if (data.welcomeScreen) {
            const ws = JSON.parse(data.welcomeScreen);
            setWelcomeTitle(ws.title || '');
            setWelcomeDesc(ws.description || '');
            setWelcomeButton(ws.buttonText || 'Comecar');
          }
          if (data.thankYouScreen) {
            const ts = JSON.parse(data.thankYouScreen);
            setThanksTitle(ts.title || 'Obrigado!');
            setThanksDesc(ts.description || '');
          }
        }

        if (tagsRes.ok) setTags(await tagsRes.json());
        if (rulesRes.ok) setTagRules(await rulesRes.json());

        const intRes = await fetch(`/api/integrations?formId=${formId}`);
        if (intRes.ok) {
          const intData = await intRes.json();
          if (intData.webhooks?.length > 0) {
            setWebhookUrl(intData.webhooks[0].url || '');
            setWebhookHeaders(intData.webhooks[0].headers || '');
          }
        }
      } catch (error) {
        console.error('Load settings error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [formId]);

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/f/${(form as Record<string, unknown>)?.slug || ''}`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          welcomeScreen: JSON.stringify({ title: welcomeTitle, description: welcomeDesc, buttonText: welcomeButton }),
          thankYouScreen: JSON.stringify({ title: thanksTitle, description: thanksDesc }),
        }),
      });

      if (webhookUrl) {
        await fetch('/api/integrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'webhook', formId, url: webhookUrl, headers: webhookHeaders || null }),
        });
      }
    } catch (error) {
      console.error('Save settings error:', error);
    } finally {
      setSaving(false);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      });
      if (res.ok) {
        const tag = await res.json();
        setTags([...tags, { ...tag, _count: { responses: 0 } }]);
        setNewTagName('');
        setShowNewTag(false);
      }
    } catch (error) {
      console.error('Create tag error:', error);
    }
  };

  const deleteTag = async (tagId: string) => {
    if (!confirm('Deletar esta tag?')) return;
    try {
      const res = await fetch(`/api/tags/${tagId}`, { method: 'DELETE' });
      if (res.ok) {
        setTags(tags.filter((t) => t.id !== tagId));
        setTagRules(tagRules.filter((r) => r.tag.id !== tagId));
      }
    } catch (error) {
      console.error('Delete tag error:', error);
    }
  };

  const createRule = async () => {
    if (!newRuleTagId || !newRuleFieldId) return;
    try {
      const res = await fetch('/api/tags/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          tagId: newRuleTagId,
          fieldId: newRuleFieldId,
          operator: newRuleOperator,
          value: newRuleValue,
        }),
      });
      if (res.ok) {
        const rule = await res.json();
        setTagRules([...tagRules, rule]);
        setShowNewRule(false);
        setNewRuleTagId(''); setNewRuleFieldId(''); setNewRuleOperator('equals'); setNewRuleValue('');
      }
    } catch (error) {
      console.error('Create rule error:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const res = await fetch(`/api/tags/rules?id=${ruleId}`, { method: 'DELETE' });
      if (res.ok) setTagRules(tagRules.filter((r) => r.id !== ruleId));
    } catch (error) {
      console.error('Delete rule error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin w-6 h-6 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  const sections = [
    { id: 'share' as const, label: 'Compartilhar link', icon: Share2 },
    { id: 'welcome' as const, label: 'Tela de boas-vindas', icon: MessageSquare },
    { id: 'thankyou' as const, label: 'Tela de agradecimento', icon: MessageSquare },
    { id: 'tags' as const, label: 'Tags', icon: Tag },
    { id: 'rules' as const, label: 'Regras automaticas', icon: Tag },
    { id: 'webhook' as const, label: 'Webhook', icon: Webhook },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col">
      {/* Top bar */}
      <div className="h-14 bg-white border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push('/forms')}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Layers size={16} />
            <span>Forms</span>
          </button>
          <ChevronRight size={14} className="text-muted" />
          <Link
            href={`/forms/${formId}/edit`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {(form as Record<string, unknown>)?.title as string || 'Formulario'}
          </Link>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0">
          <Link
            href={`/forms/${formId}/edit`}
            className="px-4 py-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Content
          </Link>
          <button className="px-4 py-4 text-sm font-medium text-foreground transition-colors relative">
            Share
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
          </button>
          <Link
            href={`/forms/${formId}/responses`}
            className="px-4 py-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Results
          </Link>
        </div>

        <Button onClick={saveSettings} loading={saving} size="sm">
          <Save size={14} /> Salvar
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left nav */}
        <div className="w-56 bg-background-secondary border-r border-border p-3 overflow-y-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-left transition-all ${
                  activeSection === section.id
                    ? 'bg-white text-foreground font-medium shadow-sm'
                    : 'text-muted-foreground hover:bg-white/50 hover:text-foreground'
                }`}
              >
                <Icon size={15} />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-xl mx-auto p-8 space-y-6">
            {/* Share */}
            {activeSection === 'share' && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Compartilhar o link</h2>
                  <p className="text-sm text-muted">Copie o link abaixo para compartilhar seu formulario</p>
                </div>

                {/* Link */}
                <div className="flex items-center gap-2">
                  <Button variant="accent" size="md" onClick={copyLink}>
                    <LinkIcon size={14} />
                    {copied ? 'Copiado!' : 'Copiar link'}
                  </Button>
                  <div className="flex-1 px-3 py-2 bg-background-secondary rounded-lg text-sm text-foreground truncate border border-border">
                    {publicUrl}
                  </div>
                  <Button variant="secondary" size="md" onClick={() => window.open(publicUrl, '_blank')}>
                    <ExternalLink size={14} />
                  </Button>
                </div>

                {/* Link preview */}
                <div className="pt-4">
                  <h3 className="text-sm font-medium text-foreground mb-3">Pre-visualizacao do link</h3>
                  <div className="bg-background-secondary border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center">
                        <Layers size={18} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {(form as Record<string, unknown>)?.title as string || 'Formulario'}
                        </p>
                        <p className="text-xs text-muted">formflow.app</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted">
                      Preencha este formulario criado com FormFlow.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Welcome Screen */}
            {activeSection === 'welcome' && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Tela de boas-vindas</h2>
                  <p className="text-sm text-muted">Configure a tela inicial do formulario</p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Titulo"
                    value={welcomeTitle}
                    onChange={(e) => setWelcomeTitle(e.target.value)}
                    placeholder="Bem-vindo ao nosso formulario!"
                  />
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Descricao</label>
                    <textarea
                      value={welcomeDesc}
                      onChange={(e) => setWelcomeDesc(e.target.value)}
                      placeholder="Uma breve descricao..."
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground placeholder-muted hover:border-border-hover focus:border-foreground transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Botao</label>
                    <input
                      value={welcomeButton}
                      onChange={(e) => setWelcomeButton(e.target.value)}
                      className="w-48 px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground hover:border-border-hover focus:border-foreground transition-all"
                    />
                    <p className="text-xs text-muted mt-1">{welcomeButton.length}/24</p>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-foreground mb-3">Pre-visualizacao</h3>
                  <div className="bg-[#1a1a2e] rounded-xl p-8 text-center">
                    <h2 className="text-xl font-bold text-white mb-2">{welcomeTitle || 'Titulo'}</h2>
                    <p className="text-white/60 text-sm mb-6">{welcomeDesc || 'Descricao...'}</p>
                    <span className="inline-block px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-medium">
                      {welcomeButton || 'Comecar'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Thank You Screen */}
            {activeSection === 'thankyou' && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Tela de agradecimento</h2>
                  <p className="text-sm text-muted">Configure a tela final apos o envio</p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Titulo"
                    value={thanksTitle}
                    onChange={(e) => setThanksTitle(e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Descricao</label>
                    <textarea
                      value={thanksDesc}
                      onChange={(e) => setThanksDesc(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground placeholder-muted hover:border-border-hover focus:border-foreground transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-foreground mb-3">Pre-visualizacao</h3>
                  <div className="bg-[#1a1a2e] rounded-xl p-8 text-center">
                    <h2 className="text-xl font-bold text-white mb-2">{thanksTitle || 'Obrigado!'}</h2>
                    <p className="text-white/60 text-sm">{thanksDesc || 'Suas respostas foram enviadas.'}</p>
                  </div>
                </div>
              </>
            )}

            {/* Tags */}
            {activeSection === 'tags' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Tags</h2>
                    <p className="text-sm text-muted">Categorize respostas com tags</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setShowNewTag(true)}>
                    <Plus size={14} /> Nova tag
                  </Button>
                </div>

                {tags.length === 0 && !showNewTag && (
                  <div className="text-center py-12 bg-background-secondary rounded-xl border border-border">
                    <Tag size={28} className="mx-auto text-muted mb-3" />
                    <p className="text-sm text-muted">Nenhuma tag criada</p>
                    <p className="text-xs text-muted mt-1">Tags permitem categorizar respostas automaticamente</p>
                  </div>
                )}

                <div className="space-y-2">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between px-4 py-3 bg-white border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                        <span className="text-sm font-medium text-foreground">{tag.name}</span>
                        <span className="text-xs text-muted bg-background-secondary px-2 py-0.5 rounded">
                          {tag._count.responses}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTag(tag.id)}
                        className="p-1 rounded-md hover:bg-danger-light text-muted hover:text-danger transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {showNewTag && (
                  <div className="p-4 bg-background-secondary rounded-xl border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Nova Tag</span>
                      <button onClick={() => setShowNewTag(false)} className="text-muted hover:text-foreground">
                        <X size={16} />
                      </button>
                    </div>
                    <Input
                      placeholder="Nome da tag"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                    />
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-2">Cor</label>
                      <div className="flex gap-2 flex-wrap">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewTagColor(color)}
                            className={`w-7 h-7 rounded-full transition-all ${
                              newTagColor === color ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <Button size="sm" onClick={createTag} disabled={!newTagName.trim()}>
                      Criar Tag
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Tag Rules */}
            {activeSection === 'rules' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Regras automaticas</h2>
                    <p className="text-sm text-muted">Aplique tags automaticamente baseado em condicoes</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowNewRule(true)}
                    disabled={tags.length === 0 || fields.length === 0}
                  >
                    <Plus size={14} /> Nova regra
                  </Button>
                </div>

                {(tags.length === 0 || fields.length === 0) && (
                  <div className="text-center py-12 bg-background-secondary rounded-xl border border-border">
                    <p className="text-sm text-muted">
                      {tags.length === 0 ? 'Crie tags primeiro' : 'Adicione campos ao formulario'}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {tagRules.map((rule) => {
                    const fieldName = fields.find((f) => f.id === rule.fieldId)?.title || 'Campo removido';
                    return (
                      <div key={rule.id} className="flex items-center justify-between px-4 py-3 bg-white border border-border rounded-lg">
                        <div className="flex items-center gap-2 flex-wrap text-sm">
                          <span className="text-muted">Se</span>
                          <span className="font-medium text-foreground bg-background-secondary px-2 py-0.5 rounded text-xs">{fieldName}</span>
                          <span className="text-muted">{OPERATOR_LABELS[rule.operator] || rule.operator}</span>
                          {!['empty', 'not_empty'].includes(rule.operator) && (
                            <span className="font-medium text-foreground bg-background-secondary px-2 py-0.5 rounded text-xs">&quot;{rule.value}&quot;</span>
                          )}
                          <span className="text-muted">→</span>
                          <span
                            className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{ backgroundColor: `${rule.tag.color}15`, color: rule.tag.color }}
                          >
                            {rule.tag.name}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="p-1 rounded-md hover:bg-danger-light text-muted hover:text-danger transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {showNewRule && (
                  <div className="p-4 bg-background-secondary rounded-xl border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Nova Regra</span>
                      <button onClick={() => setShowNewRule(false)} className="text-muted hover:text-foreground">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">Campo</label>
                        <select
                          value={newRuleFieldId}
                          onChange={(e) => setNewRuleFieldId(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground"
                        >
                          <option value="">Selecione...</option>
                          {fields.map((f) => (
                            <option key={f.id} value={f.id}>{f.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">Operador</label>
                        <select
                          value={newRuleOperator}
                          onChange={(e) => setNewRuleOperator(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground"
                        >
                          {Object.entries(OPERATOR_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {!['empty', 'not_empty'].includes(newRuleOperator) && (
                      <Input
                        label="Valor"
                        placeholder="Valor para comparar"
                        value={newRuleValue}
                        onChange={(e) => setNewRuleValue(e.target.value)}
                      />
                    )}

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Aplicar tag</label>
                      <select
                        value={newRuleTagId}
                        onChange={(e) => setNewRuleTagId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground"
                      >
                        <option value="">Selecione...</option>
                        {tags.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <Button size="sm" onClick={createRule} disabled={!newRuleTagId || !newRuleFieldId}>
                      Criar Regra
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Webhook */}
            {activeSection === 'webhook' && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Webhook</h2>
                  <p className="text-sm text-muted">Envie respostas automaticamente para URLs externas</p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="URL do Webhook"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.zapier.com/..."
                  />
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Headers (JSON, opcional)
                    </label>
                    <textarea
                      value={webhookHeaders}
                      onChange={(e) => setWebhookHeaders(e.target.value)}
                      placeholder='{"Authorization": "Bearer token..."}'
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground placeholder-muted hover:border-border-hover focus:border-foreground transition-all resize-none font-mono"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
