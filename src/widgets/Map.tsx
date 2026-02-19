import React, { useEffect, useRef } from 'react';
import { Widget } from '../components/Widget';
import { useMapStore } from '../stores/useMapStore';
import { useWeatherStore } from '../stores/useWeatherStore';
import L from 'leaflet';

/**
 * Map Widget - Interactive map using Leaflet.js + OpenStreetMap
 *
 * Features:
 * - Interactive pan and zoom
 * - Syncs location with Weather widget
 * - Click to set custom location
 * - Dark mode map tiles
 * - Current location marker
 */
export const Map: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const isMapClickRef = useRef(false); // Track if update is from map click

  const { coords, zoom, setCoords, setZoom } = useMapStore();
  const { coords: weatherCoords, setCoords: setWeatherCoords } = useWeatherStore();

  // Initialize Map coords from Weather coords on mount
  useEffect(() => {
    if (weatherCoords.lat !== coords.lat || weatherCoords.lng !== coords.lng) {
      setCoords(weatherCoords);
    }
  }, []);

  // Listen to Weather coords changes and sync to Map
  useEffect(() => {
    // Don't update if the change originated from map click
    if (isMapClickRef.current) {
      isMapClickRef.current = false;
      return;
    }

    // Sync Map coords to Weather coords
    if (weatherCoords.lat !== coords.lat || weatherCoords.lng !== coords.lng) {
      setCoords(weatherCoords);
    }
  }, [weatherCoords.lat, weatherCoords.lng]);

  // Initialize map on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: zoom,
      zoomControl: true,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add custom marker icon
    const customIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
          <path fill="#E91E8C" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    // Add marker
    const marker = L.marker([coords.lat, coords.lng], { icon: customIcon })
      .addTo(map)
      .bindPopup('Current Location');

    // Handle map click - set new location
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };

      // Update map marker
      marker.setLatLng([newCoords.lat, newCoords.lng]);

      // Mark this as a map-initiated change to prevent sync loop
      isMapClickRef.current = true;

      // Update stores (Map -> Weather)
      setCoords(newCoords);
      setWeatherCoords(newCoords);

      // Show popup
      marker
        .setPopupContent(`📍 ${newCoords.lat.toFixed(4)}, ${newCoords.lng.toFixed(4)}`)
        .openPopup();
    });

    // Track zoom level
    map.on('zoomend', () => {
      setZoom(map.getZoom());
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Cleanup on unmount
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update map when coords change (e.g., from Weather widget)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const map = mapRef.current;
    const marker = markerRef.current;

    // Update marker position
    marker.setLatLng([coords.lat, coords.lng]);

    // Pan to new location
    map.setView([coords.lat, coords.lng], map.getZoom());
  }, [coords.lat, coords.lng]);

  return (
    <Widget id="map" title="Map" category="Navigation">
      <div className="map-widget h-full flex flex-col">
        <div className="mb-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
          Click anywhere on the map to set a new location
        </div>
        <div
          ref={mapContainerRef}
          className="flex-1 rounded-lg overflow-hidden border border-border-light dark:border-border-dark"
          style={{ minHeight: '300px' }}
        />
      </div>
    </Widget>
  );
};
