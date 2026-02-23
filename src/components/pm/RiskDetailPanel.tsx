/**
 * RiskDetailPanel
 *
 * Slide-over panel for viewing and editing individual risk items.
 * Supports create and edit modes with full form fields.
 */

import { useState, useEffect } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import type { Risk, RiskCategory, RiskStatus } from '../../types';

const CATEGORIES: { value: RiskCategory; label: string }[] = [
  { value: 'technical', label: 'Technical' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'budget', label: 'Budget' },
  { value: 'resource', label: 'Resource' },
  { value: 'external', label: 'External' },
];

const STATUSES: { value: RiskStatus; label: string }[] = [
  { value: 'identified', label: 'Identified' },
  { value: 'mitigating', label: 'Mitigating' },
  { value: 'closed', label: 'Closed' },
];

const PROBABILITY_LABELS = ['', 'Rare', 'Unlikely', 'Possible', 'Likely', 'Certain'];
const IMPACT_LABELS = ['', 'Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

interface RiskDetailPanelProps {
  risk: Risk | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RiskFormData) => void;
  onDelete?: (id: string) => void;
}

export interface RiskFormData {
  title: string;
  description: string;
  category: RiskCategory;
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  status: RiskStatus;
  mitigationPlan: string;
  owner: string;
  relatedTasks: string[];
}

const DEFAULT_FORM: RiskFormData = {
  title: '',
  description: '',
  category: 'technical',
  probability: 3,
  impact: 3,
  status: 'identified',
  mitigationPlan: '',
  owner: '',
  relatedTasks: [],
};

export function RiskDetailPanel({
  risk,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: RiskDetailPanelProps) {
  const [form, setForm] = useState<RiskFormData>(DEFAULT_FORM);

  useEffect(() => {
    if (risk) {
      setForm({
        title: risk.title,
        description: risk.description,
        category: risk.category,
        probability: risk.probability,
        impact: risk.impact,
        status: risk.status,
        mitigationPlan: risk.mitigationPlan,
        owner: risk.owner,
        relatedTasks: risk.relatedTasks,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [risk]);

  if (!isOpen) return null;

  const isEdit = !!risk;
  const score = form.probability * form.impact;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  }

  function getScoreColor(s: number): string {
    if (s >= 15) return 'text-status-error';
    if (s >= 8) return 'text-status-warning';
    return 'text-status-success';
  }

  const inputClass =
    'w-full px-3 py-2 text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-1 focus:ring-accent-primary';
  const labelClass =
    'block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-surface-light-elevated dark:bg-surface-dark-elevated border-l border-border-light dark:border-border-dark shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            {isEdit ? 'Edit Risk' : 'Add Risk'}
          </h2>
          <div className="flex items-center gap-2">
            {isEdit && onDelete && (
              <button
                onClick={() => onDelete(risk.id)}
                className="p-2 text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
                title="Delete risk"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-text-light-tertiary dark:text-text-dark-tertiary hover:bg-surface-light dark:hover:bg-surface-dark rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="Risk title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Describe the risk..."
            />
          </div>

          {/* Category + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as RiskCategory })
                }
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as RiskStatus })
                }
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Probability */}
          <div>
            <label className={labelClass}>
              Probability: {form.probability} - {PROBABILITY_LABELS[form.probability]}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={form.probability}
              onChange={(e) =>
                setForm({
                  ...form,
                  probability: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                })
              }
              className="w-full accent-accent-primary"
            />
            <div className="flex justify-between text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              <span>Rare</span>
              <span>Certain</span>
            </div>
          </div>

          {/* Impact */}
          <div>
            <label className={labelClass}>
              Impact: {form.impact} - {IMPACT_LABELS[form.impact]}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={form.impact}
              onChange={(e) =>
                setForm({
                  ...form,
                  impact: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                })
              }
              className="w-full accent-accent-primary"
            />
            <div className="flex justify-between text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              <span>Negligible</span>
              <span>Catastrophic</span>
            </div>
          </div>

          {/* Risk Score display */}
          <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-lg text-center">
            <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Risk Score
            </span>
            <p className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</p>
            <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              {score >= 15 ? 'High' : score >= 8 ? 'Medium' : 'Low'}
            </span>
          </div>

          {/* Mitigation Plan */}
          <div>
            <label className={labelClass}>Mitigation Strategy</label>
            <textarea
              value={form.mitigationPlan}
              onChange={(e) =>
                setForm({ ...form, mitigationPlan: e.target.value })
              }
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="How will this risk be mitigated?"
            />
          </div>

          {/* Owner */}
          <div>
            <label className={labelClass}>Owner</label>
            <input
              type="text"
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              className={inputClass}
              placeholder="Risk owner"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={handleSubmit as unknown as () => void}
            disabled={!form.title.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-button font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isEdit ? 'Update Risk' : 'Add Risk'}
          </button>
        </div>
      </div>
    </>
  );
}

export default RiskDetailPanel;
