/**
 * RiskMatrixPanel
 *
 * 5x5 probability/impact risk matrix grid with:
 * - Color-coded cells (green/yellow/orange/red)
 * - Risk items rendered as dots in their grid position
 * - Click to view/edit details via RiskDetailPanel
 * - Summary stats and category filter
 * - Add new risks
 */

import { useState, useMemo } from 'react';
import { Plus, AlertTriangle, Shield, Filter } from 'lucide-react';
import { useRiskStore } from '../../stores/useRiskStore';
import { RiskDetailPanel } from './RiskDetailPanel';
import type { RiskFormData } from './RiskDetailPanel';
import type { Risk, RiskCategory } from '../../types';

const PROBABILITY_LABELS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Certain'];
const IMPACT_LABELS = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

const CATEGORIES: { value: RiskCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'technical', label: 'Technical' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'budget', label: 'Budget' },
  { value: 'resource', label: 'Resource' },
  { value: 'external', label: 'External' },
];

const CATEGORY_COLORS: Record<RiskCategory, string> = {
  technical: 'bg-blue-500',
  schedule: 'bg-purple-500',
  budget: 'bg-amber-500',
  resource: 'bg-emerald-500',
  external: 'bg-rose-500',
};

function getCellColor(probability: number, impact: number): string {
  const score = probability * impact;
  if (score >= 15) return 'bg-status-error/20 hover:bg-status-error/30';
  if (score >= 10) return 'bg-orange-500/20 hover:bg-orange-500/30';
  if (score >= 5) return 'bg-status-warning/20 hover:bg-status-warning/30';
  return 'bg-status-success/20 hover:bg-status-success/30';
}

export function RiskMatrixPanel() {
  const { risks, addRisk, updateRisk, deleteRisk } = useRiskStore();
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<RiskCategory | 'all'>('all');

  const filteredRisks = useMemo(() => {
    if (categoryFilter === 'all') return risks;
    return risks.filter((r) => r.category === categoryFilter);
  }, [risks, categoryFilter]);

  // Summary stats
  const stats = useMemo(() => {
    const high = filteredRisks.filter((r) => r.score >= 15).length;
    const medium = filteredRisks.filter((r) => r.score >= 8 && r.score < 15).length;
    const low = filteredRisks.filter((r) => r.score < 8).length;
    return { total: filteredRisks.length, high, medium, low };
  }, [filteredRisks]);

  // Group risks by grid position
  const riskGrid = useMemo(() => {
    const grid: Record<string, Risk[]> = {};
    for (const risk of filteredRisks) {
      const key = `${risk.probability}-${risk.impact}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(risk);
    }
    return grid;
  }, [filteredRisks]);

  function handleOpenNew() {
    setSelectedRisk(null);
    setIsDetailOpen(true);
  }

  function handleSelectRisk(risk: Risk) {
    setSelectedRisk(risk);
    setIsDetailOpen(true);
  }

  function handleSave(data: RiskFormData) {
    if (selectedRisk) {
      updateRisk(selectedRisk.id, data);
    } else {
      addRisk(data);
    }
    setIsDetailOpen(false);
    setSelectedRisk(null);
  }

  function handleDelete(id: string) {
    deleteRisk(id);
    setIsDetailOpen(false);
    setSelectedRisk(null);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            Risk Matrix
          </h2>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary text-white rounded-button text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Risk
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark text-center">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">Total</p>
          <p className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
            {stats.total}
          </p>
        </div>
        <div className="p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark text-center">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">High</p>
          <p className="text-xl font-bold text-status-error">{stats.high}</p>
        </div>
        <div className="p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark text-center">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">Medium</p>
          <p className="text-xl font-bold text-status-warning">{stats.medium}</p>
        </div>
        <div className="p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark text-center">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">Low</p>
          <p className="text-xl font-bold text-status-success">{stats.low}</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                categoryFilter === cat.value
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-secondary dark:hover:bg-surface-dark-secondary border border-border-light dark:border-border-dark'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5x5 Matrix Grid */}
      <div className="bento-card p-4">
        <div className="flex">
          {/* Y-axis label */}
          <div className="flex flex-col items-center justify-center mr-2">
            <span
              className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary"
              style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
            >
              Probability
            </span>
          </div>

          <div className="flex-1">
            {/* Grid rows (probability 5 at top, 1 at bottom) */}
            <div className="grid grid-rows-5 gap-1">
              {[5, 4, 3, 2, 1].map((prob) => (
                <div key={prob} className="flex items-center gap-1">
                  {/* Row label */}
                  <span className="w-16 text-xs text-right pr-2 text-text-light-tertiary dark:text-text-dark-tertiary shrink-0">
                    {PROBABILITY_LABELS[prob - 1]}
                  </span>

                  {/* Cells */}
                  <div className="flex-1 grid grid-cols-5 gap-1">
                    {[1, 2, 3, 4, 5].map((imp) => {
                      const cellRisks = riskGrid[`${prob}-${imp}`] || [];
                      return (
                        <div
                          key={`${prob}-${imp}`}
                          className={`relative min-h-[3rem] rounded-md border border-border-light/50 dark:border-border-dark/50 transition-colors ${getCellColor(prob, imp)} flex flex-wrap items-center justify-center gap-1 p-1`}
                        >
                          {cellRisks.map((risk) => (
                            <button
                              key={risk.id}
                              onClick={() => handleSelectRisk(risk)}
                              className={`w-5 h-5 rounded-full ${CATEGORY_COLORS[risk.category]} border-2 border-white/50 dark:border-black/30 shadow-sm hover:scale-125 transition-transform cursor-pointer`}
                              title={risk.title}
                            />
                          ))}
                          {cellRisks.length === 0 && (
                            <span className="text-[10px] text-text-light-tertiary/50 dark:text-text-dark-tertiary/50">
                              {prob * imp}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* X-axis labels */}
            <div className="flex items-center gap-1 mt-1">
              <div className="w-16 shrink-0" />
              <div className="flex-1 grid grid-cols-5 gap-1">
                {IMPACT_LABELS.map((label) => (
                  <span
                    key={label}
                    className="text-xs text-center text-text-light-tertiary dark:text-text-dark-tertiary"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-center text-text-light-secondary dark:text-text-dark-secondary mt-1">
              Impact
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border-light dark:border-border-dark flex-wrap">
          <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            Categories:
          </span>
          {(Object.entries(CATEGORY_COLORS) as [RiskCategory, string][]).map(
            ([cat, color]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary capitalize">
                  {cat}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Risk List */}
      {filteredRisks.length > 0 && (
        <div className="bento-card p-4">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Risk Register ({filteredRisks.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredRisks
              .sort((a, b) => b.score - a.score)
              .map((risk) => (
                <button
                  key={risk.id}
                  onClick={() => handleSelectRisk(risk)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-surface-light dark:bg-surface-dark hover:bg-surface-light-secondary dark:hover:bg-surface-dark-secondary transition-colors text-left"
                >
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 ${CATEGORY_COLORS[risk.category]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                      {risk.title}
                    </p>
                    <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                      {risk.category} · {risk.status}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold shrink-0 ${
                      risk.score >= 15
                        ? 'text-status-error'
                        : risk.score >= 8
                          ? 'text-status-warning'
                          : 'text-status-success'
                    }`}
                  >
                    {risk.score}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Detail Panel */}
      <RiskDetailPanel
        risk={selectedRisk}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRisk(null);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default RiskMatrixPanel;
