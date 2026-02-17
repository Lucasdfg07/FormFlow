'use client';

import { useRouter } from 'next/navigation';
import { FileText, MoreHorizontal, Copy, Trash2, Eye, Edit3, Globe, Archive } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface FormCardProps {
  form: {
    id: string;
    title: string;
    status: string;
    slug: string;
    updatedAt: string;
    completionRate: number;
    _count: { responses: number };
  };
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  viewMode?: 'list' | 'grid';
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Rascunho', color: 'text-warning', bg: 'bg-warning-light' },
  PUBLISHED: { label: 'Publicado', color: 'text-success', bg: 'bg-success-light' },
  CLOSED: { label: 'Fechado', color: 'text-muted', bg: 'bg-surface-hover' },
};

export default function FormCard({ form, onDuplicate, onDelete, onStatusChange, viewMode = 'list' }: FormCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const status = statusConfig[form.status] || statusConfig.DRAFT;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const completionRate = form.completionRate;

  if (viewMode === 'grid') {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-150 group">
        {/* Thumbnail */}
        <div
          className="h-36 bg-gradient-to-br from-accent-light to-background-secondary flex items-center justify-center cursor-pointer"
          onClick={() => router.push(`/forms/${form.id}/edit`)}
        >
          <FileText size={32} className="text-muted" />
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3
              className="font-medium text-sm text-foreground line-clamp-2 cursor-pointer hover:underline"
              onClick={() => router.push(`/forms/${form.id}/edit`)}
            >
              {form.title}
            </h3>
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="p-1 rounded-md hover:bg-surface-hover text-muted transition-all"
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && renderMenu()}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted">
            <span>{form._count.responses} respostas</span>
            <span>{completionRate}%</span>
            <span>{new Date(form.updatedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
    );
  }

  function renderMenu() {
    return (
      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-lg shadow-lg z-50 py-1 animate-scale-in">
        <button
          onClick={() => { router.push(`/forms/${form.id}/edit`); setMenuOpen(false); }}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors"
        >
          <Edit3 size={15} /> Editar
        </button>
        {form.status === 'PUBLISHED' && (
          <button
            onClick={() => { window.open(`/f/${form.slug}`, '_blank'); setMenuOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors"
          >
            <Eye size={15} /> Visualizar
          </button>
        )}
        <button
          onClick={() => { router.push(`/forms/${form.id}/responses`); setMenuOpen(false); }}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors"
        >
          <Globe size={15} /> Respostas
        </button>
        <button
          onClick={() => { onDuplicate(form.id); setMenuOpen(false); }}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors"
        >
          <Copy size={15} /> Duplicar
        </button>
        {form.status !== 'CLOSED' && (
          <button
            onClick={() => { onStatusChange(form.id, form.status === 'DRAFT' ? 'PUBLISHED' : 'CLOSED'); setMenuOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors"
          >
            <Archive size={15} /> {form.status === 'DRAFT' ? 'Publicar' : 'Fechar'}
          </button>
        )}
        <hr className="my-1 border-border" />
        <button
          onClick={() => { onDelete(form.id); setMenuOpen(false); }}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-danger-light transition-colors"
        >
          <Trash2 size={15} /> Deletar
        </button>
      </div>
    );
  }

  // List view (default — Typeform style)
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-surface-hover/50 transition-all duration-100 group border-b border-border last:border-b-0 first:rounded-t-xl last:rounded-b-xl">
      {/* Form icon */}
      <div
        className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center flex-shrink-0 cursor-pointer"
        onClick={() => router.push(`/forms/${form.id}/edit`)}
      >
        <FileText size={18} className="text-accent" />
      </div>

      {/* Title */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => router.push(`/forms/${form.id}/edit`)}
      >
        <h3 className="font-medium text-sm text-foreground truncate group-hover:text-accent transition-colors">
          {form.title}
        </h3>
      </div>

      {/* Responses */}
      <div className="w-24 text-right">
        <span className="text-sm text-foreground">{form._count.responses}</span>
      </div>

      {/* Completion */}
      <div className="w-24 text-right hidden md:block">
        <span className="text-sm text-foreground">{completionRate}%</span>
      </div>

      {/* Updated */}
      <div className="w-32 text-right hidden lg:block">
        <span className="text-sm text-muted">
          {new Date(form.updatedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Status */}
      <div className="w-24 hidden sm:flex justify-center">
        <span className={`text-xs font-medium px-2.5 py-1 rounded ${status.color} ${status.bg}`}>
          {status.label}
        </span>
      </div>

      {/* Actions */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="p-1.5 rounded-md hover:bg-surface-hover text-muted transition-all"
        >
          <MoreHorizontal size={16} />
        </button>
        {menuOpen && renderMenu()}
      </div>
    </div>
  );
}
