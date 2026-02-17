'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, List, Grid3x3, ArrowUpDown, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormCard from '@/components/forms/FormCard';
import CreateFormModal from '@/components/forms/CreateFormModal';

interface FormItem {
  id: string;
  title: string;
  status: string;
  slug: string;
  updatedAt: string;
  completionRate: number;
  _count: { responses: number };
}

const statusFilters = [
  { value: 'ALL', label: 'Todos' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'PUBLISHED', label: 'Publicado' },
  { value: 'CLOSED', label: 'Fechado' },
];

type ViewMode = 'list' | 'grid';

export default function FormsPage() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const fetchForms = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/forms?${params}`);
      if (res.ok) {
        const data = await res.json();
        setForms(data);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchForms();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDuplicate = async (id: string) => {
    const res = await fetch(`/api/forms/${id}/duplicate`, { method: 'POST' });
    if (res.ok) fetchForms();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este formulario?')) return;
    const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' });
    if (res.ok) fetchForms();
  };

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch(`/api/forms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchForms();
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Formularios</h1>
            <p className="text-sm text-muted mt-0.5">{forms.length} formulario(s)</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Novo formulario
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm text-foreground placeholder-muted hover:border-border-hover focus:border-foreground transition-all w-48"
              />
            </div>

            {/* Status filters */}
            <div className="flex items-center gap-1">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    statusFilter === filter.value
                      ? 'bg-foreground text-white'
                      : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-white border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list' ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid' ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              <Grid3x3 size={15} />
            </button>
          </div>
        </div>

        {/* Forms List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-border">
            <FileText size={40} className="mx-auto text-muted mb-4" />
            <p className="text-muted text-sm">
              {search || statusFilter !== 'ALL' ? 'Nenhum formulario encontrado' : 'Nenhum formulario criado ainda'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <>
            {/* Table Header */}
            <div className="flex items-center gap-4 px-4 py-2 text-xs font-medium text-muted uppercase tracking-wider">
              <div className="w-10 flex-shrink-0" />
              <div className="flex-1">Formulario</div>
              <div className="w-24 text-right">Respostas</div>
              <div className="w-24 text-right hidden md:block">Conclusao</div>
              <div className="w-32 text-right hidden lg:block">Atualizado</div>
              <div className="w-24 hidden sm:flex justify-center">Status</div>
              <div className="w-8" />
            </div>

            <div className="bg-white rounded-xl border border-border">
              {forms.map((form) => (
                <FormCard
                  key={form.id}
                  form={form}
                  viewMode="list"
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                viewMode="grid"
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        <CreateFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchForms}
        />
      </div>
    </div>
  );
}
