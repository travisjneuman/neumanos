/**
 * Quiz Settings Editor Component
 * Configure correct answers, points, and feedback for quiz mode
 */

import type { FormField, QuizSettings } from '../../types/forms';

interface QuizSettingsEditorProps {
  field: FormField;
  onSettingsChange: (settings: QuizSettings | undefined) => void;
}

export function QuizSettingsEditor({ field, onSettingsChange }: QuizSettingsEditorProps) {
  const quizSettings = field.quizSettings;

  const handleChange = (updates: Partial<QuizSettings>) => {
    if (!quizSettings) {
      // Initialize quiz settings
      onSettingsChange({
        correctAnswer: '',
        points: 1,
        ...updates,
      });
    } else {
      onSettingsChange({
        ...quizSettings,
        ...updates,
      });
    }
  };

  const handleRemove = () => {
    onSettingsChange(undefined);
  };

  // Don't show quiz settings for certain field types
  if (field.type === 'calculation' || field.type === 'hidden' || field.type === 'file') {
    return null;
  }

  return (
    <div className="space-y-4 p-4 border border-border-light dark:border-border-dark rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
          Quiz Settings
        </h4>
        {quizSettings && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-accent-red hover:underline"
          >
            Remove Quiz Settings
          </button>
        )}
      </div>

      {!quizSettings ? (
        <button
          type="button"
          onClick={() => handleChange({})}
          className="w-full px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90"
        >
          Enable Quiz Mode for This Field
        </button>
      ) : (
        <>
          {/* Correct Answer */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              Correct Answer *
            </label>

            {/* Text-based fields */}
            {(field.type === 'text' || field.type === 'textarea' || field.type === 'number') && (
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={String(quizSettings.correctAnswer || '')}
                onChange={(e) => handleChange({ correctAnswer: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                placeholder="Enter the correct answer"
                className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                required
              />
            )}

            {/* Select/Radio fields */}
            {(field.type === 'select' || field.type === 'radio') && (
              <select
                value={String(quizSettings.correctAnswer || '')}
                onChange={(e) => handleChange({ correctAnswer: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                required
              >
                <option value="">Select correct answer</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {/* Multiselect */}
            {field.type === 'multiselect' && (
              <div className="space-y-2">
                {field.options?.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Array.isArray(quizSettings.correctAnswer) && quizSettings.correctAnswer.includes(option)}
                      onChange={(e) => {
                        const currentAnswers = Array.isArray(quizSettings.correctAnswer) ? quizSettings.correctAnswer : [];
                        const newAnswers = e.target.checked
                          ? [...currentAnswers, option]
                          : currentAnswers.filter((a) => a !== option);
                        handleChange({ correctAnswer: newAnswers });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Checkbox */}
            {field.type === 'checkbox' && (
              <select
                value={String(quizSettings.correctAnswer || 'false')}
                onChange={(e) => handleChange({ correctAnswer: e.target.value === 'true' })}
                className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="true">Checked (true)</option>
                <option value="false">Unchecked (false)</option>
              </select>
            )}

            {/* Rating/Scale */}
            {(field.type === 'rating' || field.type === 'scale') && (
              <input
                type="number"
                value={Number(quizSettings.correctAnswer || 1)}
                onChange={(e) => handleChange({ correctAnswer: Number(e.target.value) })}
                min={1}
                max={field.type === 'rating' ? 5 : 10}
                placeholder={`Enter correct ${field.type} (${field.type === 'rating' ? '1-5' : '1-10'})`}
                className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                required
              />
            )}

            {/* Date/Time fields */}
            {field.type === 'date' && (
              <input
                type="date"
                value={String(quizSettings.correctAnswer || '')}
                onChange={(e) => handleChange({ correctAnswer: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                required
              />
            )}

            {field.type === 'time' && (
              <input
                type="time"
                value={String(quizSettings.correctAnswer || '')}
                onChange={(e) => handleChange({ correctAnswer: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                required
              />
            )}
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              Points *
            </label>
            <input
              type="number"
              value={quizSettings.points || 1}
              onChange={(e) => handleChange({ points: Number(e.target.value) || 1 })}
              min={1}
              placeholder="Points for this question"
              className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
              required
            />
          </div>

          {/* Feedback (Optional) */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              Feedback Message (Optional)
            </label>
            <textarea
              value={quizSettings.feedback || ''}
              onChange={(e) => handleChange({ feedback: e.target.value })}
              placeholder="Optional feedback shown after submission (e.g., 'The capital of France is Paris!')"
              rows={2}
              className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>
        </>
      )}
    </div>
  );
}
