import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_CSS_BYTES = 51200; // 50KB

interface CustomCSSState {
  css: string;
  enabled: boolean;
  lastUpdated: string;
}

interface CustomCSSActions {
  updateCSS: (css: string) => void;
  toggleEnabled: () => void;
  resetCSS: () => void;
}

type CustomCSSStore = CustomCSSState & CustomCSSActions;

const initialState: CustomCSSState = {
  css: '',
  enabled: false,
  lastUpdated: '',
};

export const useCustomCSSStore = create<CustomCSSStore>()(
  persist(
    (set) => ({
      ...initialState,

      updateCSS: (css: string) => {
        if (new Blob([css]).size > MAX_CSS_BYTES) {
          return;
        }
        set({ css, lastUpdated: new Date().toISOString() });
      },

      toggleEnabled: () => {
        set((state) => ({ enabled: !state.enabled }));
      },

      resetCSS: () => {
        set({ css: '', enabled: false, lastUpdated: '' });
      },
    }),
    {
      name: 'custom-css-preferences',
    }
  )
);
