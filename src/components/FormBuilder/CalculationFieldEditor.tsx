/**
 * Calculation Field Editor Component
 * Configuration UI for calculated fields in forms with expression builder and field reference autocomplete
 */

import { useState, useRef, useEffect } from 'react';
import { Calculator, AlertCircle, CheckCircle } from 'lucide-react';
import type { FormField, CalculationSettings } from '../../types/forms';
import { evaluateFormula, extractFieldReferences, detectCircularReferences } from '../../utils/formulaEngine';

interface CalculationFieldEditorProps {
  field: FormField;
  allFields: FormField[];
  onSettingsChange: (settings: CalculationSettings) => void;
  className?: string;
}

export function CalculationFieldEditor({
  field,
  allFields,
  onSettingsChange,
  className = '',
}: CalculationFieldEditorProps) {
  const [settings, setSettings] = useState<CalculationSettings>(
    field.calculationSettings || {
      formula: '',
      referencedFields: [],
      decimalPlaces: 2,
      prefix: '',
      suffix: '',
    }
  );
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fieldPickerRef = useRef<HTMLDivElement>(null);

  // Extract referenced fields from formula
  const referencedFields = extractFieldReferences(settings.formula);

  // Detect circular references
  const hasCircularRef = detectCircularReferences(
    field.id,
    referencedFields,
    allFields.map((f) => ({
      id: f.id,
      referencedFields: f.calculationSettings?.referencedFields || [],
    }))
  );

  // Create preview values (use sample data for demonstration)
  const previewValues = allFields.reduce((acc, f) => {
    if (f.type === 'number' || f.type === 'rating' || f.type === 'scale') {
      acc[f.id] = 10; // Sample number
    } else if (f.type === 'date') {
      acc[f.id] = new Date().toISOString().split('T')[0];
    } else {
      acc[f.id] = 'Sample';
    }
    return acc;
  }, {} as Record<string, any>);

  // Evaluate formula for preview
  const evaluation = evaluateFormula(settings.formula, previewValues);

  // Close field picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        fieldPickerRef.current &&
        !fieldPickerRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowFieldPicker(false);
      }
    }

    if (showFieldPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFieldPicker]);

  const handleSettingsChange = (updates: Partial<CalculationSettings>) => {
    const newSettings = { ...settings, ...updates };

    // Update referenced fields when formula changes
    if (updates.formula !== undefined) {
      newSettings.referencedFields = extractFieldReferences(updates.formula);
    }

    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleInsertField = (insertField: FormField) => {
    const before = settings.formula.slice(0, cursorPosition);
    const after = settings.formula.slice(cursorPosition);
    const fieldRef = `{${insertField.id}}`;
    const newFormula = before + fieldRef + after;

    handleSettingsChange({ formula: newFormula });
    setShowFieldPicker(false);

    // Move cursor after inserted field
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = cursorPosition + fieldRef.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '{') {
      // Show field picker when typing '{'
      setCursorPosition(e.currentTarget.selectionStart + 1);
      setShowFieldPicker(true);
    } else if (e.key === 'Escape') {
      setShowFieldPicker(false);
    }
  };

  // Filter fields that can be referenced (exclude calculation fields and current field)
  const availableFields = allFields.filter((f) => {
    // Exclude current field
    if (f.id === field.id) return false;

    // Exclude calculation fields to prevent circular refs
    if (f.type === 'calculation') return false;

    // Only include fields before this one (respects order)
    if (f.order >= field.order) return false;

    return true;
  });

  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-3">
        Calculation Settings
      </h4>

      {/* Formula Expression Input */}
      <div className="relative mb-4">
        <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
          Formula Expression
        </label>

        <textarea
          ref={textareaRef}
          value={settings.formula}
          onChange={(e) => handleSettingsChange({ formula: e.target.value })}
          onKeyDown={handleKeyDown}
          onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
          placeholder="e.g., {quantity} * {price} or SUM({field1}, {field2})"
          rows={4}
          className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
          aria-label="Formula expression"
        />

        {/* Field Picker Dropdown */}
        {showFieldPicker && (
          <div
            ref={fieldPickerRef}
            className="absolute z-10 w-full mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {availableFields.length > 0 ? (
              <ul className="py-1">
                {availableFields.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => handleInsertField(f)}
                      className="w-full px-3 py-2 text-left hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-text-light-primary dark:text-text-dark-primary"
                    >
                      <div className="font-medium">{f.label}</div>
                      <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        {f.type} field
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-3 py-4 text-center text-text-light-secondary dark:text-text-dark-secondary text-sm">
                No fields available to reference
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="mb-4 text-xs text-text-light-secondary dark:text-text-dark-secondary space-y-1">
        <p>
          Type{' '}
          <code className="px-1 py-0.5 bg-surface-hover-light dark:bg-surface-hover-dark rounded font-mono">
            {'{'}
          </code>{' '}
          to insert a field reference
        </p>
        <p>Supported: +, -, *, /, SUM(), AVERAGE(), MIN(), MAX(), ROUND(), IF()</p>
      </div>

      {/* Formatting Options */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Decimal Places */}
        <div>
          <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
            Decimal Places
          </label>
          <input
            type="number"
            value={settings.decimalPlaces ?? 2}
            onChange={(e) => handleSettingsChange({ decimalPlaces: Number(e.target.value) })}
            min={0}
            max={10}
            className="w-full px-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        {/* Prefix */}
        <div>
          <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
            Prefix
          </label>
          <input
            type="text"
            value={settings.prefix ?? ''}
            onChange={(e) => handleSettingsChange({ prefix: e.target.value })}
            placeholder="e.g., $"
            maxLength={5}
            className="w-full px-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        {/* Suffix */}
        <div>
          <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
            Suffix
          </label>
          <input
            type="text"
            value={settings.suffix ?? ''}
            onChange={(e) => handleSettingsChange({ suffix: e.target.value })}
            placeholder="e.g., %"
            maxLength={5}
            className="w-full px-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>
      </div>

      {/* Circular Reference Warning */}
      {hasCircularRef && (
        <div className="mb-4 p-3 bg-status-error/10 dark:bg-status-error/20 border border-status-error rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-status-error-text dark:text-status-error-text-dark shrink-0 mt-0.5" />
          <div className="text-sm text-status-error-text dark:text-status-error-text-dark">
            <strong>Circular Reference Detected:</strong> This formula references fields that create a
            circular dependency.
          </div>
        </div>
      )}

      {/* Preview */}
      {!hasCircularRef && settings.formula && (
        <div className="p-3 bg-surface-hover-light dark:bg-surface-hover-dark rounded-lg border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
            <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary uppercase">
              Preview
            </span>
          </div>

          {evaluation.error ? (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-status-error-text dark:text-status-error-text-dark shrink-0 mt-0.5" />
              <div className="text-sm text-status-error-text dark:text-status-error-text-dark">
                {evaluation.error}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
              <div>
                <div className="text-sm text-text-light-primary dark:text-text-dark-primary font-medium">
                  {formatCalculatedValue(
                    evaluation.value,
                    settings.decimalPlaces,
                    settings.prefix,
                    settings.suffix
                  )}
                </div>
                <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  Result type: {typeof evaluation.value}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Referenced Fields */}
      {referencedFields.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
            Referenced Fields:
          </div>
          <div className="flex flex-wrap gap-1">
            {referencedFields.map((fieldId) => {
              const refField = allFields.find((f) => f.id === fieldId);
              return (
                <span
                  key={fieldId}
                  className="inline-flex items-center px-2 py-0.5 bg-accent-primary/10 dark:bg-accent-primary/20 text-accent-primary rounded text-xs"
                >
                  {refField ? refField.label : `Unknown (${fieldId})`}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Format calculated value for display
 */
function formatCalculatedValue(
  value: any,
  decimalPlaces?: number,
  prefix?: string,
  suffix?: string
): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    const decimals = decimalPlaces ?? 2;
    const formatted = value % 1 === 0 ? String(value) : value.toFixed(decimals);
    return `${prefix || ''}${formatted}${suffix || ''}`;
  }

  return String(value);
}
