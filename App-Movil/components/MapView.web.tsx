import React from 'react';
import { LeafletMapView } from './LeafletMapView';

interface MapComponentProps {
  initialRegion?: any;
  showStops?: boolean;
  showRoutes?: boolean;
  showBuses?: boolean;
  showUserLocation?: boolean;
  onStopPress?: (stop: any) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  style?: any;
}

// Redireccionar al componente LeafletMapView para web también
export const MapComponent: React.FC<MapComponentProps> = (props) => {
  return <LeafletMapView {...props} />;
};

