'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, List, Grid3x3, ArrowUpDown, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormCard from '@/components/forms/FormCard';
import CreateFormModal from '@/components/forms/CreateFormModal';

interface DashboardForm {
  id: string;
  title: string;
  status: string;
  slug: string;
  updatedAt: string;
  completionRate: number;
  _count: { responses: number };
}

type ViewMode = 'list' | 'grid';
type SortBy = 'date' | 'name' | 'responses';

export default function DashboardPage() {
  const router = useRouter();
  const [forms, setForms] = useState<DashboardForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [search, setSearch] = useState('');

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/forms');
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
  }, []);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/forms/${id}/duplicate`, { method: 'POST' });
      if (res.ok) fetchForms();
    } catch (error) {
      console.error('Error duplicating form:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este formulario?')) return;
    try {
      const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' });
      if (res.ok) fetchForms();
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/forms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchForms();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Filter and sort
  const filteredForms = forms
    .filter((f) => !search || f.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'responses') return b._count.responses - a._count.responses;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          {/* Skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div className="skeleton h-8 w-48" />
            <div className="skeleton h-10 w-40" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Workspace Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">Meu workspace</h1>
            <span className="text-sm text-muted bg-surface-hover px-2 py-0.5 rounded">
              {forms.length}
            </span>
          </div>
          <Button onClick={() => setShowCreateModal(true)} size="md">
            <Plus size={16} /> Novo formulario
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Buscar formularios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm text-foreground placeholder-muted hover:border-border-hover focus:border-foreground transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="flex items-center gap-1 text-sm">
              <ArrowUpDown size={14} className="text-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="bg-transparent text-sm text-foreground border-none focus:ring-0 cursor-pointer py-1"
              >
                <option value="date">Data de criacao</option>
                <option value="name">Nome</option>
                <option value="responses">Respostas</option>
              </select>
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-white border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
                }`}
                title="Lista"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
                }`}
                title="Grade"
              >
                <Grid3x3 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Forms */}
        {filteredForms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-border">
            <FileText size={40} className="mx-auto text-muted mb-4" />
            <h3 className="text-base font-semibold text-foreground mb-2">
              {search ? 'Nenhum formulario encontrado' : 'Nenhum formulario ainda'}
            </h3>
            <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
              {search
                ? 'Tente buscar com outros termos'
                : 'Crie seu primeiro formulario para comecar a coletar respostas'}
            </p>
            {!search && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus size={16} /> Criar formulario
              </Button>
            )}
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

            {/* List */}
            <div className="bg-white rounded-xl border border-border">
              {filteredForms.map((form) => (
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
            {filteredForms.map((form) => (
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
