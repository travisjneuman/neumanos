/**
 * Formula Field Editor Component
 *
 * Configuration UI for formula fields with expression builder and field reference autocomplete.
 * Shows live preview of computed value.
 */

import { useState, useRef, useEffect } from 'react';
import { Calculator, AlertCircle, CheckCircle } from 'lucide-react';
import type { FieldDefinition } from '../../types/customFields';
import { evaluateFormula, extractFieldReferences, detectCircularReferences } from '../../utils/formulaEngine';

interface FormulaFieldEditorProps {
  expression: string;
  onExpressionChange: (expression: string) => void;
  allFields: FieldDefinition[];
  currentFieldId?: string;
  previewValues?: Record<string, any>;
  className?: string;
}

export function FormulaFieldEditor({
  expression,
  onExpressionChange,
  allFields,
  currentFieldId,
  previewValues = {},
  className = '',
}: FormulaFieldEditorProps) {
  const [localExpression, setLocalExpression] = useState(expression);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fieldPickerRef = useRef<HTMLDivElement>(null);

  // Extract referenced fields
  const referencedFields = extractFieldReferences(localExpression);

  // Detect circular references
  const hasCircularRef = currentFieldId
    ? detectCircularReferences(
        currentFieldId,
        referencedFields,
        allFields.map((f) => ({ id: f.id, referencedFields: f.referencedFields }))
      )
    : false;

  // Evaluate formula for preview
  const evaluation = evaluateFormula(localExpression, previewValues);

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

  const handleExpressionChange = (newExpression: string) => {
    setLocalExpression(newExpression);
    onExpressionChange(newExpression);
  };

  const handleInsertField = (field: FieldDefinition) => {
    const before = localExpression.slice(0, cursorPosition);
    const after = localExpression.slice(cursorPosition);
    const fieldRef = `{${field.id}}`;
    const newExpression = before + fieldRef + after;

    handleExpressionChange(newExpression);
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

  // Filter fields that can be referenced (exclude formula fields that would create circular refs)
  const availableFields = allFields.filter((f) => {
    // Exclude current field
    if (currentFieldId && f.id === currentFieldId) return false;

    // Exclude formula fields for now (to prevent complex circular reference chains)
    if (f.type === 'formula') return false;

    return true;
  });

  return (
    <div className={className}>
      {/* Formula Expression Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
          Formula Expression
        </label>

        <textarea
          ref={textareaRef}
          value={localExpression}
          onChange={(e) => handleExpressionChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
          placeholder="e.g., {field1} + {field2} * 2 or IF({status} = 'Done', 100, 0)"
          rows={4}
          className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
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
                {availableFields.map((field) => (
                  <li key={field.id}>
                    <button
                      onClick={() => handleInsertField(field)}
                      className="w-full px-3 py-2 text-left hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-text-light-primary dark:text-text-dark-primary"
                    >
                      <div className="font-medium">{field.name}</div>
                      <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        {field.type} field
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
      <div className="mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary space-y-1">
        <p>Type <code className="px-1 py-0.5 bg-surface-hover-light dark:bg-surface-hover-dark rounded">{'{'}</code> to insert a field reference</p>
        <p>Supported: +, -, *, /, IF(), SUM(), AVERAGE(), COUNT(), DAYS_BETWEEN()</p>
      </div>

      {/* Circular Reference Warning */}
      {hasCircularRef && (
        <div className="mt-3 p-3 bg-status-error/10 dark:bg-status-error/20 border border-status-error rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-status-error-text dark:text-status-error-text-dark shrink-0 mt-0.5" />
          <div className="text-sm text-status-error-text dark:text-status-error-text-dark">
            <strong>Circular Reference Detected:</strong> This formula references fields that create a circular dependency.
          </div>
        </div>
      )}

      {/* Preview */}
      {!hasCircularRef && localExpression && (
        <div className="mt-3 p-3 bg-surface-hover-light dark:bg-surface-hover-dark rounded-lg border border-border-light dark:border-border-dark">
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
                  {formatPreviewValue(evaluation.value)}
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
              const field = allFields.find((f) => f.id === fieldId);
              return (
                <span
                  key={fieldId}
                  className="inline-flex items-center px-2 py-0.5 bg-accent-blue/10 dark:bg-accent-blue/20 text-accent-blue dark:text-accent-blue-hover rounded text-xs"
                >
                  {field ? field.name : `Unknown (${fieldId})`}
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
 * Format preview value for display
 */
function formatPreviewValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    // Format numbers with up to 2 decimal places
    return value % 1 === 0 ? String(value) : value.toFixed(2);
  }

  return String(value);
}
