/**
 * Form Preview Component
 * Interactive preview of form with conditional logic and calculated fields
 */

import { useState } from 'react';
import { Eye, RotateCcw } from 'lucide-react';
import type { FormTemplate } from '../../types/forms';
import { FormRenderer } from '../FormRenderer/FormRenderer';

interface FormPreviewProps {
  form: FormTemplate;
  onClose: () => void;
}

export function FormPreview({ form, onClose }: FormPreviewProps) {
  const [responses, setResponses] = useState<Record<string, any>[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSubmit = (answers: Record<string, any>, metadata?: any) => {
    // Add response to list
    setResponses([...responses, { answers, metadata, timestamp: new Date() }]);

    // Show success message
    setShowSuccessMessage(true);

    // Reset after 2 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 2000);
  };

  const handleReset = () => {
    setResponses([]);
    setShowSuccessMessage(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-accent-primary" />
            <div>
              <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                Form Preview
              </h2>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Test conditional logic and calculated fields
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-surface-hover-light dark:bg-surface-hover-dark rounded-lg hover:bg-border-light dark:hover:bg-border-dark transition-colors"
              aria-label="Reset preview"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-4 p-4 bg-accent-green/10 border border-accent-green rounded-lg">
              <p className="text-accent-green font-medium">
                ✓ Form submitted successfully! (Preview mode - not saved)
              </p>
            </div>
          )}

          {/* Form Info */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {form.title}
            </h3>
            {form.description && (
              <p className="text-text-light-secondary dark:text-text-dark-secondary mt-1">
                {form.description}
              </p>
            )}
          </div>

          {/* Form Renderer */}
          <FormRenderer form={form} onSubmit={handleSubmit} />

          {/* Response Log */}
          {responses.length > 0 && (
            <div className="mt-8 p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg">
              <h4 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-3">
                Preview Submissions ({responses.length})
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {responses.map((response, index) => (
                  <div
                    key={index}
                    className="p-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded text-xs"
                  >
                    <div className="text-text-light-tertiary dark:text-text-dark-tertiary mb-2">
                      Submission #{index + 1} -{' '}
                      {new Date(response.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(response.answers).map(([fieldId, value]) => {
                        const field = form.fields.find((f) => f.id === fieldId);
                        return (
                          <div key={fieldId}>
                            <span className="text-text-light-secondary dark:text-text-dark-secondary">
                              {field?.label || fieldId}:
                            </span>{' '}
                            <span className="text-text-light-primary dark:text-text-dark-primary font-medium">
                              {Array.isArray(value)
                                ? value.join(', ')
                                : typeof value === 'object'
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {response.metadata?.isSpam && (
                      <div className="mt-2 text-accent-red">⚠ Flagged as spam</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Help */}
        <div className="p-4 border-t border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated">
          <div className="flex items-start gap-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            <span className="font-medium">💡 Tip:</span>
            <div>
              <p>
                This is a live preview. Test conditional logic by changing field values and see
                which fields show/hide.
              </p>
              <p className="mt-1">
                Calculated fields update in real-time as you fill the form. Submissions are not
                saved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
