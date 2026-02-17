'use client';

import { useMemo } from 'react';
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
  LineChart,
  Line,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';

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
}

interface ResponseChartsProps {
  responses: ResponseData[];
  fields: FormField[];
}

const CHART_COLORS = [
  '#b16cff', '#7c3aed', '#3b82f6', '#06b6d4', '#2eb67d',
  '#f2a900', '#f97316', '#e5484d', '#ec4899', '#8b5cf6',
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-xs text-accent font-semibold">{payload[0].value} resposta(s)</p>
    </div>
  );
};

export default function ResponseCharts({ responses, fields }: ResponseChartsProps) {
  const parsedAnswers = useMemo(() => {
    return responses.map((r) => ({
      ...r,
      parsedAnswers: JSON.parse(r.answers) as Record<string, unknown>,
    }));
  }, [responses]);

  // Responses over time
  const timelineData = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      days[key] = 0;
    }

    for (const r of responses) {
      const date = new Date(r.createdAt);
      const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (days[key] !== undefined) {
        days[key]++;
      }
    }

    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [responses]);

  const chartableFields = useMemo(() => {
    const chartTypes = ['multiple_choice', 'checkbox', 'dropdown', 'yes_no', 'rating', 'nps'];
    return fields.filter((f) => chartTypes.includes(f.type));
  }, [fields]);

  const getFieldDistribution = (field: FormField) => {
    const counts: Record<string, number> = {};

    for (const r of parsedAnswers) {
      const val = r.parsedAnswers[field.id];
      if (val === undefined || val === null) continue;

      if (Array.isArray(val)) {
        for (const v of val) {
          const key = String(v);
          counts[key] = (counts[key] || 0) + 1;
        }
      } else {
        const key = String(val);
        counts[key] = (counts[key] || 0) + 1;
      }
    }

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  if (responses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Timeline — Area chart */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Respostas ao longo do tempo</h3>
        <p className="text-xs text-muted mb-4">Ultimos 14 dias</p>
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
                tick={{ fill: '#8c8c8c', fontSize: 11 }}
                axisLine={{ stroke: '#e1e1e1' }}
                tickLine={false}
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

      {/* Field distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {chartableFields.map((field) => {
          const data = getFieldDistribution(field);
          if (data.length === 0) return null;

          const isSmallDataset = data.length <= 6;
          const total = data.reduce((sum, d) => sum + d.value, 0);

          return (
            <div key={field.id} className="bg-white border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-0.5">{field.title}</h3>
              <p className="text-xs text-muted mb-4">{total} respostas</p>

              {isSmallDataset ? (
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
                        >
                          {data.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 flex-1">
                    {data.map((d, i) => {
                      const pct = Math.round((d.value / total) * 100);
                      return (
                        <div key={d.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                            />
                            <span className="text-foreground text-xs">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted">{pct}%</span>
                            <span className="text-xs font-medium text-foreground w-6 text-right">{d.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
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
                        tick={{ fill: '#8c8c8c', fontSize: 11 }}
                        axisLine={{ stroke: '#e1e1e1' }}
                        tickLine={false}
                        width={100}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#b16cff" radius={[0, 4, 4, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
