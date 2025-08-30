import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, Platform, View, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTransport } from '../context/TransportContext';
import { useLocation } from '../hooks/useLocation';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';
import { ThemedButton } from './ui/ThemedButton';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';

import { LeafletMapView } from './LeafletMapView';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapComponentProps {
  initialRegion?: Region;
  showUserLocation?: boolean;
  showStops?: boolean;
  showRoutes?: boolean;
  showBuses?: boolean;
  selectedStops?: string[];
  onStopPress?: (stop: any) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onOriginSelect?: (coordinate: { latitude: number; longitude: number }) => void;
  onDestinationSelect?: (coordinate: { latitude: number; longitude: number }) => void;
  origin?: { latitude: number; longitude: number; name?: string };
  destination?: { latitude: number; longitude: number; name?: string };
  plannedRoute?: any; // RutaOptima from RAPTOR
  style?: any;
  mode?: 'view' | 'select-stops' | 'plan-route' | 'select-origin' | 'select-destination';
}

const defaultRegion: Region = {
  latitude: -3.9929, // Loja, Ecuador
  longitude: -79.2045,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export const MapComponent: React.FC<MapComponentProps> = (props) => {
  // Redireccionar todas las llamadas al nuevo componente LeafletMapView
  return <LeafletMapView {...props} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  controlsCard: {
    flexDirection: 'column',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  controlButton: {
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  legendContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  legendCard: {
    padding: 12,
    minWidth: 120,
  },
  legendTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  modeContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  modeCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  customMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

