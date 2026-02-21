/**
 * SpreadsheetToolbar Component
 *
 * Formatting toolbar for the spreadsheet editor.
 * Provides controls for text formatting, alignment, colors, and number formats.
 */

import { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Paintbrush,
  Type,
  DollarSign,
  Percent,
  Hash,
  BarChart2,
  Download,
  Upload,
  Grid3X3,
  Square,
  Minus,
  Rows3,
} from 'lucide-react';
import type { CellStyle, BorderStyle } from '../../types';

interface SpreadsheetToolbarProps {
  /** Current style of the selected cell */
  currentStyle: CellStyle;
  /** Called when format should be applied */
  onFormatChange: (format: Partial<CellStyle>) => void;
  /** Whether there is an active selection */
  hasSelection: boolean;
  /** Called when insert chart is clicked */
  onInsertChart?: () => void;
  /** Called when export is requested */
  onExport?: (format: 'xlsx' | 'csv') => void;
  /** Called when import is requested */
  onImport?: () => void;
  /** Current frozen rows count */
  frozenRows?: number;
  /** Current frozen cols count */
  frozenCols?: number;
  /** Called to toggle freeze panes at current selection */
  onToggleFreeze?: () => void;
}

// Preset colors for quick selection
const PRESET_COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#FFFFFF',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#FB7185',
];

// Number format presets
const NUMBER_FORMATS = [
  { id: 'general', label: 'General', format: undefined, icon: Hash },
  { id: 'currency', label: 'Currency', format: '$#,##0.00', icon: DollarSign },
  { id: 'percent', label: 'Percent', format: '0%', icon: Percent },
  { id: 'number', label: 'Number', format: '#,##0.00', icon: Hash },
];

// Border presets
const DEFAULT_BORDER: BorderStyle = { color: '#000000', style: 'thin' };

interface BorderPreset {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  apply: () => Partial<CellStyle>;
}

const BORDER_PRESETS: BorderPreset[] = [
  {
    id: 'all',
    label: 'All Borders',
    icon: Grid3X3,
    apply: () => ({
      borderTop: DEFAULT_BORDER,
      borderRight: DEFAULT_BORDER,
      borderBottom: DEFAULT_BORDER,
      borderLeft: DEFAULT_BORDER,
    }),
  },
  {
    id: 'outer',
    label: 'Outer Borders',
    icon: Square,
    apply: () => ({
      borderTop: DEFAULT_BORDER,
      borderRight: DEFAULT_BORDER,
      borderBottom: DEFAULT_BORDER,
      borderLeft: DEFAULT_BORDER,
    }),
  },
  {
    id: 'bottom',
    label: 'Bottom Border',
    icon: Minus,
    apply: () => ({
      borderTop: undefined,
      borderRight: undefined,
      borderBottom: DEFAULT_BORDER,
      borderLeft: undefined,
    }),
  },
  {
    id: 'none',
    label: 'No Borders',
    icon: Rows3,
    apply: () => ({
      borderTop: undefined,
      borderRight: undefined,
      borderBottom: undefined,
      borderLeft: undefined,
    }),
  },
];

export function SpreadsheetToolbar({
  currentStyle,
  onFormatChange,
  hasSelection,
  onInsertChart,
  onExport,
  onImport,
  frozenRows = 0,
  frozenCols = 0,
  onToggleFreeze,
}: SpreadsheetToolbarProps) {
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showBorderPicker, setShowBorderPicker] = useState(false);

  const toggleBold = () => onFormatChange({ bold: !currentStyle.bold });
  const toggleItalic = () => onFormatChange({ italic: !currentStyle.italic });
  const toggleUnderline = () => onFormatChange({ underline: !currentStyle.underline });

  const setAlignment = (alignment: 'left' | 'center' | 'right') =>
    onFormatChange({ alignment });

  const setTextColor = (color: string) => {
    onFormatChange({ textColor: color });
    setShowTextColorPicker(false);
  };

  const setBgColor = (color: string) => {
    onFormatChange({ backgroundColor: color });
    setShowBgColorPicker(false);
  };

  const setNumberFormat = (format?: string) => {
    onFormatChange({ numberFormat: format });
  };

  const buttonClass = (active?: boolean) =>
    `p-1.5 rounded transition-colors ${
      active
        ? 'bg-accent-primary/10 text-accent-primary'
        : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
    } ${!hasSelection ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex-wrap">
      {/* Text formatting */}
      <div className="flex items-center gap-0.5 border-r border-border-light dark:border-border-dark pr-2 mr-1">
        <button
          onClick={toggleBold}
          disabled={!hasSelection}
          className={buttonClass(currentStyle.bold)}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={toggleItalic}
          disabled={!hasSelection}
          className={buttonClass(currentStyle.italic)}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={toggleUnderline}
          disabled={!hasSelection}
          className={buttonClass(currentStyle.underline)}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-0.5 border-r border-border-light dark:border-border-dark pr-2 mr-1">
        <button
          onClick={() => setAlignment('left')}
          disabled={!hasSelection}
          className={buttonClass(currentStyle.alignment === 'left')}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setAlignment('center')}
          disabled={!hasSelection}
          className={buttonClass(currentStyle.alignment === 'center')}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => setAlignment('right')}
          disabled={!hasSelection}
          className={buttonClass(currentStyle.alignment === 'right')}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-0.5 border-r border-border-light dark:border-border-dark pr-2 mr-1">
        {/* Text color */}
        <div className="relative">
          <button
            onClick={() => setShowTextColorPicker(!showTextColorPicker)}
            disabled={!hasSelection}
            className={buttonClass()}
            title="Text Color"
          >
            <Type className="w-4 h-4" />
            <div
              className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full"
              style={{ backgroundColor: currentStyle.textColor || '#000000' }}
            />
          </button>
          {showTextColorPicker && hasSelection && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowTextColorPicker(false)}
              />
              <div className="absolute top-full left-0 mt-1 p-2 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg z-50 grid grid-cols-6 gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setTextColor(color)}
                    className="w-5 h-5 rounded border border-border-light dark:border-border-dark hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Background color */}
        <div className="relative">
          <button
            onClick={() => setShowBgColorPicker(!showBgColorPicker)}
            disabled={!hasSelection}
            className={buttonClass()}
            title="Fill Color"
          >
            <Paintbrush className="w-4 h-4" />
            <div
              className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full"
              style={{ backgroundColor: currentStyle.backgroundColor || 'transparent' }}
            />
          </button>
          {showBgColorPicker && hasSelection && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowBgColorPicker(false)}
              />
              <div className="absolute top-full left-0 mt-1 p-2 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg z-50 grid grid-cols-6 gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBgColor(color)}
                    className="w-5 h-5 rounded border border-border-light dark:border-border-dark hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Borders */}
      <div className="flex items-center gap-0.5 border-r border-border-light dark:border-border-dark pr-2 mr-1">
        <div className="relative">
          <button
            onClick={() => setShowBorderPicker(!showBorderPicker)}
            disabled={!hasSelection}
            className={buttonClass(!!currentStyle.borderTop || !!currentStyle.borderBottom)}
            title="Borders"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          {showBorderPicker && hasSelection && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowBorderPicker(false)}
              />
              <div className="absolute top-full left-0 mt-1 py-1 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg z-50 min-w-[140px]">
                {BORDER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onFormatChange(preset.apply());
                      setShowBorderPicker(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-alt dark:hover:bg-surface-dark transition-colors"
                  >
                    <preset.icon className="w-4 h-4" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Number formats */}
      <div className="flex items-center gap-0.5 border-r border-border-light dark:border-border-dark pr-2 mr-1">
        {NUMBER_FORMATS.map((format) => (
          <button
            key={format.id}
            onClick={() => setNumberFormat(format.format)}
            disabled={!hasSelection}
            className={buttonClass(currentStyle.numberFormat === format.format)}
            title={format.label}
          >
            <format.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Freeze Panes */}
      {onToggleFreeze && (
        <div className="flex items-center gap-0.5 border-r border-border-light dark:border-border-dark pr-2 mr-1">
          <button
            onClick={onToggleFreeze}
            disabled={!hasSelection}
            className={buttonClass(frozenRows > 0 || frozenCols > 0)}
            title={frozenRows > 0 || frozenCols > 0
              ? `Frozen: ${frozenRows} rows, ${frozenCols} cols (click to unfreeze)`
              : 'Freeze panes at selection'}
          >
            <Rows3 className="w-4 h-4" />
            {(frozenRows > 0 || frozenCols > 0) && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent-primary rounded-full" />
            )}
          </button>
        </div>
      )}

      {/* Insert Chart */}
      {onInsertChart && (
        <div className="flex items-center gap-0.5 border-r border-border-light dark:border-border-dark pr-2 mr-1">
          <button
            onClick={onInsertChart}
            className="p-1.5 rounded transition-colors text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated hover:text-accent-primary"
            title="Insert Chart"
          >
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Import/Export */}
      {(onExport || onImport) && (
        <div className="flex items-center gap-0.5">
          {onImport && (
            <button
              onClick={onImport}
              className="p-1.5 rounded transition-colors text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated hover:text-accent-primary"
              title="Import from file"
            >
              <Upload className="w-4 h-4" />
            </button>
          )}
          {onExport && (
            <>
              <button
                onClick={() => onExport('xlsx')}
                className="p-1.5 rounded transition-colors text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated hover:text-accent-primary"
                title="Export as XLSX"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
