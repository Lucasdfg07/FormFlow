'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  FileText,
  Users,
  Tag,
} from 'lucide-react';
import Papa from 'papaparse';

interface ImportTypeformModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

// Colunas de metadados que não são perguntas
const META_COLUMNS = new Set([
  '#',
  'Response Type',
  'Start Date (UTC)',
  'Stage Date (UTC)',
  'Submit Date (UTC)',
  'Network ID',
  'Tags',
  'Ending',
]);

type Step = 'upload' | 'preview' | 'importing' | 'done';

interface PreviewData {
  headers: string[];
  questionHeaders: string[];
  rows: Record<string, string>[];
  totalRows: number;
  tagsFound: string[];
}

export default function ImportTypeformModal({
  isOpen,
  onClose,
  onImported,
}: ImportTypeformModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    formId: string;
    fieldsCreated: number;
    responsesImported: number;
    tagsCreated: number;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const reset = () => {
    setStep('upload');
    setFile(null);
    setFormTitle('');
    setPreview(null);
    setError('');
    setImporting(false);
    setResult(null);
    setDragActive(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const parseFile = useCallback((csvFile: File) => {
    setError('');
    setFile(csvFile);

    // Gerar título baseado no nome do arquivo
    const fileName = csvFile.name.replace(/\.csv$/i, '').replace(/^responses-/, '');
    setFormTitle(fileName.length > 50 ? fileName.substring(0, 50) : fileName);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setError('Não foi possível ler o arquivo');
        return;
      }

      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim(),
      });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        setError('Erro ao analisar o CSV. Verifique se o formato está correto.');
        return;
      }

      const rows = parsed.data as Record<string, string>[];
      const allHeaders = parsed.meta.fields || [];
      const questionHeaders = allHeaders.filter((h) => !META_COLUMNS.has(h));

      if (questionHeaders.length === 0) {
        setError('Nenhuma coluna de pergunta encontrada no CSV.');
        return;
      }

      if (rows.length === 0) {
        setError('O CSV não contém nenhuma resposta.');
        return;
      }

      // Coletar tags únicas
      const tagsSet = new Set<string>();
      rows.forEach((row) => {
        const tags = row['Tags'];
        if (tags?.trim()) {
          tags.split(',').forEach((t) => {
            if (t.trim()) tagsSet.add(t.trim());
          });
        }
      });

      setPreview({
        headers: allHeaders,
        questionHeaders,
        rows: rows.slice(0, 5), // Preview das primeiras 5 linhas
        totalRows: rows.length,
        tagsFound: [...tagsSet],
      });

      setStep('preview');
    };

    reader.onerror = () => setError('Erro ao ler o arquivo');
    reader.readAsText(csvFile, 'utf-8');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv')) {
        parseFile(droppedFile);
      } else {
        setError('Por favor, envie um arquivo CSV');
      }
    },
    [parseFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) parseFile(selected);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setStep('importing');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', formTitle || 'Importado do Typeform');

      const res = await fetch('/api/import/typeform', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao importar');
        setStep('preview');
        return;
      }

      setResult(data);
      setStep('done');
      onImported();
    } catch {
      setError('Erro de conexão ao importar');
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'done' ? 'Importação concluída!' : 'Importar do Typeform'}
      maxWidth="max-w-2xl"
    >
      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Exporte seus dados do Typeform como CSV e faça o upload aqui. O FormFlow criará
            automaticamente um formulário com todas as perguntas e respostas.
          </p>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border hover:border-primary/50 hover:bg-surface-hover'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                  dragActive ? 'bg-primary/10 text-primary' : 'bg-surface-hover text-muted'
                }`}
              >
                <Upload size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Arraste seu arquivo CSV aqui
                </p>
                <p className="text-xs text-muted mt-1">ou clique para selecionar</p>
              </div>
            </div>
          </div>

          {/* Como exportar */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-medium text-blue-700 mb-2">💡 Como exportar do Typeform:</p>
            <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
              <li>Abra seu formulário no Typeform</li>
              <li>
                Vá em <strong>Resultados</strong> → <strong>Respostas</strong>
              </li>
              <li>
                Clique em <strong>Exportar</strong> → <strong>Download CSV</strong>
              </li>
              <li>Faça upload do arquivo baixado aqui</li>
            </ol>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-5">
          {/* File info */}
          <div className="flex items-center gap-3 bg-surface-hover rounded-xl p-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center text-green-600">
              <FileSpreadsheet size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{file?.name}</p>
              <p className="text-xs text-muted">
                {preview.totalRows} respostas · {preview.questionHeaders.length} perguntas
                {preview.tagsFound.length > 0 && ` · ${preview.tagsFound.length} tags`}
              </p>
            </div>
            <button
              onClick={reset}
              className="p-1.5 rounded-lg hover:bg-white text-muted hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Título do formulário */}
          <Input
            label="Nome do formulário"
            placeholder="Ex: Pesquisa de Satisfação"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
          />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-hover rounded-xl p-3 text-center">
              <FileText size={18} className="mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-foreground">{preview.questionHeaders.length}</p>
              <p className="text-xs text-muted">Perguntas</p>
            </div>
            <div className="bg-surface-hover rounded-xl p-3 text-center">
              <Users size={18} className="mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold text-foreground">{preview.totalRows}</p>
              <p className="text-xs text-muted">Respostas</p>
            </div>
            <div className="bg-surface-hover rounded-xl p-3 text-center">
              <Tag size={18} className="mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold text-foreground">{preview.tagsFound.length}</p>
              <p className="text-xs text-muted">Tags</p>
            </div>
          </div>

          {/* Preview das perguntas detectadas */}
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Perguntas detectadas
            </p>
            <div className="bg-white border border-border rounded-xl max-h-40 overflow-y-auto">
              {preview.questionHeaders.map((header, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-foreground truncate">{header}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags encontradas */}
          {preview.tagsFound.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                Tags encontradas
              </p>
              <div className="flex flex-wrap gap-2">
                {preview.tagsFound.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview de dados */}
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Preview das respostas (primeiras {Math.min(5, preview.rows.length)})
            </p>
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-hover">
                      {preview.questionHeaders.slice(0, 5).map((h, i) => (
                        <th
                          key={i}
                          className="text-left px-3 py-2 text-muted font-medium whitespace-nowrap border-r border-border last:border-r-0"
                        >
                          {h.length > 25 ? h.substring(0, 25) + '...' : h}
                        </th>
                      ))}
                      {preview.questionHeaders.length > 5 && (
                        <th className="text-left px-3 py-2 text-muted font-medium">
                          +{preview.questionHeaders.length - 5} mais
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, ri) => (
                      <tr key={ri} className="border-t border-border">
                        {preview.questionHeaders.slice(0, 5).map((h, ci) => (
                          <td
                            key={ci}
                            className="px-3 py-2 text-foreground whitespace-nowrap max-w-[200px] truncate border-r border-border last:border-r-0"
                          >
                            {row[h] || <span className="text-muted italic">—</span>}
                          </td>
                        ))}
                        {preview.questionHeaders.length > 5 && (
                          <td className="px-3 py-2 text-muted">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-2">
            <Button variant="secondary" onClick={reset}>
              Voltar
            </Button>
            <Button onClick={handleImport} disabled={!formTitle.trim()}>
              Importar {preview.totalRows} respostas <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <div className="py-10 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Importando dados...</p>
            <p className="text-sm text-muted mt-1">
              Criando formulário, campos e {preview?.totalRows || 0} respostas
            </p>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && result && (
        <div className="py-6 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>

          <div>
            <p className="text-base font-semibold text-foreground">Importação concluída!</p>
            <p className="text-sm text-muted mt-1">Seus dados do Typeform foram importados com sucesso</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            <div className="bg-surface-hover rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{result.fieldsCreated}</p>
              <p className="text-xs text-muted">Campos</p>
            </div>
            <div className="bg-surface-hover rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{result.responsesImported}</p>
              <p className="text-xs text-muted">Respostas</p>
            </div>
            <div className="bg-surface-hover rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{result.tagsCreated}</p>
              <p className="text-xs text-muted">Tags</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={handleClose}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                handleClose();
                router.push(`/forms/${result.formId}/responses`);
              }}
            >
              Ver respostas <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
