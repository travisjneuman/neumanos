/**
 * Weather Map Widget
 *
 * Combined weather and map display (wrapper for WeatherMap component)
 */

import React from 'react';
import { WeatherMap } from '../WeatherMap';

export const WeatherMapWidget: React.FC = () => {
  return <WeatherMap />;
};
