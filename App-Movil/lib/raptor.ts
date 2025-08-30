import type { Parada, Ruta, Bus, SegmentoViaje, RutaOptima } from './types';

interface EstadoRAPTOR {
  parada_id: string;
  tiempo_llegada: number;
  ruta_tomada?: string;
  parada_anterior?: string;
  numero_transferencias: number;
}

interface GrafoTransporte {
  paradas: Map<string, any>;
  rutas: Map<string, any>;
  buses: Map<string, any>;
  paradasPorRuta: Map<string, string[]>;
  rutasPorParada: Map<string, string[]>;
}

class RAPTORAlgorithm {
  private grafo: GrafoTransporte;
  private velocidadCaminata = 1.4; // m/s (5 km/h)
  private tiempoEsperaPromedio = 300; // 5 minutos en segundos
  private maxTransferencias = 3;
  private maxDistanciaCaminata = 1000; // metros

  constructor(paradas: any[], rutas: any[], buses: any[]) {
    this.grafo = this.construirGrafo(paradas, rutas, buses);
  }

  private construirGrafo(paradas: any[], rutas: any[], buses: any[]): GrafoTransporte {
    const paradasMap = new Map<string, any>();
    const rutasMap = new Map<string, any>();
    const busesMap = new Map<string, any>();
    const paradasPorRuta = new Map<string, string[]>();
    const rutasPorParada = new Map<string, string[]>();

    // Construir mapas básicos
    paradas.forEach(parada => {
      const id = parada.id_parada || parada.id;
      paradasMap.set(id, parada);
    });
    
    rutas.forEach(ruta => {
      const id = ruta.id_ruta || ruta.id;
      rutasMap.set(id, ruta);
    });
    
    buses.forEach(bus => {
      const id = bus.id || bus.id_bus;
      busesMap.set(id, bus);
    });

    // Construir índices de relaciones
    rutas.forEach(ruta => {
      const rutaId = ruta.id_ruta || ruta.id;
      const stopIds = ruta.stopIds || ruta.paradas || [];
      
      if (stopIds.length > 0) {
        paradasPorRuta.set(rutaId, stopIds);
        
        stopIds.forEach((paradaId: string) => {
          if (!rutasPorParada.has(paradaId)) {
            rutasPorParada.set(paradaId, []);
          }
          rutasPorParada.get(paradaId)!.push(rutaId);
        });
      }
    });

    return {
      paradas: paradasMap,
      rutas: rutasMap,
      buses: busesMap,
      paradasPorRuta,
      rutasPorParada,
    };
  }

  private calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

  private obtenerParadasCercanas(lat: number, lng: number): string[] {
    const paradasCercanas: { id: string; distancia: number }[] = [];

    this.grafo.paradas.forEach((parada, id) => {
      const paradaLat = parada.coordenadas?.lat || parada.lat || 0;
      const paradaLng = parada.coordenadas?.lng || parada.lng || 0;
      
      if (!paradaLat || !paradaLng) return;
      
      const distancia = this.calcularDistancia(
        lat, lng,
        paradaLat,
        paradaLng
      );

      if (distancia <= this.maxDistanciaCaminata) {
        paradasCercanas.push({ id, distancia });
      }
    });

    return paradasCercanas
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 5) // Máximo 5 paradas cercanas
      .map(p => p.id);
  }

  private calcularTiempoCaminata(distancia: number): number {
    return Math.round(distancia / this.velocidadCaminata);
  }

  private obtenerTiempoViaje(rutaId: string, paradaOrigen: string, paradaDestino: string): number {
    // Simplificación: tiempo promedio entre paradas
    const ruta = this.grafo.rutas.get(rutaId);
    if (!ruta) return Infinity;

    const paradas = ruta.stopIds || ruta.paradas || [];
    const indiceOrigen = paradas.indexOf(paradaOrigen);
    const indiceDestino = paradas.indexOf(paradaDestino);

    if (indiceOrigen === -1 || indiceDestino === -1 || indiceDestino <= indiceOrigen) {
      return Infinity;
    }

    // Tiempo estimado: 2 minutos por parada + tiempo de espera
    const numeroParadas = indiceDestino - indiceOrigen;
    return (numeroParadas * 120) + this.tiempoEsperaPromedio;
  }

  public encontrarRutaOptima(
    origenLat: number,
    origenLng: number,
    destinoLat: number,
    destinoLng: number,
    horaInicio: Date = new Date()
  ): RutaOptima[] {
    const tiempoInicio = Math.floor(horaInicio.getTime() / 1000);
    
    // Obtener paradas cercanas al origen y destino
    const paradasOrigen = this.obtenerParadasCercanas(origenLat, origenLng);
    const paradasDestino = this.obtenerParadasCercanas(destinoLat, destinoLng);

    if (paradasOrigen.length === 0 || paradasDestino.length === 0) {
      return [];
    }

    const mejoresRutas: RutaOptima[] = [];

    // Aplicar RAPTOR para cada combinación de paradas origen-destino
    paradasOrigen.forEach(paradaOrigenId => {
      paradasDestino.forEach(paradaDestinoId => {
        const ruta = this.ejecutarRAPTOR(
          origenLat, origenLng, paradaOrigenId,
          destinoLat, destinoLng, paradaDestinoId,
          tiempoInicio
        );
        if (ruta) {
          mejoresRutas.push(ruta);
        }
      });
    });

    // Ordenar por tiempo total y número de transferencias
    return mejoresRutas
      .sort((a, b) => {
        if (a.tiempo_total !== b.tiempo_total) {
          return a.tiempo_total - b.tiempo_total;
        }
        return a.numero_transferencias - b.numero_transferencias;
      })
      .slice(0, 3); // Retornar las 3 mejores opciones
  }

  private ejecutarRAPTOR(
    origenLat: number, origenLng: number, paradaOrigenId: string,
    destinoLat: number, destinoLng: number, paradaDestinoId: string,
    tiempoInicio: number
  ): RutaOptima | null {
    // Estados por ronda (transferencia)
    const estados: Map<string, EstadoRAPTOR>[] = [];
    
    // Inicialización
    estados[0] = new Map();
    
    // Caminata inicial al transporte público
    const paradaOrigen = this.grafo.paradas.get(paradaOrigenId);
    if (!paradaOrigen) return null;

    const paradaOrigenLat = paradaOrigen.coordenadas?.lat || paradaOrigen.lat || 0;
    const paradaOrigenLng = paradaOrigen.coordenadas?.lng || paradaOrigen.lng || 0;

    const distanciaCaminataInicial = this.calcularDistancia(
      origenLat, origenLng,
      paradaOrigenLat,
      paradaOrigenLng
    );

    const tiempoCaminataInicial = this.calcularTiempoCaminata(distanciaCaminataInicial);
    
    estados[0].set(paradaOrigenId, {
      parada_id: paradaOrigenId,
      tiempo_llegada: tiempoInicio + tiempoCaminataInicial,
      numero_transferencias: 0,
    });

    // Ejecutar rondas RAPTOR
    for (let ronda = 0; ronda <= this.maxTransferencias; ronda++) {
      if (!estados[ronda]) break;

      estados[ronda + 1] = new Map(estados[ronda]);

      // Marcar rutas para escanear
      const rutasParaEscanear = new Set<string>();
      estados[ronda].forEach((estado) => {
        const rutasParada = this.grafo.rutasPorParada.get(estado.parada_id) || [];
        rutasParada.forEach(rutaId => rutasParaEscanear.add(rutaId));
      });

      // Escanear cada ruta marcada
      rutasParaEscanear.forEach(rutaId => {
        this.escanearRuta(rutaId, estados[ronda], estados[ronda + 1], ronda);
      });

      // Si no hay mejoras, terminar
      if (estados[ronda + 1].size === estados[ronda].size) {
        break;
      }
    }

    // Encontrar la mejor ruta al destino
    let mejorEstado: EstadoRAPTOR | null = null;
    
    estados.forEach(estadosRonda => {
      const estadoDestino = estadosRonda.get(paradaDestinoId);
      if (estadoDestino && (!mejorEstado || estadoDestino.tiempo_llegada < mejorEstado.tiempo_llegada)) {
        mejorEstado = estadoDestino;
      }
    });

    if (!mejorEstado) return null;

    // Reconstruir la ruta
    return this.reconstruirRuta(
      origenLat, origenLng, destinoLat, destinoLng,
      paradaOrigenId, paradaDestinoId,
      mejorEstado, tiempoInicio
    );
  }

  private escanearRuta(
    rutaId: string,
    estadosEntrada: Map<string, EstadoRAPTOR>,
    estadosSalida: Map<string, EstadoRAPTOR>,
    ronda: number
  ): void {
    const paradas = this.grafo.paradasPorRuta.get(rutaId);
    if (!paradas) return;

    let mejorTiempoSubida = Infinity;
    let paradaSubida: string | null = null;

    // Escanear paradas en orden
    paradas.forEach((paradaId, indice) => {
      // Verificar si podemos subir aquí
      const estadoParada = estadosEntrada.get(paradaId);
      if (estadoParada && estadoParada.tiempo_llegada < mejorTiempoSubida) {
        mejorTiempoSubida = estadoParada.tiempo_llegada;
        paradaSubida = paradaId;
      }

      // Si podemos subir, verificar si podemos bajar en paradas posteriores
      if (paradaSubida && indice > paradas.indexOf(paradaSubida)) {
        const tiempoViaje = this.obtenerTiempoViaje(rutaId, paradaSubida, paradaId);
        const tiempoLlegada = mejorTiempoSubida + tiempoViaje;

        const estadoActual = estadosSalida.get(paradaId);
        if (!estadoActual || tiempoLlegada < estadoActual.tiempo_llegada) {
          estadosSalida.set(paradaId, {
            parada_id: paradaId,
            tiempo_llegada: tiempoLlegada,
            ruta_tomada: rutaId,
            parada_anterior: paradaSubida,
            numero_transferencias: ronda,
          });
        }
      }
    });
  }

  private reconstruirRuta(
    origenLat: number, origenLng: number,
    destinoLat: number, destinoLng: number,
    paradaOrigenId: string, paradaDestinoId: string,
    estadoFinal: EstadoRAPTOR,
    tiempoInicio: number
  ): RutaOptima {
    const segmentos: SegmentoViaje[] = [];
    let distanciaTotal = 0;

    // Segmento inicial: caminata al transporte público
    const paradaOrigen = this.grafo.paradas.get(paradaOrigenId)!;
    const paradaOrigenLat = paradaOrigen.coordenadas?.lat || paradaOrigen.lat || 0;
    const paradaOrigenLng = paradaOrigen.coordenadas?.lng || paradaOrigen.lng || 0;
    
    const distanciaCaminataInicial = this.calcularDistancia(
      origenLat, origenLng,
      paradaOrigenLat,
      paradaOrigenLng
    );

    const tiempoFinCaminataInicial = tiempoInicio + this.calcularTiempoCaminata(distanciaCaminataInicial);

    segmentos.push({
      tipo: 'caminar',
      desde: 'origen',
      hasta: paradaOrigenId,
      tiempo_inicio: new Date(tiempoInicio * 1000).toISOString().substr(11, 8),
      tiempo_fin: new Date(tiempoFinCaminataInicial * 1000).toISOString().substr(11, 8),
      duracion_seg: this.calcularTiempoCaminata(distanciaCaminataInicial),
      distancia_metros: distanciaCaminataInicial,
      instrucciones: `Caminar ${Math.round(distanciaCaminataInicial)}m hasta ${paradaOrigen.nombre || paradaOrigen.name}`,
    });

    distanciaTotal += distanciaCaminataInicial;

    // Reconstruir segmentos de transporte público
    // (Simplificado - en una implementación completa se seguiría la cadena de parada_anterior)
    if (estadoFinal.ruta_tomada && estadoFinal.parada_anterior) {
      const ruta = this.grafo.rutas.get(estadoFinal.ruta_tomada)!;
      const paradaAnterior = this.grafo.paradas.get(estadoFinal.parada_anterior)!;
      const paradaDestino = this.grafo.paradas.get(paradaDestinoId)!;

      segmentos.push({
        tipo: 'autobus',
        desde: estadoFinal.parada_anterior,
        hasta: paradaDestinoId,
        id_ruta: estadoFinal.ruta_tomada,
        tiempo_inicio: tiempoInicio + this.calcularTiempoCaminata(distanciaCaminataInicial) + this.tiempoEsperaPromedio,
        tiempo_fin: estadoFinal.tiempo_llegada,
        duracion_seg: estadoFinal.tiempo_llegada - (tiempoInicio + this.calcularTiempoCaminata(distanciaCaminataInicial) + this.tiempoEsperaPromedio),
        instrucciones: `Tomar ${ruta.nombre || ruta.name || 'Bus'} desde ${paradaAnterior.nombre || paradaAnterior.name} hasta ${paradaDestino.nombre || paradaDestino.name}`,
      });
    }

    // Segmento final: caminata desde el transporte público
    const paradaFinal = this.grafo.paradas.get(paradaDestinoId)!;
    const paradaFinalLat = paradaFinal.coordenadas?.lat || paradaFinal.lat || 0;
    const paradaFinalLng = paradaFinal.coordenadas?.lng || paradaFinal.lng || 0;
    
    const distanciaCaminataFinal = this.calcularDistancia(
      paradaFinalLat,
      paradaFinalLng,
      destinoLat, destinoLng
    );

    const tiempoFinCaminataFinal = estadoFinal.tiempo_llegada + this.calcularTiempoCaminata(distanciaCaminataFinal);

    segmentos.push({
      tipo: 'caminar',
      desde: paradaDestinoId,
      hasta: 'destino',
      tiempo_inicio: new Date(estadoFinal.tiempo_llegada * 1000).toISOString().substr(11, 8),
      tiempo_fin: new Date(tiempoFinCaminataFinal * 1000).toISOString().substr(11, 8),
      duracion_seg: this.calcularTiempoCaminata(distanciaCaminataFinal),
      distancia_metros: distanciaCaminataFinal,
      instrucciones: `Caminar ${Math.round(distanciaCaminataFinal)}m hasta el destino`,
    });

    distanciaTotal += distanciaCaminataFinal;

    const tiempoFinal = estadoFinal.tiempo_llegada + this.calcularTiempoCaminata(distanciaCaminataFinal);

    return {
      origen: paradaOrigenId,
      destino: paradaDestinoId,
      tiempo_total_seg: tiempoFinal - tiempoInicio,
      numero_transbordos: estadoFinal.numero_transferencias,
      segmentos,
      distancia_caminata: distanciaTotal,
    };
  }
}

export { RAPTORAlgorithm };
export default RAPTORAlgorithm;