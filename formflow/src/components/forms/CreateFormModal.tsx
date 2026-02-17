'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface CreateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateFormModal({ isOpen, onClose, onCreated }: CreateFormModalProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });

      if (!res.ok) {
        setError('Erro ao criar formulario');
        return;
      }

      setTitle('');
      onClose();
      onCreated();
    } catch {
      setError('Erro ao criar formulario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Formulario">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titulo do formulario"
          placeholder="Ex: Pesquisa de Satisfacao"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} disabled={!title.trim()}>
            Criar formulario
          </Button>
        </div>
      </form>
    </Modal>
  );
}
