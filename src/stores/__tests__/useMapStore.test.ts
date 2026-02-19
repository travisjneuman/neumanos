import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '../useMapStore';

describe('useMapStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useMapStore.setState({
      coords: { lat: 37.7749, lng: -122.4194 },
      locationName: '',
      zoom: 13,
    });
  });

  it('should have initial state', () => {
    const state = useMapStore.getState();
    expect(state.coords).toEqual({ lat: 37.7749, lng: -122.4194 });
    expect(state.locationName).toBe('');
    expect(state.zoom).toBe(13);
  });

  it('should update coordinates', () => {
    const newCoords = { lat: 40.7128, lng: -74.006 }; // New York
    useMapStore.getState().setCoords(newCoords);

    const state = useMapStore.getState();
    expect(state.coords).toEqual(newCoords);
  });

  it('should update location name', () => {
    useMapStore.getState().setLocationName('San Francisco');

    const state = useMapStore.getState();
    expect(state.locationName).toBe('San Francisco');
  });

  it('should update zoom level', () => {
    useMapStore.getState().setZoom(15);

    const state = useMapStore.getState();
    expect(state.zoom).toBe(15);
  });

  it('should persist state to localStorage', () => {
    const newCoords = { lat: 51.5074, lng: -0.1278 }; // London
    useMapStore.getState().setCoords(newCoords);
    useMapStore.getState().setLocationName('London');
    useMapStore.getState().setZoom(12);

    // Check localStorage
    const stored = localStorage.getItem('map-storage');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.state.coords).toEqual(newCoords);
    expect(parsed.state.locationName).toBe('London');
    expect(parsed.state.zoom).toBe(12);
  });
});
