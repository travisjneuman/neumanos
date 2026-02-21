/**
 * PresentationToolbar Component
 *
 * Toolbar for the presentation editor.
 * Provides tools for selecting, adding shapes, text, and images.
 */

import {
  MousePointer2,
  Type,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Image,
  ImagePlus,
  Play,
  Download,
  Plus,
  Trash2,
  Copy,
  Palette,
  Sparkles,
} from 'lucide-react';

export type PresentationTool = 'select' | 'text' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'image';

interface PresentationToolbarProps {
  currentTool: PresentationTool;
  onToolChange: (tool: PresentationTool) => void;
  onAddSlide: () => void;
  onDeleteSlide: () => void;
  onDuplicateSlide: () => void;
  onPresent: () => void;
  onExport: () => void;
  onTheme?: () => void;
  onAnimation?: () => void;
  onImageUpload: () => void;
  onBackgroundImage?: () => void;
  slideCount: number;
  canDeleteSlide: boolean;
}

const TOOLS: { id: PresentationTool; icon: typeof MousePointer2; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)' },
  { id: 'text', icon: Type, label: 'Text (T)' },
  { id: 'rectangle', icon: Square, label: 'Rectangle (R)' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse (E)' },
  { id: 'line', icon: Minus, label: 'Line (L)' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow (A)' },
];

export function PresentationToolbar({
  currentTool,
  onToolChange,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onPresent,
  onExport,
  onTheme,
  onAnimation,
  onImageUpload,
  onBackgroundImage,
  slideCount,
  canDeleteSlide,
}: PresentationToolbarProps) {
  const buttonClass = (active?: boolean) =>
    `p-1.5 rounded transition-colors ${
      active
        ? 'bg-accent-primary/10 text-accent-primary'
        : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
    }`;

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex-wrap">
      {/* Tools */}
      <div className="flex items-center gap-0.5 border-r border-border-light dark:border-border-dark pr-2 mr-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={buttonClass(currentTool === tool.id)}
            title={tool.label}
          >
            <tool.icon className="w-4 h-4" />
          </button>
        ))}
        <button
          onClick={onImageUpload}
          className={buttonClass(currentTool === 'image')}
          title="Insert Image (I)"
        >
          <Image className="w-4 h-4" />
        </button>
      </div>

      {/* Slide operations */}
      <div className="flex items-center gap-0.5 border-r border-border-light dark:border-border-dark pr-2 mr-1">
        <button
          onClick={onAddSlide}
          className="p-1.5 rounded transition-colors text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated hover:text-accent-primary"
          title="Add Slide"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onDuplicateSlide}
          className="p-1.5 rounded transition-colors text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated hover:text-accent-primary"
          title="Duplicate Slide"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={onDeleteSlide}
          disabled={!canDeleteSlide}
          className={`p-1.5 rounded transition-colors ${
            canDeleteSlide
              ? 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated hover:text-status-error'
              : 'text-text-light-tertiary dark:text-text-dark-tertiary opacity-50 cursor-not-allowed'
          }`}
          title="Delete Slide"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Theme, Background & Animation */}
      {(onTheme || onAnimation || onBackgroundImage) && (
        <div className="flex items-center gap-0.5 border-r border-border-light dark:border-border-dark pr-2 mr-1">
          {onTheme && (
            <button
              onClick={onTheme}
              className="p-1.5 rounded transition-colors text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated hover:text-accent-purple"
              title="Theme"
            >
              <Palette className="w-4 h-4" />
            </button>
          )}
          {onBackgroundImage && (
            <button
              onClick={onBackgroundImage}
              className="p-1.5 rounded transition-colors text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated hover:text-accent-primary"
              title="Set Background Image"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
          )}
          {onAnimation && (
            <button
              onClick={onAnimation}
              className="p-1.5 rounded transition-colors text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated hover:text-accent-yellow"
              title="Animations & Transitions"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Slide count */}
      <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mr-2">
        {slideCount} {slideCount === 1 ? 'slide' : 'slides'}
      </span>

      {/* Present and Export */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onPresent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors text-sm font-medium"
          title="Present (F5)"
        >
          <Play className="w-4 h-4" />
          Present
        </button>
        <button
          onClick={onExport}
          className="p-1.5 rounded transition-colors text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated hover:text-accent-primary"
          title="Export"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
