import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Risk, RiskState, RiskStatus, RiskCategory } from '../types';

interface RiskStore extends RiskState {
  // Actions
  addRisk: (risk: Omit<Risk, 'id' | 'createdDate' | 'lastReviewed' | 'score'>) => void;
  updateRisk: (id: string, updates: Partial<Risk>) => void;
  deleteRisk: (id: string) => void;
  updateRiskStatus: (id: string, status: RiskStatus) => void;
  linkTaskToRisk: (riskId: string, taskId: string) => void;
  unlinkTaskFromRisk: (riskId: string, taskId: string) => void;
  calculateRiskScore: (probability: number, impact: number) => number;
  getRisksByCategory: (category: RiskCategory) => Risk[];
  getHighRisks: () => Risk[]; // Score >= 15
  getProjectRiskScore: () => number; // Average of all risk scores
  clearAllRisks: () => void;
}

export const useRiskStore = create<RiskStore>()(
  persist(
    (set, get) => ({
      risks: [],

      addRisk: (risk) => {
        const score = get().calculateRiskScore(risk.probability, risk.impact);
        const newRisk: Risk = {
          ...risk,
          id: Date.now().toString(),
          createdDate: new Date().toISOString(),
          lastReviewed: new Date().toISOString(),
          score,
          relatedTasks: risk.relatedTasks || [],
        };
        set((state) => ({
          risks: [...state.risks, newRisk],
        }));
      },

      updateRisk: (id, updates) => {
        set((state) => ({
          risks: state.risks.map((risk) => {
            if (risk.id === id) {
              const updatedRisk = { ...risk, ...updates };
              // Recalculate score if probability or impact changed
              if (updates.probability !== undefined || updates.impact !== undefined) {
                updatedRisk.score = get().calculateRiskScore(
                  updatedRisk.probability,
                  updatedRisk.impact
                );
              }
              updatedRisk.lastReviewed = new Date().toISOString();
              return updatedRisk;
            }
            return risk;
          }),
        }));
      },

      deleteRisk: (id) =>
        set((state) => ({
          risks: state.risks.filter((risk) => risk.id !== id),
        })),

      updateRiskStatus: (id, status) => {
        get().updateRisk(id, { status });
      },

      linkTaskToRisk: (riskId, taskId) =>
        set((state) => ({
          risks: state.risks.map((risk) =>
            risk.id === riskId
              ? {
                  ...risk,
                  relatedTasks: [...risk.relatedTasks, taskId],
                  lastReviewed: new Date().toISOString(),
                }
              : risk
          ),
        })),

      unlinkTaskFromRisk: (riskId, taskId) =>
        set((state) => ({
          risks: state.risks.map((risk) =>
            risk.id === riskId
              ? {
                  ...risk,
                  relatedTasks: risk.relatedTasks.filter((id) => id !== taskId),
                  lastReviewed: new Date().toISOString(),
                }
              : risk
          ),
        })),

      calculateRiskScore: (probability, impact) => probability * impact,

      getRisksByCategory: (category) => {
        return get().risks.filter((risk) => risk.category === category);
      },

      getHighRisks: () => {
        return get().risks.filter((risk) => risk.score >= 15);
      },

      getProjectRiskScore: () => {
        const risks = get().risks;
        if (risks.length === 0) return 0;
        const totalScore = risks.reduce((sum, risk) => sum + risk.score, 0);
        return totalScore / risks.length;
      },

      clearAllRisks: () => set({ risks: [] }),
    }),
    {
      name: 'risk-storage',
      partialize: (state) => ({ risks: state.risks }),
    }
  )
);
