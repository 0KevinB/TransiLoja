import { 
  Parada, 
  Ruta, 
  Viaje, 
  TiempoParada, 
  Transbordo, 
  EstadoRAPTOR, 
  RutaOptima, 
  SegmentoViaje,
  Coordenadas 
} from './types'

// Constantes para el algoritmo RAPTOR
const MAX_RONDAS = 10 // Máximo 10 transbordos
const TIEMPO_CAMINATA_DEFAULT = 300 // 5 minutos por defecto
const VELOCIDAD_CAMINATA_MS = 1.4 // 1.4 m/s (5 km/h)

export class RAPTORAlgorithm {
  private paradas: Map<string, Parada> = new Map()
  private rutas: Map<string, Ruta> = new Map()
  private viajes: Map<string, Viaje> = new Map()
  private tiemposParada: Map<string, TiempoParada[]> = new Map()
  private transbordos: Map<string, Transbordo[]> = new Map()
  private rutasPorParada: Map<string, string[]> = new Map()
  private viajesPorRuta: Map<string, string[]> = new Map()

  constructor() {
    // Constructor vacío - se cargan datos dinámicamente
  }

  // Cargar datos necesarios para el algoritmo
  async cargarDatos(
    paradas: Parada[],
    rutas: Ruta[],
    viajes: Viaje[],
    tiemposParada: TiempoParada[],
    transbordos: Transbordo[]
  ) {
    // Cargar paradas
    paradas.forEach(parada => {
      this.paradas.set(parada.id_parada, parada)
    })

    // Cargar rutas
    rutas.forEach(ruta => {
      this.rutas.set(ruta.id_ruta, ruta)
    })

    // Cargar viajes
    viajes.forEach(viaje => {
      this.viajes.set(viaje.id_viaje, viaje)
      
      // Indexar viajes por ruta
      if (!this.viajesPorRuta.has(viaje.id_ruta)) {
        this.viajesPorRuta.set(viaje.id_ruta, [])
      }
      this.viajesPorRuta.get(viaje.id_ruta)!.push(viaje.id_viaje)
    })

    // Cargar y indexar tiempos de parada
    tiemposParada.forEach(tiempo => {
      const key = `${tiempo.id_viaje}-${tiempo.id_parada}`
      if (!this.tiemposParada.has(tiempo.id_viaje)) {
        this.tiemposParada.set(tiempo.id_viaje, [])
      }
      this.tiemposParada.get(tiempo.id_viaje)!.push(tiempo)

      // Indexar rutas por parada
      const viaje = this.viajes.get(tiempo.id_viaje)
      if (viaje) {
        if (!this.rutasPorParada.has(tiempo.id_parada)) {
          this.rutasPorParada.set(tiempo.id_parada, [])
        }
        const rutasParada = this.rutasPorParada.get(tiempo.id_parada)!
        if (!rutasParada.includes(viaje.id_ruta)) {
          rutasParada.push(viaje.id_ruta)
        }
      }
    })

    // Cargar transbordos
    transbordos.forEach(transbordo => {
      if (!this.transbordos.has(transbordo.id_parada_origen)) {
        this.transbordos.set(transbordo.id_parada_origen, [])
      }
      this.transbordos.get(transbordo.id_parada_origen)!.push(transbordo)
    })

    // Ordenar tiempos de parada por secuencia
    this.tiemposParada.forEach(tiempos => {
      tiempos.sort((a, b) => a.secuencia - b.secuencia)
    })
  }

  // Algoritmo RAPTOR principal
  async buscarRuta(
    origenId: string, 
    destinoId: string, 
    horaInicioStr: string = "08:00:00",
    fechaBusqueda: Date = new Date()
  ): Promise<RutaOptima | null> {
    
    if (!this.paradas.has(origenId) || !this.paradas.has(destinoId)) {
      throw new Error('Parada de origen o destino no encontrada')
    }

    const horaInicio = this.convertirHoraASegundos(horaInicioStr)
    
    // Inicialización RAPTOR
    const mejoresTiempos: Map<string, number> = new Map()
    const estadosOptimos: Map<string, EstadoRAPTOR> = new Map()
    
    // Inicializar con origen
    mejoresTiempos.set(origenId, horaInicio)
    estadosOptimos.set(origenId, {
      ronda: 0,
      parada: origenId,
      tiempo_llegada: horaInicio
    })

    // Añadir paradas caminables desde el origen
    await this.procesarCaminataDesde(origenId, horaInicio, mejoresTiempos, estadosOptimos, 0)

    let paradaPodenEllos = new Set<string>([origenId])
    
    // Ejecutar rondas RAPTOR
    for (let ronda = 1; ronda <= MAX_RONDAS; ronda++) {
      const nueasParadasMejoria = new Set<string>()
      const rutasMarcadas = new Set<string>()

      // Marcar rutas que pasan por paradas mejoradas en la ronda anterior
      for (const paradaId of paradaPodenEllos) {
        const rutasEnParada = this.rutasPorParada.get(paradaId) || []
        for (const rutaId of rutasEnParada) {
          rutasMarcadas.add(rutaId)
        }
      }

      // Procesar cada ruta marcada
      for (const rutaId of rutasMarcadas) {
        const viajesRuta = this.viajesPorRuta.get(rutaId) || []
        
        for (const viajeId of viajesRuta) {
          const tiemposViaje = this.tiemposParada.get(viajeId) || []
          let tiempoAbordaje: number | null = null
          let paradaAbordaje: string | null = null

          for (const tiempoParada of tiemposViaje) {
            const paradaId = tiempoParada.id_parada
            const tiempoLlegada = this.convertirHoraASegundos(tiempoParada.tiempo_llegada)

            // Verificar si podemos abordar en esta parada
            if (tiempoAbordaje === null && mejoresTiempos.has(paradaId)) {
              const tiempoLlegadaAParada = mejoresTiempos.get(paradaId)!
              if (tiempoLlegadaAParada <= tiempoLlegada) {
                tiempoAbordaje = tiempoLlegada
                paradaAbordaje = paradaId
              }
            }

            // Si ya abordamos, verificar si mejoramos tiempo en paradas posteriores
            if (tiempoAbordaje !== null && paradaAbordaje !== null) {
              const tiempoActual = mejoresTiempos.get(paradaId)
              if (!tiempoActual || tiempoLlegada < tiempoActual) {
                mejoresTiempos.set(paradaId, tiempoLlegada)
                estadosOptimos.set(paradaId, {
                  ronda,
                  parada: paradaId,
                  tiempo_llegada: tiempoLlegada,
                  viaje_utilizado: viajeId,
                  parada_anterior: paradaAbordaje,
                  ruta_utilizada: rutaId
                })
                nueasParadasMejoria.add(paradaId)

                // Procesar caminatas desde esta parada
                await this.procesarCaminataDesde(paradaId, tiempoLlegada, mejoresTiempos, estadosOptimos, ronda)
              }
            }
          }
        }
      }

      // Si no hay mejoras, terminar
      if (nueasParadasMejoria.size === 0) {
        break
      }

      paradaPodenEllos = nueasParadasMejoria
    }

    // Reconstruir ruta óptima
    if (!mejoresTiempos.has(destinoId)) {
      return null // No se encontró ruta
    }

    return this.reconstruirRuta(origenId, destinoId, estadosOptimos)
  }

  private async procesarCaminataDesde(
    paradaOrigenId: string,
    tiempoLlegada: number,
    mejoresTiempos: Map<string, number>,
    estadosOptimos: Map<string, EstadoRAPTOR>,
    ronda: number
  ) {
    const transbordosDesdeParada = this.transbordos.get(paradaOrigenId) || []
    
    for (const transbordo of transbordosDesdeParada) {
      const tiempoLlegadaDestino = tiempoLlegada + transbordo.tiempo_caminata_seg
      const tiempoActual = mejoresTiempos.get(transbordo.id_parada_destino)
      
      if (!tiempoActual || tiempoLlegadaDestino < tiempoActual) {
        mejoresTiempos.set(transbordo.id_parada_destino, tiempoLlegadaDestino)
        estadosOptimos.set(transbordo.id_parada_destino, {
          ronda,
          parada: transbordo.id_parada_destino,
          tiempo_llegada: tiempoLlegadaDestino,
          parada_anterior: paradaOrigenId
        })
      }
    }
  }

  private reconstruirRuta(
    origenId: string,
    destinoId: string,
    estadosOptimos: Map<string, EstadoRAPTOR>
  ): RutaOptima {
    const segmentos: SegmentoViaje[] = []
    let paradaActual = destinoId
    let tiempoTotal = 0
    let numeroTransbordos = 0

    // Reconstruir hacia atrás
    while (paradaActual !== origenId) {
      const estado = estadosOptimos.get(paradaActual)
      if (!estado || !estado.parada_anterior) {
        break
      }

      if (estado.viaje_utilizado) {
        // Segmento en autobús
        const viaje = this.viajes.get(estado.viaje_utilizado)!
        const ruta = this.rutas.get(viaje.id_ruta)!
        
        segmentos.unshift({
          tipo: "autobus",
          desde: estado.parada_anterior,
          hasta: paradaActual,
          id_viaje: estado.viaje_utilizado,
          id_ruta: viaje.id_ruta,
          tiempo_inicio: this.convertirSegundosAHora(
            estadosOptimos.get(estado.parada_anterior)?.tiempo_llegada || 0
          ),
          tiempo_fin: this.convertirSegundosAHora(estado.tiempo_llegada),
          duracion_seg: estado.tiempo_llegada - (estadosOptimos.get(estado.parada_anterior)?.tiempo_llegada || 0),
          instrucciones: `Tomar ${ruta.nombre_corto} hacia ${ruta.nombre_largo}`
        })
        
        if (segmentos.length > 1) numeroTransbordos++
      } else {
        // Segmento caminando
        const paradaOrigen = this.paradas.get(estado.parada_anterior)!
        const paradaDestino = this.paradas.get(paradaActual)!
        const distancia = this.calcularDistancia(
          paradaOrigen.coordenadas,
          paradaDestino.coordenadas
        )
        
        segmentos.unshift({
          tipo: "caminar",
          desde: estado.parada_anterior,
          hasta: paradaActual,
          tiempo_inicio: this.convertirSegundosAHora(
            estadosOptimos.get(estado.parada_anterior)?.tiempo_llegada || 0
          ),
          tiempo_fin: this.convertirSegundosAHora(estado.tiempo_llegada),
          duracion_seg: estado.tiempo_llegada - (estadosOptimos.get(estado.parada_anterior)?.tiempo_llegada || 0),
          distancia_metros: distancia,
          instrucciones: `Caminar ${Math.round(distancia)}m hacia ${paradaDestino.nombre}`
        })
      }

      paradaActual = estado.parada_anterior
    }

    tiempoTotal = estadosOptimos.get(destinoId)?.tiempo_llegada || 0
    tiempoTotal -= estadosOptimos.get(origenId)?.tiempo_llegada || 0

    return {
      origen: origenId,
      destino: destinoId,
      tiempo_total_seg: tiempoTotal,
      numero_transbordos: numeroTransbordos,
      segmentos
    }
  }

  // Utilidades
  private convertirHoraASegundos(horaStr: string): number {
    const [horas, minutos, segundos = "0"] = horaStr.split(':').map(Number)
    return horas * 3600 + minutos * 60 + segundos
  }

  private convertirSegundosAHora(segundos: number): string {
    const horas = Math.floor(segundos / 3600)
    const mins = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60
    return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`
  }

  private calcularDistancia(coord1: Coordenadas, coord2: Coordenadas): number {
    const R = 6371000 // Radio de la Tierra en metros
    const lat1Rad = coord1.lat * Math.PI / 180
    const lat2Rad = coord2.lat * Math.PI / 180
    const deltaLatRad = (coord2.lat - coord1.lat) * Math.PI / 180
    const deltaLngRad = (coord2.lng - coord1.lng) * Math.PI / 180

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // Generar transbordos automáticamente basado en proximidad
  async generarTransbordos(radioMetros: number = 500): Promise<Transbordo[]> {
    const transbordos: Transbordo[] = []
    const paradasArray = Array.from(this.paradas.values())

    for (let i = 0; i < paradasArray.length; i++) {
      for (let j = i + 1; j < paradasArray.length; j++) {
        const parada1 = paradasArray[i]
        const parada2 = paradasArray[j]
        const distancia = this.calcularDistancia(parada1.coordenadas, parada2.coordenadas)

        if (distancia <= radioMetros) {
          const tiempoCaminata = Math.ceil(distancia / VELOCIDAD_CAMINATA_MS)
          
          // Crear transbordo bidireccional
          transbordos.push({
            id_parada_origen: parada1.id_parada,
            id_parada_destino: parada2.id_parada,
            tiempo_caminata_seg: tiempoCaminata,
            distancia_metros: distancia,
            accesible: true
          })

          transbordos.push({
            id_parada_origen: parada2.id_parada,
            id_parada_destino: parada1.id_parada,
            tiempo_caminata_seg: tiempoCaminata,
            distancia_metros: distancia,
            accesible: true
          })
        }
      }
    }

    return transbordos
  }
}

// Factory para crear instancia de RAPTOR
export const crearRAPTOR = () => new RAPTORAlgorithm()