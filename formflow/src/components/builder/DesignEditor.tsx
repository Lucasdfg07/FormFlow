'use client';

import { useBuilderStore } from '@/stores/builder-store';
import { FONT_OPTIONS, THEME_PRESETS, DEFAULT_THEME, FormTheme } from '@/types';
import { Palette, Type, RectangleHorizontal, RotateCcw, ChevronDown } from 'lucide-react';

const FONT_SIZES: { value: FormTheme['fontSize']; label: string }[] = [
  { value: 'small', label: 'Pequeno' },
  { value: 'medium', label: 'Medio' },
  { value: 'large', label: 'Grande' },
];

const ROUNDNESS_OPTIONS: { value: FormTheme['roundness']; label: string; preview: string }[] = [
  { value: 'none', label: 'Nenhum', preview: 'rounded-none' },
  { value: 'small', label: 'Pequeno', preview: 'rounded' },
  { value: 'medium', label: 'Medio', preview: 'rounded-lg' },
  { value: 'large', label: 'Grande', preview: 'rounded-2xl' },
];

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 bg-white border border-border rounded-md text-xs text-foreground text-center font-mono hover:border-border-hover focus:border-foreground transition-all"
        />
        <label className="relative cursor-pointer">
          <div
            className="w-8 h-8 rounded-lg border border-border shadow-sm cursor-pointer hover:scale-105 transition-transform"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>
    </div>
  );
}

export default function DesignEditor() {
  const theme = useBuilderStore((s) => s.theme);
  const updateTheme = useBuilderStore((s) => s.updateTheme);

  const handleReset = () => {
    updateTheme({ ...DEFAULT_THEME });
  };

  const applyPreset = (preset: Partial<FormTheme>) => {
    updateTheme(preset);
  };

  return (
    <div className="w-72 bg-white border-l border-border h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <span className="text-[11px] text-muted uppercase font-medium tracking-wider">Design</span>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
          title="Resetar para padrao"
        >
          <RotateCcw size={12} />
          Resetar
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Presets */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Palette size={14} className="text-muted" />
            <span className="text-xs font-medium text-foreground">Temas prontos</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset.theme)}
                className="group flex flex-col items-center gap-1"
                title={preset.name}
              >
                <div
                  className="w-full aspect-square rounded-lg border border-border group-hover:scale-105 group-hover:shadow-md transition-all flex items-center justify-center"
                  style={{ backgroundColor: preset.theme.backgroundColor }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: preset.theme.buttonColor }}
                  />
                </div>
                <span className="text-[10px] text-muted group-hover:text-foreground transition-colors">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <hr className="border-border" />

        {/* Colors */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Palette size={14} className="text-muted" />
            <span className="text-xs font-medium text-foreground">Cores</span>
          </div>
          <div className="space-y-3">
            <ColorInput
              label="Fundo"
              value={theme.backgroundColor}
              onChange={(v) => updateTheme({ backgroundColor: v })}
            />
            <ColorInput
              label="Perguntas"
              value={theme.questionColor}
              onChange={(v) => updateTheme({ questionColor: v })}
            />
            <ColorInput
              label="Respostas"
              value={theme.answerColor}
              onChange={(v) => updateTheme({ answerColor: v })}
            />
            <ColorInput
              label="Botao"
              value={theme.buttonColor}
              onChange={(v) => updateTheme({ buttonColor: v })}
            />
            <ColorInput
              label="Texto botao"
              value={theme.buttonTextColor}
              onChange={(v) => updateTheme({ buttonTextColor: v })}
            />
          </div>
        </div>

        <hr className="border-border" />

        {/* Typography */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Type size={14} className="text-muted" />
            <span className="text-xs font-medium text-foreground">Tipografia</span>
          </div>
          <div className="space-y-3">
            {/* Font Family */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Fonte</label>
              <div className="relative">
                <select
                  value={theme.fontFamily}
                  onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground appearance-none cursor-pointer hover:border-border-hover transition-all"
                  style={{ fontFamily: theme.fontFamily }}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Tamanho da fonte</label>
              <div className="flex gap-1">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => updateTheme({ fontSize: size.value })}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                      theme.fontSize === size.value
                        ? 'bg-foreground text-white'
                        : 'bg-white border border-border text-muted-foreground hover:border-border-hover hover:text-foreground'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Roundness */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <RectangleHorizontal size={14} className="text-muted" />
            <span className="text-xs font-medium text-foreground">Arredondamento</span>
          </div>
          <div className="flex gap-1">
            {ROUNDNESS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateTheme({ roundness: opt.value })}
                className={`flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-md transition-all ${
                  theme.roundness === opt.value
                    ? 'bg-foreground text-white'
                    : 'bg-white border border-border text-muted-foreground hover:border-border-hover hover:text-foreground'
                }`}
              >
                <div
                  className={`w-6 h-4 border-2 ${opt.preview} ${
                    theme.roundness === opt.value ? 'border-white' : 'border-current'
                  }`}
                />
                <span className="text-[10px]">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <hr className="border-border" />

        {/* Background Image URL */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Imagem de fundo (URL)</label>
          <input
            type="text"
            placeholder="https://..."
            value={theme.backgroundImage || ''}
            onChange={(e) => updateTheme({ backgroundImage: e.target.value || undefined })}
            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-foreground placeholder-muted hover:border-border-hover focus:border-foreground transition-all"
          />
          {theme.backgroundImage && (
            <div className="mt-2 relative rounded-lg overflow-hidden border border-border">
              <img
                src={theme.backgroundImage}
                alt="Background preview"
                className="w-full h-20 object-cover"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <button
                onClick={() => updateTheme({ backgroundImage: undefined })}
                className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/70"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
