import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MapState, Coordinates } from '../types';

interface MapStore extends MapState {
  setCoords: (coords: Coordinates) => void;
  setLocationName: (name: string) => void;
  setZoom: (zoom: number) => void;
}

export const useMapStore = create<MapStore>()(
  persist(
    (set) => ({
      // Initial state (San Francisco)
      coords: { lat: 37.7749, lng: -122.4194 },
      locationName: '',
      zoom: 13,

      // Actions
      setCoords: (coords) => set({ coords }),
      setLocationName: (name) => set({ locationName: name }),
      setZoom: (zoom) => set({ zoom }),
    }),
    {
      name: 'map-storage',
      partialize: (state) => ({
        coords: state.coords,
        zoom: state.zoom,
        locationName: state.locationName,
      }),
    }
  )
);
