'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X, Tag as TagIcon, Search } from 'lucide-react';

interface TagData {
  id: string;
  name: string;
  color: string;
}

interface InlineTagSelectorProps {
  responseId: string;
  currentTags: { tag: TagData }[];
  onTagsChanged: (responseId: string, tags: { tag: TagData }[]) => void;
}

const TAG_COLORS = [
  '#6366f1', '#f43f5e', '#22c55e', '#f59e0b',
  '#3b82f6', '#a855f7', '#ec4899', '#14b8a6',
  '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16',
];

export default function InlineTagSelector({
  responseId,
  currentTags,
  onTagsChanged,
}: InlineTagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all available tags when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchAllTags();
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const fetchAllTags = async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setAllTags(data.map((t: TagData & { _count?: unknown }) => ({
          id: t.id,
          name: t.name,
          color: t.color,
        })));
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const addTag = async (tagId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/responses/${responseId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      });

      if (res.ok) {
        const data = await res.json();
        const newTags = [...currentTags, { tag: data.tag }];
        onTagsChanged(responseId, newTags);
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAndAddTag = async (name: string) => {
    setLoading(true);
    try {
      const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
      const res = await fetch(`/api/responses/${responseId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagName: name, tagColor: color }),
      });

      if (res.ok) {
        const data = await res.json();
        const newTags = [...currentTags, { tag: data.tag }];
        onTagsChanged(responseId, newTags);
        setSearch('');
        // Refresh tag list to include the new tag
        fetchAllTags();
      }
    } catch (error) {
      console.error('Error creating tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeTag = async (tagId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/responses/${responseId}/tags?tagId=${tagId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const newTags = currentTags.filter((t) => t.tag.id !== tagId);
        onTagsChanged(responseId, newTags);
      }
    } catch (error) {
      console.error('Error removing tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentTagIds = new Set(currentTags.map((t) => t.tag.id));

  // Filter: available tags not yet assigned, matching search
  const availableTags = allTags.filter(
    (t) => !currentTagIds.has(t.id) && t.name.toLowerCase().includes(search.toLowerCase())
  );

  const searchTrimmed = search.trim();
  const canCreateNew =
    searchTrimmed.length > 0 &&
    !allTags.some((t) => t.name.toLowerCase() === searchTrimmed.toLowerCase());

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (availableTags.length > 0) {
        addTag(availableTags[0].id);
        setSearch('');
      } else if (canCreateNew) {
        createAndAddTag(searchTrimmed);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Current tags + add button */}
      <div
        className="flex items-center gap-1 flex-wrap min-h-[28px] cursor-pointer group"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {currentTags.map((t) => (
          <span
            key={t.tag.id}
            className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded font-medium whitespace-nowrap"
            style={{ backgroundColor: `${t.tag.color}15`, color: t.tag.color }}
          >
            {t.tag.name}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTag(t.tag.id);
              }}
              className="ml-0.5 hover:opacity-70 transition-opacity"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <span className="text-muted opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-0.5">
          <Plus size={12} /> Add tags
        </span>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-[200] top-full left-0 mt-1 w-64 bg-white border border-border rounded-lg shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-border flex items-center gap-2">
            <TagIcon size={14} className="text-muted flex-shrink-0" />
            <span className="text-xs font-medium text-foreground">Tags</span>
          </div>

          {/* Search / Create input */}
          <div className="px-3 py-2 border-b border-border">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Select tag or create new"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface border border-border rounded-md placeholder-muted text-foreground focus:outline-none focus:border-foreground transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          {/* Current tags (removable) */}
          {currentTags.length > 0 && (
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1.5 font-medium">Atribuídas</p>
              <div className="flex flex-wrap gap-1">
                {currentTags.map((t) => (
                  <button
                    key={t.tag.id}
                    onClick={() => removeTag(t.tag.id)}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md font-medium hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: `${t.tag.color}15`, color: t.tag.color }}
                    disabled={loading}
                  >
                    {t.tag.name}
                    <X size={10} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Available tags list */}
          <div className="max-h-44 overflow-y-auto">
            {availableTags.length > 0 ? (
              availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    addTag(tag.id);
                    setSearch('');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors text-left"
                  disabled={loading}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))
            ) : !canCreateNew ? (
              <div className="px-3 py-4 text-center text-xs text-muted">
                {search ? 'Nenhuma tag encontrada' : 'Todas as tags já foram atribuídas'}
              </div>
            ) : null}

            {/* Create new tag option */}
            {canCreateNew && (
              <button
                onClick={() => createAndAddTag(searchTrimmed)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors text-left border-t border-border"
                disabled={loading}
              >
                <Plus size={14} className="text-accent-light" />
                <span>
                  Criar <strong>&quot;{searchTrimmed}&quot;</strong>
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
