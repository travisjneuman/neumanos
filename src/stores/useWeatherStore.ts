import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WeatherState, Coordinates, WeatherData } from '../types';
import { createSyncedStorage } from '../lib/syncedStorage';

interface WeatherStore extends WeatherState {
  setCity: (city: string) => void;
  setCoords: (coords: Coordinates) => void;
  setWeatherData: (data: WeatherData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUseGeolocation: (use: boolean) => void;
}

export const useWeatherStore = create<WeatherStore>()(
  persist(
    (set) => ({
      // Initial state
      city: '',
      coords: { lat: 37.7749, lng: -122.4194 }, // Default: San Francisco
      useGeolocation: false, // Don't auto-prompt for location
      weatherData: null,
      loading: false,
      error: null,

      // Actions
      setCity: (city) => set({ city }),
      setCoords: (coords) => set({ coords }),
      setWeatherData: (data) => set({ weatherData: data }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setUseGeolocation: (use) => set({ useGeolocation: use }),
    }),
    {
      name: 'weather-data',
      storage: createJSONStorage(() => createSyncedStorage()),
      partialize: (state) => ({
        city: state.city,
        coords: state.coords,
        useGeolocation: state.useGeolocation,
      }),
    }
  )
);
