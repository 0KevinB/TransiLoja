import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';
import { useTransport } from '../context/TransportContext';
import { useLocation } from '../hooks/useLocation';
import { ThemedView } from './ui/ThemedView';
import { ThemedText } from './ui/ThemedText';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface LeafletMapProps {
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
  plannedRoute?: any;
  style?: any;
  mode?: 'view' | 'select-stops' | 'plan-route' | 'select-origin' | 'select-destination';
}

const defaultRegion: Region = {
  latitude: -3.9929, // Loja, Ecuador
  longitude: -79.2045,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export const LeafletMapView: React.FC<LeafletMapProps> = ({
  initialRegion = defaultRegion,
  showUserLocation = true,
  showStops = true,
  showRoutes = true,
  showBuses = false,
  selectedStops = [],
  onStopPress,
  onMapPress,
  onOriginSelect,
  onDestinationSelect,
  origin,
  destination,
  plannedRoute,
  style,
  mode = 'view',
}) => {
  const { theme } = useTheme();
  const { paradas, rutas, buses, loading } = useTransport();
  const { location } = useLocation();
  const webViewRef = useRef<WebView>(null);

  // Generar HTML del mapa con Leaflet
  const generateMapHTML = () => {
    const mapStyle = theme.mode === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = theme.mode === 'dark'
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          #map { height: 100vh; width: 100vw; }
          
          /* Marcadores personalizados mejorados */
          .custom-marker {
            background-color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            border: 3px solid;
            transition: transform 0.2s ease;
          }
          .custom-marker:hover {
            transform: scale(1.1);
          }
          
          /* Paradas normales */
          .stop-normal {
            width: 28px;
            height: 28px;
            background-color: #FFF7ED;
            border-color: #F59E0B;
            color: #F59E0B;
            font-size: 16px;
          }
          
          /* Puntos de conexión */
          .stop-connection {
            width: 32px;
            height: 32px;
            background-color: #ECFDF5;
            border-color: #10B981;
            color: #10B981;
            font-size: 18px;
          }
          
          /* Paradas inactivas */
          .stop-inactive {
            width: 24px;
            height: 24px;
            background-color: #FEF2F2;
            border-color: #EF4444;
            color: #EF4444;
            font-size: 14px;
            opacity: 0.7;
          }
          
          /* Marcadores de origen/destino */
          .origin-marker {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #10B981, #059669);
            border-color: #065F46;
            color: white;
            font-size: 20px;
            animation: pulse 2s infinite;
          }
          .destination-marker {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #EF4444, #DC2626);
            border-color: #991B1B;
            color: white;
            font-size: 20px;
            animation: pulse 2s infinite;
          }
          
          /* Buses */
          .bus-marker {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background-color: white;
            border: 3px solid;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            transition: transform 0.2s ease;
          }
          .bus-marker:hover {
            transform: scale(1.15);
          }
          
          .bus-active { border-color: #10B981; background-color: #ECFDF5; }
          .bus-stopped { border-color: #F59E0B; background-color: #FFF7ED; }
          .bus-offline { border-color: #EF4444; background-color: #FEF2F2; opacity: 0.8; }
          
          /* Ubicación del usuario */
          .user-location-marker {
            width: 32px;
            height: 32px;
            background: radial-gradient(circle, #3B82F6, #1D4ED8);
            border: 4px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            animation: pulse 2s infinite;
          }
          
          /* Animación de pulso */
          @keyframes pulse {
            0% { box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
            50% { box-shadow: 0 4px 16px rgba(59, 130, 246, 0.6), 0 0 0 8px rgba(59, 130, 246, 0.1); }
            100% { box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
          }
          
          /* Popups mejorados */
          .leaflet-popup-content {
            margin: 0;
            padding: 0;
            border-radius: 8px;
            overflow: hidden;
            min-width: 280px;
            font-family: inherit;
          }
          .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          }
          .leaflet-popup-tip {
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          /* Contenido de popups */
          .popup-header {
            background: linear-gradient(135deg, #F8FAFC, #E2E8F0);
            padding: 16px;
            border-bottom: 2px solid #E2E8F0;
          }
          .popup-title {
            font-size: 18px;
            font-weight: 700;
            color: #1E293B;
            margin: 0 0 4px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .popup-subtitle {
            font-size: 14px;
            color: #64748B;
            margin: 0;
          }
          .popup-body {
            padding: 16px;
          }
          .popup-info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #F1F5F9;
          }
          .popup-info-row:last-child {
            border-bottom: none;
          }
          .popup-label {
            font-weight: 600;
            color: #475569;
            font-size: 14px;
          }
          .popup-value {
            color: #1E293B;
            font-size: 14px;
            font-weight: 500;
          }
          .popup-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-active { background: #DCFCE7; color: #166534; }
          .status-inactive { background: #FEF2F2; color: #991B1B; }
          .status-connection { background: #EFF6FF; color: #1E40AF; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Inicializar mapa
          const map = L.map('map').setView([${initialRegion.latitude}, ${initialRegion.longitude}], 14);
          
          // Agregar capa de mosaicos
          L.tileLayer('${mapStyle}', {
            attribution: '${attribution}',
            maxZoom: 19
          }).addTo(map);

          // Variables globales
          let markers = {};
          let routes = {};
          
          // Función para comunicar con React Native
          function sendMessage(type, data) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
          }

          // Manejar clicks en el mapa
          map.on('click', function(e) {
            const coord = { latitude: e.latlng.lat, longitude: e.latlng.lng };
            sendMessage('mapPress', coord);
          });

          // Función para agregar parada con diseño mejorado
          function addStop(stop) {
            const lat = stop.coordenadas?.lat || stop.lat || 0;
            const lng = stop.coordenadas?.lng || stop.lng || 0;
            
            if (!lat || !lng) {
              console.log('Parada sin coordenadas:', stop);
              return;
            }
            
            const isConnection = stop.es_punto_conexion;
            const isActive = stop.activa !== false;
            
            // Determinar ícono y clase CSS
            let iconHtml, className;
            if (!isActive) {
              iconHtml = '⛔'; // Ícono de prohibido
              className = 'custom-marker stop-inactive';
            } else if (isConnection) {
              iconHtml = '🔄'; // Ícono de conexión
              className = 'custom-marker stop-connection';
            } else {
              iconHtml = '🚏'; // Ícono de parada de bus
              className = 'custom-marker stop-normal';
            }
            
            // Crear marcador personalizado
            const customIcon = L.divIcon({
              className: className,
              html: iconHtml,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              popupAnchor: [0, -16]
            });
            
            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
            
            // Calcular información adicional
            const rutas_conectadas = window.routesData ? 
              window.routesData.filter(route => route.stopIds && route.stopIds.includes(stop.id_parada || stop.id)).length : 0;
            
            const distancia_centro = calculateDistance(lat, lng, -3.9929, -79.2045);
            
            // Popup con información completa y mejor diseño
            const popupContent = 
              '<div class="popup-header">' +
                '<div class="popup-title">' + iconHtml + ' ' + (stop.nombre || stop.name || 'Parada') + '</div>' +
                (stop.codigo ? '<div class="popup-subtitle">Código: ' + stop.codigo + '</div>' : '') +
              '</div>' +
              '<div class="popup-body">' +
                '<div class="popup-info-row">' +
                  '<span class="popup-label">Estado</span>' +
                  '<span class="popup-status ' + (isActive ? 'status-active' : 'status-inactive') + '">' + 
                    (isActive ? 'Activa' : 'Inactiva') + '</span>' +
                '</div>' +
                (isConnection ? 
                  '<div class="popup-info-row">' +
                    '<span class="popup-label">Tipo</span>' +
                    '<span class="popup-status status-connection">Punto de Conexión</span>' +
                  '</div>' : '') +
                '<div class="popup-info-row">' +
                  '<span class="popup-label">Rutas conectadas</span>' +
                  '<span class="popup-value">' + rutas_conectadas + ' rutas</span>' +
                '</div>' +
                '<div class="popup-info-row">' +
                  '<span class="popup-label">Distancia al centro</span>' +
                  '<span class="popup-value">' + (distancia_centro < 1000 ? 
                    Math.round(distancia_centro) + 'm' : 
                    (distancia_centro / 1000).toFixed(1) + 'km') + '</span>' +
                '</div>' +
                '<div class="popup-info-row">' +
                  '<span class="popup-label">Coordenadas</span>' +
                  '<span class="popup-value">' + lat.toFixed(6) + ', ' + lng.toFixed(6) + '</span>' +
                '</div>' +
                (stop.direccion ? 
                  '<div class="popup-info-row">' +
                    '<span class="popup-label">Dirección</span>' +
                    '<span class="popup-value">' + stop.direccion + '</span>' +
                  '</div>' : '') +
              '</div>';
            
            marker.bindPopup(popupContent, { maxWidth: 320, className: 'custom-popup' });
            marker.on('click', function() {
              sendMessage('stopPress', stop);
            });
            
            markers[stop.id_parada || stop.id] = marker;
          }
          
          // Función auxiliar para calcular distancia
          function calculateDistance(lat1, lng1, lat2, lng2) {
            const R = 6371e3; // Radio de la Tierra en metros
            const φ1 = lat1 * Math.PI / 180;
            const φ2 = lat2 * Math.PI / 180;
            const Δφ = (lat2 - lat1) * Math.PI / 180;
            const Δλ = (lng2 - lng1) * Math.PI / 180;

            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

            return R * c;
          }

          // Colores predefinidos para rutas
          const routeColors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#A569BD'
          ];
          
          function getRouteColor(route, index) {
            if (route.color) return route.color;
            return routeColors[index % routeColors.length];
          }
          
          // Función para agregar ruta con colores distintivos
          function addRoute(route, index = 0) {
            if (!route.stopIds || route.stopIds.length < 2) {
              console.log('Ruta sin paradas suficientes:', route);
              return;
            }
            
            const coordinates = [];
            const validStops = [];
            
            route.stopIds.forEach(stopId => {
              const stop = window.stopsData?.find(s => (s.id_parada || s.id) === stopId);
              if (stop) {
                const lat = stop.coordenadas?.lat || stop.lat || 0;
                const lng = stop.coordenadas?.lng || stop.lng || 0;
                if (lat && lng) {
                  coordinates.push([lat, lng]);
                  validStops.push(stop);
                }
              }
            });
            
            if (coordinates.length > 1) {
              const routeColor = getRouteColor(route, index);
              const isActive = route.activa !== false;
              
              // Calcular distancia total aproximada
              let totalDistance = 0;
              for (let i = 0; i < coordinates.length - 1; i++) {
                totalDistance += calculateDistance(
                  coordinates[i][0], coordinates[i][1],
                  coordinates[i + 1][0], coordinates[i + 1][1]
                );
              }
              
              const polyline = L.polyline(coordinates, {
                color: routeColor,
                weight: isActive ? 5 : 3,
                opacity: isActive ? 0.9 : 0.6,
                dashArray: !isActive ? '15,10' : null,
                lineCap: 'round',
                lineJoin: 'round'
              }).addTo(map);
              
              // Efecto hover
              polyline.on('mouseover', function() {
                this.setStyle({ weight: isActive ? 7 : 5, opacity: 1 });
              });
              
              polyline.on('mouseout', function() {
                this.setStyle({ weight: isActive ? 5 : 3, opacity: isActive ? 0.9 : 0.6 });
              });
              
              // Usar frecuencia real si está disponible, sino no mostrar
              const frecuenciaReal = route.frecuencia || route.intervalo || route.frequency;
              
              // Popup con información completa de la ruta
              const popupContent = 
                '<div class="popup-header" style="background: linear-gradient(135deg, ' + routeColor + '22, ' + routeColor + '11);">' +
                  '<div class="popup-title">🚌 ' + (route.nombre || route.nombre_largo || route.name || 'Ruta') + '</div>' +
                  (route.nombre_corto ? '<div class="popup-subtitle">Línea: ' + route.nombre_corto + '</div>' : '') +
                '</div>' +
                '<div class="popup-body">' +
                  '<div class="popup-info-row">' +
                    '<span class="popup-label">Estado</span>' +
                    '<span class="popup-status ' + (isActive ? 'status-active' : 'status-inactive') + '">' + 
                      (isActive ? 'Activa' : 'Inactiva') + '</span>' +
                  '</div>' +
                  '<div class="popup-info-row">' +
                    '<span class="popup-label">Número de paradas</span>' +
                    '<span class="popup-value">' + validStops.length + ' paradas</span>' +
                  '</div>' +
                  '<div class="popup-info-row">' +
                    '<span class="popup-label">Distancia aproximada</span>' +
                    '<span class="popup-value">' + (totalDistance / 1000).toFixed(1) + ' km</span>' +
                  '</div>' +
                  (frecuenciaReal ? 
                    '<div class="popup-info-row">' +
                      '<span class="popup-label">Frecuencia</span>' +
                      '<span class="popup-value">Cada ' + frecuenciaReal + ' min</span>' +
                    '</div>' : '') +
                  '<div class="popup-info-row">' +
                    '<span class="popup-label">Color de línea</span>' +
                    '<span class="popup-value">' +
                      '<div style="width: 20px; height: 20px; background: ' + routeColor + '; border-radius: 50%; display: inline-block; margin-left: 8px;"></div>' +
                    '</span>' +
                  '</div>' +
                  (route.descripcion ? 
                    '<div class="popup-info-row">' +
                      '<span class="popup-label">Descripción</span>' +
                      '<span class="popup-value">' + route.descripcion + '</span>' +
                    '</div>' : '') +
                  '<div class="popup-info-row">' +
                    '<span class="popup-label">Paradas principales</span>' +
                    '<span class="popup-value">' + 
                      validStops.slice(0, 3).map(s => s.nombre || s.name).join(' → ') +
                      (validStops.length > 3 ? ' → ...' : '') +
                    '</span>' +
                  '</div>' +
                '</div>';
              
              polyline.bindPopup(popupContent, { maxWidth: 350, className: 'custom-popup' });
              routes[route.id_ruta || route.id] = polyline;
            }
          }

          // Función para agregar marcador de origen/destino
          function addOriginDestination(origin, destination) {
            // Limpiar marcadores anteriores
            if (window.originMarker) {
              map.removeLayer(window.originMarker);
            }
            if (window.destinationMarker) {
              map.removeLayer(window.destinationMarker);
            }
            if (window.routeLine) {
              map.removeLayer(window.routeLine);
            }

            if (origin) {
              const originIcon = L.divIcon({
                className: 'custom-marker origin-marker',
                html: 'O',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });
              
              window.originMarker = L.marker([origin.latitude, origin.longitude], { 
                icon: originIcon 
              }).addTo(map);
              window.originMarker.bindPopup(origin.name || 'Origen');
            }

            if (destination) {
              const destIcon = L.divIcon({
                className: 'custom-marker destination-marker',
                html: 'D',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });
              
              window.destinationMarker = L.marker([destination.latitude, destination.longitude], { 
                icon: destIcon 
              }).addTo(map);
              window.destinationMarker.bindPopup(destination.name || 'Destino');
            }

            // Línea entre origen y destino
            if (origin && destination) {
              window.routeLine = L.polyline([
                [origin.latitude, origin.longitude],
                [destination.latitude, destination.longitude]
              ], {
                color: '#666666',
                weight: 2,
                opacity: 0.8,
                dashArray: '10, 10'
              }).addTo(map);
            }
          }

          // Función para mostrar ruta planificada
          function showPlannedRoute(plannedRoute) {
            // Limpiar rutas anteriores
            if (window.plannedRouteLines) {
              window.plannedRouteLines.forEach(line => map.removeLayer(line));
            }
            window.plannedRouteLines = [];

            if (!plannedRoute || !plannedRoute.segmentos) return;

            plannedRoute.segmentos.forEach((segmento, index) => {
              let color = '#10B981'; // Verde para caminar
              let weight = 3;
              let dashArray = null;

              if (segmento.tipo === 'autobus') {
                color = '#3B82F6'; // Azul para autobús
                weight = 4;
              } else {
                dashArray = '10, 10'; // Línea punteada para caminar
              }

              // Obtener coordenadas del segmento
              const fromCoords = getCoordinatesFromId(segmento.desde);
              const toCoords = getCoordinatesFromId(segmento.hasta);

              if (fromCoords && toCoords) {
                const line = L.polyline([fromCoords, toCoords], {
                  color: color,
                  weight: weight,
                  opacity: 0.8,
                  dashArray: dashArray
                }).addTo(map);

                line.bindPopup((segmento.tipo === 'autobus' ? '🚌' : '🚶') + ' ' + segmento.instrucciones);
                window.plannedRouteLines.push(line);
              }
            });
          }

          function getCoordinatesFromId(id) {
            if (id === 'origen') return window.originCoords;
            if (id === 'destino') return window.destinationCoords;
            
            const stop = window.stopsData?.find(s => (s.id_parada || s.id) === id);
            if (stop) {
              const lat = stop.coordenadas?.lat || stop.lat || 0;
              const lng = stop.coordenadas?.lng || stop.lng || 0;
              return lat && lng ? [lat, lng] : null;
            }
            return null;
          }

          // Función para agregar bus con mejor diseño
          function addBus(bus) {
            const lat = bus.coordenadas?.lat || bus.lat || bus.ubicacion?.lat || bus.coordenadas_actuales?.lat || 0;
            const lng = bus.coordenadas?.lng || bus.lng || bus.ubicacion?.lng || bus.coordenadas_actuales?.lng || 0;
            
            if (!lat || !lng) {
              console.log('Bus sin coordenadas:', bus);
              return;
            }
            
            // Determinar estado del bus
            const estado = bus.estado || bus.status || 'desconocido';
            const isInTransit = estado === 'en_ruta' || estado === 'in_transit' || estado === 'activo';
            const isAtStop = estado === 'en_parada' || estado === 'stopped' || bus.isAtStop;
            const isOffline = estado === 'offline' || estado === 'inactivo' || estado === 'mantenimiento';
            
            // Determinar clase CSS y ícono
            let className, iconHtml;
            if (isOffline) {
              className = 'bus-marker bus-offline';
              iconHtml = '🔴'; // Rojo offline
            } else if (isAtStop) {
              className = 'bus-marker bus-stopped';
              iconHtml = '🚌'; // Bus normal en parada
            } else {
              className = 'bus-marker bus-active';
              iconHtml = '🚌'; // Bus en movimiento
            }
            
            // Crear marcador personalizado para bus
            const busIcon = L.divIcon({
              className: className,
              html: iconHtml,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              popupAnchor: [0, -16]
            });
            
            const busMarker = L.marker([lat, lng], { icon: busIcon }).addTo(map);
            
            // Calcular tiempo desde última actualización solo si tenemos timestamp real
            const ultimaActualizacion = bus.updated_at || bus.timestamp || bus.ultima_actualizacion;
            let tiempoTranscurrido = null;
            if (ultimaActualizacion) {
              try {
                const fechaActualizacion = new Date(ultimaActualizacion);
                if (!isNaN(fechaActualizacion.getTime())) {
                  const diff = Date.now() - fechaActualizacion.getTime();
                  const minutos = Math.floor(diff / 60000);
                  if (minutos < 1) tiempoTranscurrido = 'Ahora mismo';
                  else if (minutos < 60) tiempoTranscurrido = 'Hace ' + minutos + ' min';
                  else if (minutos < 1440) tiempoTranscurrido = 'Hace ' + Math.floor(minutos / 60) + 'h ' + (minutos % 60) + 'min';
                  else tiempoTranscurrido = 'Hace más de 1 día';
                }
              } catch (e) {
                console.log('Error parsing timestamp:', e);
              }
            }
            
            // Usar próxima parada real si está disponible
            let proximaParada = bus.proxima_parada || bus.next_stop || bus.destino;
            if (!proximaParada && bus.ruta_asignada) {
              // Solo calcular si tenemos datos reales de la ruta actual del bus
              const rutaInfo = window.routesData?.find(r => 
                (r.id_ruta === bus.ruta_asignada || r.nombre_corto === bus.ruta_asignada) && 
                r.stopIds && r.stopIds.length > 0
              );
              
              if (rutaInfo && rutaInfo.stopIds) {
                // Buscar la parada más cercana en la ruta actual
                let menorDistancia = Infinity;
                let paradaCercana = null;
                rutaInfo.stopIds.forEach(stopId => {
                  const parada = window.stopsData?.find(s => (s.id_parada || s.id) === stopId);
                  if (parada && parada.coordenadas?.lat && parada.coordenadas?.lng) {
                    const distancia = calculateDistance(lat, lng, 
                      parada.coordenadas.lat, parada.coordenadas.lng);
                    // Solo considerar paradas que estén relativamente cerca (menos de 500m)
                    if (distancia < menorDistancia && distancia < 500) {
                      menorDistancia = distancia;
                      paradaCercana = parada;
                    }
                  }
                });
                if (paradaCercana) {
                  proximaParada = (paradaCercana.nombre || paradaCercana.name) + ' (~' + Math.round(menorDistancia) + 'm)';
                }
              }
            }
            
            if (!proximaParada) {
              proximaParada = 'No disponible';
            }
            
            // Popup con información completa del bus
            const popupContent = 
              '<div class="popup-header">' +
                '<div class="popup-title">🚌 Bus ' + (bus.numero_placa || bus.placa || bus.id || 'S/N') + '</div>' +
                (bus.numero_interno ? '<div class="popup-subtitle">Nº Interno: ' + bus.numero_interno + '</div>' : '') +
              '</div>' +
              '<div class="popup-body">' +
                '<div class="popup-info-row">' +
                  '<span class="popup-label">Estado actual</span>' +
                  '<span class="popup-status ' + 
                    (isOffline ? 'status-inactive' : (isAtStop ? 'status-connection' : 'status-active')) + '">' + 
                    (isOffline ? 'Fuera de servicio' : (isAtStop ? 'En parada' : 'En ruta')) + '</span>' +
                '</div>' +
                (bus.ruta_asignada ? 
                  '<div class="popup-info-row">' +
                    '<span class="popup-label">Ruta asignada</span>' +
                    '<span class="popup-value">' + bus.ruta_asignada + '</span>' +
                  '</div>' : '') +
                (bus.velocidad && bus.velocidad > 0 ? 
                  '<div class="popup-info-row">' +
                    '<span class="popup-label">Velocidad</span>' +
                    '<span class="popup-value">' + Math.round(bus.velocidad) + ' km/h</span>' +
                  '</div>' : '') +
                '<div class="popup-info-row">' +
                  '<span class="popup-label">Próxima parada</span>' +
                  '<span class="popup-value">' + proximaParada + '</span>' +
                '</div>' +
                (tiempoTranscurrido ? 
                  '<div class="popup-info-row">' +
                    '<span class="popup-label">Última actualización</span>' +
                    '<span class="popup-value">' + tiempoTranscurrido + '</span>' +
                  '</div>' : '') +
                '<div class="popup-info-row">' +
                  '<span class="popup-label">Coordenadas</span>' +
                  '<span class="popup-value">' + lat.toFixed(6) + ', ' + lng.toFixed(6) + '</span>' +
                '</div>' +
                (bus.conductor ? 
                  '<div class="popup-info-row">' +
                    '<span class="popup-label">Conductor</span>' +
                    '<span class="popup-value">' + bus.conductor + '</span>' +
                  '</div>' : '') +
              '</div>';
            
            busMarker.bindPopup(popupContent, { maxWidth: 300, className: 'custom-popup' });
            busMarker.on('click', function() {
              sendMessage('busPress', bus);
            });
            
            markers[bus.id || bus.numero_placa] = busMarker;
          }

          // Función para agregar marcador de usuario mejorado
          function addUserLocation(lat, lng) {
            // Remover marcadores anteriores si existen
            if (window.userLocationMarker) {
              map.removeLayer(window.userLocationMarker);
            }
            if (window.userLocationCircle) {
              map.removeLayer(window.userLocationCircle);
            }
            if (window.userAccuracyCircle) {
              map.removeLayer(window.userAccuracyCircle);
            }
            
            // Crear ícono personalizado para ubicación del usuario
            const userIcon = L.divIcon({
              className: 'user-location-marker',
              html: '🧑',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              popupAnchor: [0, -16]
            });
            
            // Agregar marcador principal
            window.userLocationMarker = L.marker([lat, lng], { 
              icon: userIcon,
              zIndexOffset: 1000 // Mantener encima de otros marcadores
            }).addTo(map);
            
            // Agregar círculo de precisión pequeño
            window.userLocationCircle = L.circle([lat, lng], {
              radius: 25,
              fillColor: '#3B82F6',
              color: '#1D4ED8',
              weight: 3,
              opacity: 0.8,
              fillOpacity: 0.3
            }).addTo(map);
            
            // Agregar círculo de precisión más amplio
            window.userAccuracyCircle = L.circle([lat, lng], {
              radius: 100,
              fillColor: '#3B82F6',
              color: '#3B82F6',
              weight: 1,
              opacity: 0.4,
              fillOpacity: 0.1,
              dashArray: '5,5'
            }).addTo(map);
            
            // Encontrar paradas cercanas
            const paradasCercanas = [];
            if (window.stopsData) {
              window.stopsData.forEach(stop => {
                const stopLat = stop.coordenadas?.lat || stop.lat;
                const stopLng = stop.coordenadas?.lng || stop.lng;
                if (stopLat && stopLng) {
                  const distancia = calculateDistance(lat, lng, stopLat, stopLng);
                  if (distancia <= 300) { // Paradas dentro de 300m
                    paradasCercanas.push({
                      nombre: stop.nombre || stop.name,
                      distancia: Math.round(distancia)
                    });
                  }
                }
              });
            }
            
            paradasCercanas.sort((a, b) => a.distancia - b.distancia);
            
            // Popup con información de ubicación y paradas cercanas
            const popupContent = 
              '<div class="popup-header">' +
                '<div class="popup-title">🧑 Tu ubicación</div>' +
                '<div class="popup-subtitle">Ubicación actual GPS</div>' +
              '</div>' +
              '<div class="popup-body">' +
                '<div class="popup-info-row">' +
                  '<span class="popup-label">Precisión</span>' +
                  '<span class="popup-value">± 25-100m</span>' +
                '</div>' +
                '<div class="popup-info-row">' +
                  '<span class="popup-label">Coordenadas</span>' +
                  '<span class="popup-value">' + lat.toFixed(6) + ', ' + lng.toFixed(6) + '</span>' +
                '</div>' +
                '<div class="popup-info-row">' +
                  '<span class="popup-label">Paradas cercanas</span>' +
                  '<span class="popup-value">' + 
                    (paradasCercanas.length > 0 ? 
                      paradasCercanas.slice(0, 3).map(p => p.nombre + ' (' + p.distancia + 'm)').join('<br>') : 
                      'Ninguna en 300m') +
                  '</span>' +
                '</div>' +
                '<div class="popup-info-row">' +
                  '<span class="popup-label">Hora actual</span>' +
                  '<span class="popup-value">' + new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'}) + '</span>' +
                '</div>' +
              '</div>';
            
            window.userLocationMarker.bindPopup(popupContent, { maxWidth: 280, className: 'custom-popup' });
          }

          // Función para centrar en ubicación
          function centerOnLocation(lat, lng) {
            map.setView([lat, lng], 16);
            // Actualizar ubicación del usuario
            if (window.addUserLocation) {
              window.addUserLocation(lat, lng);
            }
          }

          // Exponer funciones globalmente
          window.addStop = addStop;
          window.addRoute = addRoute;
          window.addBus = addBus;
          window.addOriginDestination = addOriginDestination;
          window.showPlannedRoute = showPlannedRoute;
          window.addUserLocation = addUserLocation;
          window.centerOnLocation = centerOnLocation;
          
          // Log para debugging y notificar que está listo
          console.log('Mapa inicializado correctamente');
          sendMessage('mapReady', { ready: true });
        </script>
      </body>
      </html>
    `;
  };

  // Manejar mensajes del WebView
  const handleMessage = (event: any) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);
      
      switch (type) {
        case 'mapPress':
          if (mode === 'select-origin') {
            onOriginSelect?.(data);
          } else if (mode === 'select-destination') {
            onDestinationSelect?.(data);
          } else {
            onMapPress?.(data);
          }
          break;
        case 'stopPress':
          onStopPress?.(data);
          break;
        case 'busPress':
          // Manejar presión en buses si se proporciona callback
          console.log('Bus seleccionado:', data);
          break;
        case 'mapReady':
          setMapReady(true);
          console.log('Mapa listo para recibir datos');
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Estado para controlar actualizaciones del mapa
  const [mapReady, setMapReady] = useState(false);
  const [lastUpdate, setLastUpdate] = useState({
    showStops: showStops,
    showRoutes: showRoutes,
    showBuses: showBuses
  });

  // Función optimizada para actualizar elementos específicos del mapa
  const updateMapElements = () => {
    if (!webViewRef.current || !mapReady) return;

    // Solo actualizar si realmente cambió algo
    const needsStopsUpdate = lastUpdate.showStops !== showStops;
    const needsRoutesUpdate = lastUpdate.showRoutes !== showRoutes;
    const needsBusesUpdate = lastUpdate.showBuses !== showBuses;

    if (!needsStopsUpdate && !needsRoutesUpdate && !needsBusesUpdate && !origin && !destination && !plannedRoute) {
      return;
    }

    // Construir JavaScript dinámicamente solo para lo que cambió
    let javascript = `
      // Almacenar datos globalmente para acceso en funciones
      window.stopsData = ${JSON.stringify(paradas)};
    `;

    if (needsStopsUpdate) {
      javascript += `
        // Limpiar marcadores de paradas existentes
        Object.keys(markers).forEach(key => {
          if (markers[key].options.className && markers[key].options.className.includes('stop-')) {
            map.removeLayer(markers[key]);
            delete markers[key];
          }
        });
      `;
    }

    if (needsRoutesUpdate) {
      javascript += `
        // Limpiar rutas existentes
        Object.values(routes).forEach(route => map.removeLayer(route));
        routes = {};
      `;
    }

    if (needsBusesUpdate) {
      javascript += `
        // Limpiar marcadores de buses existentes
        Object.keys(markers).forEach(key => {
          if (markers[key].options.className && markers[key].options.className.includes('bus-')) {
            map.removeLayer(markers[key]);
            delete markers[key];
          }
        });
      `;
    }

    // Agregar elementos según filtros activos
    if (showStops) {
      javascript += `
        console.log('Agregando', window.stopsData ? window.stopsData.length : 0, 'paradas');
        if (window.stopsData && window.stopsData.length > 0) {
          window.stopsData.forEach(stop => {
            if (window.addStop) window.addStop(stop);
          });
        }
      `;
    }

    if (showRoutes) {
      javascript += `
        const routesData = ${JSON.stringify(rutas)};
        console.log('Agregando', routesData.length, 'rutas');
        if (routesData && routesData.length > 0) {
          window.routesData = routesData;
          routesData.forEach((route, index) => {
            if (window.addRoute) window.addRoute(route, index);
          });
        }
      `;
    }

    if (showBuses) {
      javascript += `
        const busesData = ${JSON.stringify(buses)};
        console.log('Agregando', busesData.length, 'buses');
        if (busesData && busesData.length > 0) {
          busesData.forEach(bus => {
            if (window.addBus) window.addBus(bus);
          });
        }
      `;
    }

    // Agregar origen y destino
    if (origin || destination) {
      javascript += `
        window.originCoords = ${origin ? `[${origin.latitude}, ${origin.longitude}]` : 'null'};
        window.destinationCoords = ${destination ? `[${destination.latitude}, ${destination.longitude}]` : 'null'};
        if (window.addOriginDestination) {
          window.addOriginDestination(
            ${origin ? JSON.stringify(origin) : 'null'},
            ${destination ? JSON.stringify(destination) : 'null'}
          );
        }
      `;
    }

    // Mostrar ruta planificada
    if (plannedRoute) {
      javascript += `
        if (window.showPlannedRoute) {
          window.showPlannedRoute(${JSON.stringify(plannedRoute)});
        }
      `;
    }

    javascript += ' true;'; // Retornar algo para evitar errores

    webViewRef.current.injectJavaScript(javascript);
    
    // Actualizar el estado de último cambio
    setLastUpdate({
      showStops: showStops,
      showRoutes: showRoutes,
      showBuses: showBuses
    });
  };

  // Actualizar datos en el mapa cuando cambian los filtros
  useEffect(() => {
    updateMapElements();
  }, [showStops, showRoutes, showBuses, origin, destination, plannedRoute, mapReady]);

  // Centrar en ubicación del usuario y actualizar marcador
  useEffect(() => {
    if (location && webViewRef.current) {
      const javascript = `
        if (window.addUserLocation) {
          window.addUserLocation(${location.latitude}, ${location.longitude});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(javascript);
    }
  }, [location]);

  // Inicializar ubicación del usuario cuando el mapa esté listo
  useEffect(() => {
    if (mapReady && location && webViewRef.current) {
      const javascript = `
        if (window.addUserLocation) {
          window.addUserLocation(${location.latitude}, ${location.longitude});
          window.centerOnLocation(${location.latitude}, ${location.longitude});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(javascript);
    }
  }, [mapReady, location]);

  if (loading) {
    return (
      <ThemedView style={[styles.container, style]}>
        <ThemedText>Cargando datos del mapa...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <ThemedView style={styles.loading}>
            <ThemedText>Cargando mapa...</ThemedText>
          </ThemedView>
        )}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});