import { useState, useCallback } from 'react';
import { RutaOptima } from '../lib/types';
import { useTransport } from '../context/TransportContext';
import RAPTORAlgorithm from '../lib/raptor';

interface RoutingState {
  rutas: RutaOptima[];
  loading: boolean;
  error: string | null;
}

export const useRouting = () => {
  const { paradas, rutas, buses } = useTransport();
  const [state, setState] = useState<RoutingState>({
    rutas: [],
    loading: false,
    error: null,
  });

  const buscarRutas = useCallback(async (
    origenLat: number,
    origenLng: number,
    destinoLat: number,
    destinoLng: number,
    horaInicio?: Date
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Verificar que tenemos datos disponibles
      if (paradas.length === 0 || rutas.length === 0) {
        throw new Error('Datos de transporte no disponibles');
      }

      // Crear instancia del algoritmo RAPTOR
      const raptor = new RAPTORAlgorithm(paradas, rutas, buses);
      
      // Buscar rutas óptimas
      const rutasOptimas = raptor.encontrarRutaOptima(
        origenLat,
        origenLng,
        destinoLat,
        destinoLng,
        horaInicio
      );

      setState({
        rutas: rutasOptimas,
        loading: false,
        error: null,
      });

      return rutasOptimas;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState({
        rutas: [],
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, [paradas, rutas, buses]);

  const limpiarRutas = useCallback(() => {
    setState({
      rutas: [],
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    buscarRutas,
    limpiarRutas,
  };
};