/**
 * Quiz Results Component
 * Displays quiz score, percentage, and per-question feedback
 */

import type { FormTemplate, FormResponse } from '../../types/forms';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizResultsProps {
  form: FormTemplate;
  response: FormResponse;
  showCorrectAnswers?: boolean;
  onRetake?: () => void;
  onClose?: () => void;
}

export function QuizResults({
  form,
  response,
  showCorrectAnswers = false,
  onRetake,
  onClose,
}: QuizResultsProps) {
  const score = response.score ?? 0;
  const maxScore = response.maxScore ?? 0;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  // Determine pass/fail (70% threshold)
  const passed = percentage >= 70;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-surface-light dark:bg-surface-dark">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
          Quiz Results
        </h1>
        <p className="text-text-light-secondary dark:text-text-dark-secondary">
          {form.title}
        </p>
      </div>

      {/* Score Card */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-8 text-center mb-8">
        <div className="text-6xl font-bold mb-4">
          <span
            className={
              passed
                ? 'text-accent-green'
                : 'text-accent-red'
            }
          >
            {percentage}%
          </span>
        </div>
        <div className="text-xl text-text-light-secondary dark:text-text-dark-secondary mb-4">
          {score} out of {maxScore} points
        </div>
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
            passed
              ? 'bg-accent-green/10 text-accent-green'
              : 'bg-accent-red/10 text-accent-red'
          }`}
        >
          {passed ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Passed!</span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Not Passed</span>
            </>
          )}
        </div>
      </div>

      {/* Per-Question Breakdown */}
      {showCorrectAnswers && (
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
            Question Breakdown
          </h2>
          {form.fields.map((field) => {
            // Skip fields without quiz settings
            if (!field.quizSettings) {
              return null;
            }

            const userAnswer = response.answers[field.id];
            const { correctAnswer, points, feedback } = field.quizSettings;

            // Check if answer is correct
            const isCorrect = checkAnswerMatch(userAnswer, correctAnswer);

            return (
              <div
                key={field.id}
                className={`p-4 border rounded-lg ${
                  isCorrect
                    ? 'border-accent-green/30 bg-accent-green/5'
                    : 'border-accent-red/30 bg-accent-red/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-accent-green" />
                    ) : (
                      <XCircle className="w-5 h-5 text-accent-red" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-text-light-primary dark:text-text-dark-primary">
                        {field.label}
                      </h3>
                      <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                        {isCorrect ? points : 0} / {points} points
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-text-light-secondary dark:text-text-dark-secondary">
                          Your answer:{' '}
                        </span>
                        <span className="text-text-light-primary dark:text-text-dark-primary font-medium">
                          {formatAnswer(userAnswer)}
                        </span>
                      </div>

                      {!isCorrect && (
                        <div>
                          <span className="text-text-light-secondary dark:text-text-dark-secondary">
                            Correct answer:{' '}
                          </span>
                          <span className="text-accent-green font-medium">
                            {formatAnswer(correctAnswer)}
                          </span>
                        </div>
                      )}

                      {feedback && (
                        <div className="mt-2 p-2 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded text-text-light-secondary dark:text-text-dark-secondary">
                          {feedback}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {onRetake && (
          <button
            onClick={onRetake}
            className="px-6 py-3 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Retake Quiz
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-3 bg-surface-hover-light dark:bg-surface-hover-dark rounded-lg hover:bg-border-light dark:hover:bg-border-dark transition-colors font-medium"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Check if user answer matches correct answer
 */
function checkAnswerMatch(userAnswer: any, correctAnswer: unknown): boolean {
  // Handle missing answers
  if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
    return false;
  }

  // Handle arrays (multiselect)
  if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
    if (userAnswer.length !== correctAnswer.length) {
      return false;
    }
    const sortedUser = [...userAnswer].sort();
    const sortedCorrect = [...correctAnswer].sort();
    return sortedUser.every((val, idx) => val === sortedCorrect[idx]);
  }

  // Handle booleans
  if (typeof userAnswer === 'boolean' || typeof correctAnswer === 'boolean') {
    return Boolean(userAnswer) === Boolean(correctAnswer);
  }

  // Handle numbers
  if (typeof userAnswer === 'number' || typeof correctAnswer === 'number') {
    return Number(userAnswer) === Number(correctAnswer);
  }

  // Handle strings (case-insensitive)
  return String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();
}

/**
 * Format answer for display
 */
function formatAnswer(answer: unknown): string {
  if (answer === undefined || answer === null || answer === '') {
    return '[not answered]';
  }

  if (Array.isArray(answer)) {
    return answer.join(', ');
  }

  if (typeof answer === 'boolean') {
    return answer ? 'Yes' : 'No';
  }

  return String(answer);
}
