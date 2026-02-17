'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download, Trash2, Tag, BarChart3, X,
  Search, Calendar, TrendingUp,
  Users, Clock, CheckCircle2, ChevronRight, Layers,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ResponseCharts from '@/components/responses/ResponseCharts';
import Link from 'next/link';

interface ResponseData {
  id: string;
  answers: string;
  metadata: string | null;
  completedAt: string | null;
  createdAt: string;
  tags: { tag: { id: string; name: string; color: string } }[];
}

interface FormField {
  id: string;
  title: string;
  type: string;
}

type ResultsTab = 'summary' | 'responses';

export default function ResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: formId } = use(params);
  const router = useRouter();
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formTitle, setFormTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(null);
  const [activeTab, setActiveTab] = useState<ResultsTab>('summary');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const [formRes, responsesRes] = await Promise.all([
        fetch(`/api/forms/${formId}`),
        fetch(`/api/responses?formId=${formId}`),
      ]);

      if (formRes.ok) {
        const form = await formRes.json();
        setFormTitle(form.title);
        setFields(form.fields);
      }

      if (responsesRes.ok) {
        const data = await responsesRes.json();
        setResponses(data);
      }
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [formId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stats
  const stats = useMemo(() => {
    const total = responses.length;
    const completed = responses.filter((r) => r.completedAt).length;
    const today = responses.filter((r) => new Date(r.createdAt).toDateString() === new Date().toDateString()).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Average completion time
    const durations = responses
      .filter((r) => r.metadata)
      .map((r) => {
        try {
          const meta = JSON.parse(r.metadata!);
          return meta.duration || 0;
        } catch { return 0; }
      })
      .filter((d) => d > 0);
    const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000) : 0;

    return { total, completed, today, completionRate, avgDuration };
  }, [responses]);

  // Tags
  const allTags = Array.from(
    new Map(
      responses.flatMap((r) => r.tags.map((t) => [t.tag.id, t.tag] as [string, typeof t.tag]))
    ).values()
  );

  // Filtered responses
  const filteredResponses = useMemo(() => {
    let result = responses;
    if (tagFilter) {
      result = result.filter((r) => r.tags.some((t) => t.tag.id === tagFilter));
    }
    if (searchQuery) {
      result = result.filter((r) => {
        const answers = JSON.parse(r.answers);
        return Object.values(answers).some((v) =>
          String(v).toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }
    return result;
  }, [responses, tagFilter, searchQuery]);

  // Actions
  const deleteResponse = async (id: string) => {
    if (!confirm('Deletar esta resposta?')) return;
    try {
      const res = await fetch(`/api/responses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setResponses(responses.filter((r) => r.id !== id));
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      }
    } catch (error) {
      console.error('Delete response error:', error);
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Deletar ${selectedIds.size} resposta(s) selecionada(s)?`)) return;
    try {
      for (const id of selectedIds) {
        await fetch(`/api/responses?id=${id}`, { method: 'DELETE' });
      }
      setResponses(responses.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Batch delete error:', error);
    }
  };

  const deleteAll = async () => {
    if (!confirm(`Deletar TODAS as ${responses.length} respostas?`)) return;
    try {
      const res = await fetch(`/api/responses?formId=${formId}&batch=true`, { method: 'DELETE' });
      if (res.ok) { setResponses([]); setSelectedIds(new Set()); }
    } catch (error) {
      console.error('Delete all error:', error);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredResponses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResponses.map((r) => r.id)));
    }
  };

  const exportCSV = () => {
    if (filteredResponses.length === 0) return;
    const headers = ['ID', 'Data', ...fields.map((f) => f.title), 'Tags'];
    const rows = filteredResponses.map((r) => {
      const answers = JSON.parse(r.answers);
      return [
        r.id,
        new Date(r.createdAt).toLocaleString('pt-BR'),
        ...fields.map((f) => {
          const val = answers[f.id];
          return typeof val === 'object' ? JSON.stringify(val) : String(val || '');
        }),
        r.tags.map((t) => t.tag.name).join(', '),
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formTitle}-respostas.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  const tabs = [
    { id: 'summary' as const, label: 'Resumo', count: null },
    { id: 'responses' as const, label: 'Respostas', count: responses.length },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col">
      {/* Top bar — Typeform Results style */}
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
          <Link
            href={`/forms/${formId}/edit`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {formTitle}
          </Link>
        </div>

        {/* Center: tabs */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0">
          <Link
            href={`/forms/${formId}/edit`}
            className="px-4 py-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Content
          </Link>
          <Link
            href={`/forms/${formId}/settings`}
            className="px-4 py-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Share
          </Link>
          <button className="px-4 py-4 text-sm font-medium text-foreground transition-colors relative">
            Results
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
          </button>
        </div>

        {/* Right: export */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={exportCSV} disabled={filteredResponses.length === 0}>
            <Download size={14} /> CSV
          </Button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="bg-white border-b border-border px-6">
        <div className="flex items-center gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
                {tab.count !== null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    activeTab === tab.id ? 'bg-foreground text-white' : 'bg-surface-hover text-muted'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'summary' ? (
          <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Stats */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Visao geral</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Respostas', value: stats.total, icon: Users, color: '#b16cff' },
                  { label: 'Hoje', value: stats.today, icon: TrendingUp, color: '#2eb67d' },
                  { label: 'Completas', value: stats.completed, icon: CheckCircle2, color: '#3b82f6' },
                  { label: 'Taxa conclusao', value: `${stats.completionRate}%`, icon: BarChart3, color: '#f2a900' },
                  { label: 'Tempo medio', value: stats.avgDuration > 0 ? `${Math.floor(stats.avgDuration / 60)}:${String(stats.avgDuration % 60).padStart(2, '0')}` : '--:--', icon: Clock, color: '#e5484d' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon size={15} style={{ color: stat.color }} />
                      <span className="text-xs text-muted font-medium">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts */}
            <ResponseCharts responses={responses} fields={fields} />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto p-6 space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {/* Search responses */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar respostas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-4 py-1.5 bg-white border border-border rounded-md text-sm text-foreground placeholder-muted hover:border-border-hover focus:border-foreground transition-all w-52"
                  />
                </div>

                {/* Tag filter */}
                {allTags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag size={13} className="text-muted" />
                    {allTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => setTagFilter(tagFilter === tag.id ? null : tag.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          tagFilter === tag.id
                            ? 'text-white'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor: tagFilter === tag.id ? tag.color : `${tag.color}15`,
                          color: tagFilter === tag.id ? 'white' : tag.color,
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                    {tagFilter && (
                      <button
                        onClick={() => setTagFilter(null)}
                        className="p-1 text-muted hover:text-foreground"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <Button variant="danger" size="sm" onClick={deleteSelected}>
                    <Trash2 size={13} /> Deletar {selectedIds.size}
                  </Button>
                )}
                {responses.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={deleteAll} className="text-danger hover:text-danger">
                    Limpar tudo
                  </Button>
                )}
              </div>
            </div>

            {/* Table */}
            {filteredResponses.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-border">
                <p className="text-muted text-sm">
                  {tagFilter || searchQuery ? 'Nenhuma resposta encontrada' : 'Nenhuma resposta ainda'}
                </p>
              </div>
            ) : (
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-background-secondary/50">
                        <th className="text-left px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === filteredResponses.length && filteredResponses.length > 0}
                            onChange={toggleSelectAll}
                            className="accent-foreground w-3.5 h-3.5 rounded"
                          />
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                          Data
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                          Status
                        </th>
                        {fields.map((f) => (
                          <th key={f.id} className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider whitespace-nowrap">
                            {f.title}
                          </th>
                        ))}
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                          Tags
                        </th>
                        <th className="text-right px-4 py-3 w-16" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResponses.map((response) => {
                        const answers = JSON.parse(response.answers);
                        return (
                          <tr
                            key={response.id}
                            className="border-b border-border hover:bg-surface-hover/50 transition-colors cursor-pointer"
                            onClick={() => setSelectedResponse(response)}
                          >
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(response.id)}
                                onChange={() => toggleSelect(response.id)}
                                className="accent-foreground w-3.5 h-3.5 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                              {new Date(response.createdAt).toLocaleDateString('pt-BR', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                              <span className="text-muted ml-1 text-xs">
                                {new Date(response.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                response.completedAt
                                  ? 'bg-success-light text-success'
                                  : 'bg-warning-light text-warning'
                              }`}>
                                {response.completedAt ? 'Completa' : 'Parcial'}
                              </span>
                            </td>
                            {fields.map((f) => (
                              <td key={f.id} className="px-4 py-3 text-sm text-foreground max-w-[200px] truncate">
                                {typeof answers[f.id] === 'object'
                                  ? JSON.stringify(answers[f.id])
                                  : String(answers[f.id] || '—')}
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {response.tags.map((t) => (
                                  <span
                                    key={t.tag.id}
                                    className="text-[10px] px-2 py-0.5 rounded font-medium"
                                    style={{ backgroundColor: `${t.tag.color}15`, color: t.tag.color }}
                                  >
                                    {t.tag.name}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => deleteResponse(response.id)}
                                className="p-1 rounded-md text-muted hover:text-danger hover:bg-danger-light transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Response Detail Slide-in Panel */}
      {selectedResponse && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="flex-1" onClick={() => setSelectedResponse(null)} />
          <div className="w-full max-w-md bg-white border-l border-border shadow-2xl overflow-y-auto animate-slide-in">
            <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Detalhes da Resposta</h2>
              <button onClick={() => setSelectedResponse(null)} className="p-1 rounded-md hover:bg-surface-hover text-muted">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-2 text-xs text-muted">
                <Calendar size={13} />
                {new Date(selectedResponse.createdAt).toLocaleString('pt-BR')}
              </div>

              {selectedResponse.completedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-success" />
                  <span className="text-xs text-success font-medium">Resposta completa</span>
                </div>
              )}

              <hr className="border-border" />

              {fields.map((f) => {
                const answers = JSON.parse(selectedResponse.answers);
                const val = answers[f.id];
                return (
                  <div key={f.id}>
                    <p className="text-xs text-muted font-medium mb-1">{f.title}</p>
                    <p className="text-sm text-foreground">
                      {val === undefined || val === null
                        ? '—'
                        : typeof val === 'object'
                        ? JSON.stringify(val)
                        : String(val)}
                    </p>
                  </div>
                );
              })}

              {selectedResponse.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted font-medium flex items-center gap-1 mb-1.5">
                    <Tag size={12} /> Tags
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {selectedResponse.tags.map((t) => (
                      <span
                        key={t.tag.id}
                        className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{ backgroundColor: `${t.tag.color}15`, color: t.tag.color }}
                      >
                        {t.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <hr className="border-border" />

              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  deleteResponse(selectedResponse.id);
                  setSelectedResponse(null);
                }}
              >
                <Trash2 size={13} /> Deletar resposta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
