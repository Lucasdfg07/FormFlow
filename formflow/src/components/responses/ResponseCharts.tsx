'use client';

import { useMemo, useCallback, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { X, Filter, User, Mail, Phone, MapPin, Briefcase, Calendar, ExternalLink, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface FormField {
  id: string;
  title: string;
  type: string;
}

interface ResponseData {
  id: string;
  answers: string;
  createdAt: string;
  completedAt?: string | null;
  metadata?: string | null;
  tags?: { tag: { id: string; name: string; color: string } }[];
}

// A filter is: fieldId -> selected value(s)
export interface ChartFilter {
  fieldId: string;
  fieldTitle: string;
  value: string;
}

interface ResponseChartsProps {
  responses: ResponseData[];
  fields: FormField[];
  activeFilters: ChartFilter[];
  onFilterChange: (filters: ChartFilter[]) => void;
}

const CHART_COLORS = [
  '#b16cff', '#7c3aed', '#3b82f6', '#06b6d4', '#2eb67d',
  '#f2a900', '#f97316', '#e5484d', '#ec4899', '#8b5cf6',
  '#14b8a6', '#84cc16',
];

// Tokenize comma/semicolon separated text values
function tokenize(value: string): string[] {
  if (!value || !value.trim()) return [];

  // Split by comma, semicolon, " e ", " and ", or " / "
  const tokens = value
    .split(/[,;]|\s+e\s+|\s+and\s+|\s*\/\s*/gi)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length < 80);

  return tokens;
}

// Detect if a field has tokenizable text (multiple comma-separated values)
function isTokenizableField(values: string[]): boolean {
  const nonEmpty = values.filter((v) => v.trim());
  if (nonEmpty.length < 3) return false;

  const withSeparators = nonEmpty.filter((v) => /[,;]/.test(v) || /\s+e\s+/i.test(v));
  return withSeparators.length >= nonEmpty.length * 0.2; // at least 20% have separators
}

// Detect if a field should be grouped (has limited distinct values)
function isGroupableField(values: string[]): boolean {
  const nonEmpty = values.filter((v) => v.trim());
  if (nonEmpty.length < 2) return false;

  const unique = new Set(nonEmpty.map((v) => v.toLowerCase().trim()));
  // Groupable if there are fewer unique values relative to total, or <= 20 unique
  return unique.size <= 20 && unique.size < nonEmpty.length * 0.7;
}

// Classify what kind of summary to show for a field
type SummaryType = 'pie' | 'bar' | 'tokenized_bar' | 'none';

function classifyField(
  field: FormField,
  values: string[]
): SummaryType {
  const choiceTypes = ['multiple_choice', 'checkbox', 'dropdown', 'yes_no', 'rating', 'nps'];

  if (choiceTypes.includes(field.type)) {
    const nonEmpty = values.filter((v) => v.trim());
    const unique = new Set(nonEmpty.map((v) => v.toLowerCase().trim()));
    return unique.size <= 6 ? 'pie' : 'bar';
  }

  // Text fields: check if tokenizable
  const textTypes = ['short_text', 'long_text'];
  if (textTypes.includes(field.type)) {
    if (isTokenizableField(values)) return 'tokenized_bar';
    if (isGroupableField(values)) {
      const nonEmpty = values.filter((v) => v.trim());
      const unique = new Set(nonEmpty.map((v) => v.toLowerCase().trim()));
      return unique.size <= 6 ? 'pie' : 'bar';
    }
  }

  // Email, phone, url, date — check if groupable
  const otherTypes = ['email', 'phone', 'url', 'date'];
  if (otherTypes.includes(field.type)) {
    if (isGroupableField(values)) {
      const nonEmpty = values.filter((v) => v.trim());
      const unique = new Set(nonEmpty.map((v) => v.toLowerCase().trim()));
      return unique.size <= 6 ? 'pie' : 'bar';
    }
  }

  return 'none';
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-xs text-accent font-semibold">{payload[0].value} resposta(s)</p>
    </div>
  );
};

export default function ResponseCharts({
  responses,
  fields,
  activeFilters,
  onFilterChange,
}: ResponseChartsProps) {
  const parsedAnswers = useMemo(() => {
    return responses.map((r) => ({
      ...r,
      parsedAnswers: JSON.parse(r.answers) as Record<string, unknown>,
    }));
  }, [responses]);

  // Apply filters to get filtered responses
  // Logic: OR within same field (e.g. "Junior" OR "JR"), AND across different fields
  const filteredParsed = useMemo(() => {
    if (activeFilters.length === 0) return parsedAnswers;

    // Group filters by fieldId
    const filtersByField = new Map<string, ChartFilter[]>();
    for (const filter of activeFilters) {
      const existing = filtersByField.get(filter.fieldId) || [];
      existing.push(filter);
      filtersByField.set(filter.fieldId, existing);
    }

    return parsedAnswers.filter((r) => {
      // AND across fields: every field group must match
      return Array.from(filtersByField.entries()).every(([fieldId, fieldFilters]) => {
        const val = r.parsedAnswers[fieldId];
        if (val === undefined || val === null) return false;

        const strVal = String(val);
        const field = fields.find((f) => f.id === fieldId);

        // Check if field is tokenizable
        const fieldValues = parsedAnswers.map((pr) => String(pr.parsedAnswers[fieldId] || ''));
        const isTokenizable = field && (field.type === 'short_text' || field.type === 'long_text') && isTokenizableField(fieldValues);

        // OR within same field: at least one filter value must match
        return fieldFilters.some((filter) => {
          if (isTokenizable) {
            const tokens = tokenize(strVal).map((t) => t.toLowerCase());
            return tokens.includes(filter.value.toLowerCase());
          }

          if (Array.isArray(val)) {
            return val.some((v) => String(v).toLowerCase() === filter.value.toLowerCase());
          }

          return strVal.toLowerCase() === filter.value.toLowerCase();
        });
      });
    });
  }, [parsedAnswers, activeFilters, fields]);

  // Toggle a filter
  const toggleFilter = useCallback(
    (fieldId: string, fieldTitle: string, value: string) => {
      const exists = activeFilters.find(
        (f) => f.fieldId === fieldId && f.value.toLowerCase() === value.toLowerCase()
      );

      if (exists) {
        onFilterChange(activeFilters.filter((f) => !(f.fieldId === fieldId && f.value.toLowerCase() === value.toLowerCase())));
      } else {
        onFilterChange([...activeFilters, { fieldId, fieldTitle, value }]);
      }
    },
    [activeFilters, onFilterChange]
  );

  const isFilterActive = useCallback(
    (fieldId: string, value: string) => {
      return activeFilters.some(
        (f) => f.fieldId === fieldId && f.value.toLowerCase() === value.toLowerCase()
      );
    },
    [activeFilters]
  );

  // Cross-filter helper: get responses filtered by all filters EXCEPT a specific field
  // This lets each chart show available options given the constraints from other fields
  const getResponsesExcludingField = useCallback(
    (excludeFieldId: string) => {
      const otherFilters = activeFilters.filter((f) => f.fieldId !== excludeFieldId);
      if (otherFilters.length === 0) return parsedAnswers;

      const filtersByField = new Map<string, ChartFilter[]>();
      for (const filter of otherFilters) {
        const existing = filtersByField.get(filter.fieldId) || [];
        existing.push(filter);
        filtersByField.set(filter.fieldId, existing);
      }

      return parsedAnswers.filter((r) => {
        return Array.from(filtersByField.entries()).every(([fieldId, fieldFilters]) => {
          const val = r.parsedAnswers[fieldId];
          if (val === undefined || val === null) return false;

          const strVal = String(val);
          const field = fields.find((f) => f.id === fieldId);
          const fieldValues = parsedAnswers.map((pr) => String(pr.parsedAnswers[fieldId] || ''));
          const isTokenizable = field && (field.type === 'short_text' || field.type === 'long_text') && isTokenizableField(fieldValues);

          return fieldFilters.some((filter) => {
            if (isTokenizable) {
              const tokens = tokenize(strVal).map((t) => t.toLowerCase());
              return tokens.includes(filter.value.toLowerCase());
            }
            if (Array.isArray(val)) {
              return val.some((v) => String(v).toLowerCase() === filter.value.toLowerCase());
            }
            return strVal.toLowerCase() === filter.value.toLowerCase();
          });
        });
      });
    },
    [parsedAnswers, activeFilters, fields]
  );

  // Responses over time (uses fully filtered data)
  const timelineData = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      days[key] = 0;
    }

    for (const r of filteredParsed) {
      const date = new Date(r.createdAt);
      const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (days[key] !== undefined) {
        days[key]++;
      }
    }

    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [filteredParsed]);

  // Build distribution for each field using CROSS-FILTERING:
  // Each chart uses data filtered by all OTHER fields, but NOT its own field.
  // This way the chart always shows all available options for its field
  // given the constraints from other fields.
  const getFieldDistribution = useCallback(
    (field: FormField, summaryType: SummaryType) => {
      const crossFilteredData = getResponsesExcludingField(field.id);
      const counts: Record<string, number> = {};

      for (const r of crossFilteredData) {
        const val = r.parsedAnswers[field.id];
        if (val === undefined || val === null) continue;

        if (summaryType === 'tokenized_bar') {
          const tokens = tokenize(String(val));
          for (const token of tokens) {
            const key = token;
            counts[key] = (counts[key] || 0) + 1;
          }
        } else if (Array.isArray(val)) {
          for (const v of val) {
            const key = String(v);
            counts[key] = (counts[key] || 0) + 1;
          }
        } else {
          const key = String(val);
          if (key.trim()) {
            counts[key] = (counts[key] || 0) + 1;
          }
        }
      }

      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },
    [getResponsesExcludingField]
  );

  // Classify all fields
  const fieldSummaries = useMemo(() => {
    return fields
      .map((field) => {
        const values = parsedAnswers.map((r) => String(r.parsedAnswers[field.id] || ''));
        const summaryType = classifyField(field, values);
        return { field, summaryType };
      })
      .filter((fs) => fs.summaryType !== 'none');
  }, [fields, parsedAnswers]);

  // Track which charts are hidden
  const [hiddenCharts, setHiddenCharts] = useState<Set<string>>(new Set());

  const toggleChartVisibility = useCallback((fieldId: string) => {
    setHiddenCharts((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  }, []);

  // Detect "profile" fields for the profiles section
  const getProfileIcon = (field: FormField) => {
    const title = field.title.toLowerCase();
    if (title.includes('nome') || title.includes('name')) return User;
    if (title.includes('email') || title.includes('e-mail') || field.type === 'email') return Mail;
    if (title.includes('telefone') || title.includes('phone') || title.includes('celular') || field.type === 'phone') return Phone;
    if (title.includes('endereço') || title.includes('endereco') || title.includes('address')) return MapPin;
    if (title.includes('stack') || title.includes('linguag') || title.includes('senioridade') || title.includes('vaga')) return Briefcase;
    if (title.includes('data') || title.includes('date') || title.includes('idade')) return Calendar;
    if (title.includes('linkedin') || title.includes('url') || title.includes('link') || field.type === 'url') return ExternalLink;
    return User;
  };

  if (responses.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Active filters bar */}
      {activeFilters.length > 0 && (
        <div className="bg-accent-light/5 border border-accent-light/20 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-medium text-accent-light">
            <Filter size={13} />
            <span>Filtros ativos:</span>
          </div>
          {activeFilters.map((filter, idx) => (
            <button
              key={`${filter.fieldId}-${filter.value}-${idx}`}
              onClick={() => toggleFilter(filter.fieldId, filter.fieldTitle, filter.value)}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-accent-light/10 text-accent-light hover:bg-accent-light/20 transition-colors font-medium"
            >
              <span className="text-accent-light/60">{filter.fieldTitle}:</span>
              {filter.value}
              <X size={11} />
            </button>
          ))}
          <button
            onClick={() => onFilterChange([])}
            className="text-xs text-muted hover:text-foreground ml-auto transition-colors"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* Summary counts */}
      {activeFilters.length > 0 && (
        <p className="text-sm text-muted">
          Mostrando <strong className="text-foreground">{filteredParsed.length}</strong> de{' '}
          <strong className="text-foreground">{parsedAnswers.length}</strong> respostas
        </p>
      )}

      {/* Timeline */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Respostas ao longo do tempo</h3>
        <p className="text-xs text-muted mb-4">Últimos 30 dias</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b16cff" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#b16cff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1e1e1" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#8c8c8c', fontSize: 10 }}
                axisLine={{ stroke: '#e1e1e1' }}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#8c8c8c', fontSize: 11 }}
                axisLine={{ stroke: '#e1e1e1' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#b16cff"
                strokeWidth={2}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Collapsed charts — compact chips */}
      {fieldSummaries.some(({ field }) => hiddenCharts.has(field.id)) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted mr-1">Ocultos:</span>
          {fieldSummaries
            .filter(({ field }) => hiddenCharts.has(field.id))
            .map(({ field }) => {
              const hasActiveFilter = activeFilters.some((f) => f.fieldId === field.id);
              return (
                <button
                  key={field.id}
                  onClick={() => toggleChartVisibility(field.id)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-surface-hover ${
                    hasActiveFilter
                      ? 'border-accent-light/40 bg-accent-light/5 text-accent-light'
                      : 'border-border bg-white text-foreground'
                  }`}
                >
                  <Eye size={12} className="text-muted" />
                  {field.title}
                  {hasActiveFilter && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-light" />
                  )}
                </button>
              );
            })}
        </div>
      )}

      {/* Field distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fieldSummaries.map(({ field, summaryType }) => {
          if (hiddenCharts.has(field.id)) return null;

          const data = getFieldDistribution(field, summaryType);
          if (data.length === 0) return null;

          const total = data.reduce((sum, d) => sum + d.value, 0);
          const isPie = summaryType === 'pie' && data.length <= 6;
          const hasActiveFilter = activeFilters.some((f) => f.fieldId === field.id);

          return (
            <div
              key={field.id}
              className={`bg-white border rounded-xl p-6 transition-colors ${
                hasActiveFilter ? 'border-accent-light/40 ring-1 ring-accent-light/20' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="text-sm font-semibold text-foreground">{field.title}</h3>
                <div className="flex items-center gap-2">
                  {hasActiveFilter && (
                    <span className="text-[10px] bg-accent-light/10 text-accent-light px-2 py-0.5 rounded-full font-medium">
                      Filtro ativo
                    </span>
                  )}
                  <button
                    onClick={() => toggleChartVisibility(field.id)}
                    className="text-muted hover:text-foreground transition-colors p-1 rounded-md hover:bg-surface-hover"
                    title="Esconder gráfico"
                  >
                    <EyeOff size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted mb-4">{total} respostas</p>

              {isPie ? (
                    <div className="flex items-center gap-6">
                      <div className="h-40 w-40 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={60}
                              paddingAngle={2}
                              dataKey="value"
                              nameKey="name"
                              style={{ cursor: 'pointer' }}
                              onClick={(entry) => {
                                if (entry && entry.name) {
                                  toggleFilter(field.id, field.title, entry.name);
                                }
                              }}
                            >
                              {data.map((d, i) => (
                                <Cell
                                  key={i}
                                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                                  opacity={isFilterActive(field.id, d.name) ? 1 : hasActiveFilter ? 0.3 : 0.85}
                                  stroke={isFilterActive(field.id, d.name) ? '#000' : 'none'}
                                  strokeWidth={isFilterActive(field.id, d.name) ? 2 : 0}
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-1.5 flex-1">
                        {data.map((d, i) => {
                          const pct = Math.round((d.value / total) * 100);
                          const active = isFilterActive(field.id, d.name);
                          return (
                            <button
                              key={d.name}
                              onClick={() => toggleFilter(field.id, field.title, d.name)}
                              className={`flex items-center justify-between text-sm w-full px-2 py-1 rounded-md transition-all ${
                                active
                                  ? 'bg-accent-light/10 ring-1 ring-accent-light/30'
                                  : 'hover:bg-surface-hover'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                                />
                                <span className={`text-xs ${active ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                                  {d.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted">{pct}%</span>
                                <span className="text-xs font-medium text-foreground w-6 text-right">{d.value}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: Math.max(180, data.length * 30) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data}
                          layout="vertical"
                          onClick={(state) => {
                            if (state?.activeLabel) {
                              toggleFilter(field.id, field.title, String(state.activeLabel));
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                          margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e1e1e1" horizontal={false} />
                          <XAxis
                            type="number"
                            tick={{ fill: '#8c8c8c', fontSize: 11 }}
                            axisLine={{ stroke: '#e1e1e1' }}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fill: '#8c8c8c', fontSize: 10 }}
                            axisLine={{ stroke: '#e1e1e1' }}
                            tickLine={false}
                            width={140}
                            interval={0}
                            tickFormatter={(value: string) =>
                              value.length > 22 ? value.substring(0, 20) + '…' : value
                            }
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                            {data.map((d, i) => {
                              const active = isFilterActive(field.id, d.name);
                              return (
                                <Cell
                                  key={i}
                                  fill={active ? '#b16cff' : '#b16cff'}
                                  opacity={active ? 1 : hasActiveFilter ? 0.3 : 0.85}
                                  stroke={active ? '#7c3aed' : 'none'}
                                  strokeWidth={active ? 2 : 0}
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
            </div>
          );
        })}
      </div>

      {/* Profiles Section — always visible */}
      {filteredParsed.length > 0 && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-surface-hover/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <User size={15} />
                  {activeFilters.length > 0 ? 'Perfis filtrados' : 'Todas as respostas'}
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {activeFilters.length > 0
                    ? `${filteredParsed.length} de ${parsedAnswers.length} resposta${parsedAnswers.length !== 1 ? 's' : ''}`
                    : `${filteredParsed.length} resposta${filteredParsed.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {filteredParsed.slice(0, 50).map((response, idx) => {
              const answers = response.parsedAnswers;

              return (
                <div
                  key={response.id}
                  className="px-6 py-4 hover:bg-surface-hover/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-accent-light/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-semibold text-accent-light">
                          {String(idx + 1)}
                        </span>
                      </div>

                      {/* Profile info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {fields.map((field) => {
                          const val = answers[field.id];
                          if (!val || !String(val).trim()) return null;

                          const strVal = String(val);
                          const Icon = getProfileIcon(field);
                          const isUrl = field.type === 'url' || strVal.startsWith('http') || strVal.startsWith('www.');
                          const isHighlighted = activeFilters.some((f) => {
                            if (f.fieldId !== field.id) return false;
                            const fieldValues = parsedAnswers.map((pr) => String(pr.parsedAnswers[field.id] || ''));
                            if (isTokenizableField(fieldValues)) {
                              return tokenize(strVal).some((t) => t.toLowerCase() === f.value.toLowerCase());
                            }
                            return strVal.toLowerCase() === f.value.toLowerCase();
                          });

                          return (
                            <div key={field.id} className="flex items-start gap-2 group/field">
                              <Icon
                                size={13}
                                className={`mt-0.5 flex-shrink-0 ${
                                  isHighlighted ? 'text-accent-light' : 'text-muted'
                                }`}
                              />
                              <div className="min-w-0">
                                <span className="text-[10px] text-muted block leading-tight">{field.title}</span>
                                {isUrl ? (
                                  <a
                                    href={strVal.startsWith('http') ? strVal : `https://${strVal}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-xs hover:underline block truncate ${
                                      isHighlighted ? 'text-accent-light font-semibold' : 'text-blue-600'
                                    }`}
                                  >
                                    {strVal}
                                  </a>
                                ) : (
                                  <span
                                    className={`text-xs block ${
                                      isHighlighted
                                        ? 'text-foreground font-semibold bg-accent-light/5 px-1 -mx-1 rounded'
                                        : 'text-foreground'
                                    }`}
                                  >
                                    {strVal.length > 120 ? strVal.substring(0, 120) + '...' : strVal}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Tags */}
                        {response.tags && response.tags.length > 0 && (
                          <div className="flex items-center gap-1 pt-0.5">
                            {response.tags.map((t) => (
                              <span
                                key={t.tag.id}
                                className="text-[10px] px-2 py-0.5 rounded font-medium"
                                style={{
                                  backgroundColor: `${t.tag.color}15`,
                                  color: t.tag.color,
                                }}
                              >
                                {t.tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-muted">
                        {new Date(response.createdAt).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredParsed.length > 50 && (
              <div className="px-6 py-3 text-center text-xs text-muted bg-surface-hover/20">
                Mostrando 50 de {filteredParsed.length} perfis
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
