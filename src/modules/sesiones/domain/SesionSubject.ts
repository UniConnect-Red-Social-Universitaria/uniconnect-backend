import { CambioAsistenciaPayload, ISesionObserver } from './ISesionObserver';

const WILDCARD = '*';

export class SesionSubject {
  private static instance: SesionSubject;
  private observadores: Map<string, ISesionObserver[]> = new Map();

  private constructor() {}

  static getInstance(): SesionSubject {
    if (!SesionSubject.instance) {
      SesionSubject.instance = new SesionSubject();
    }
    return SesionSubject.instance;
  }

  suscribir(organizadorId: string, observer: ISesionObserver): void {
    if (!this.observadores.has(organizadorId)) {
      this.observadores.set(organizadorId, []);
    }
    this.observadores.get(organizadorId)!.push(observer);
  }

  desuscribir(organizadorId: string, observer: ISesionObserver): void {
    const lista = this.observadores.get(organizadorId);
    if (lista) {
      const idx = lista.indexOf(observer);
      if (idx !== -1) lista.splice(idx, 1);
      if (lista.length === 0) this.observadores.delete(organizadorId);
    }
  }

  notificarCambioAsistencia(payload: CambioAsistenciaPayload): void {
    // Notificar observadores específicos del organizador
    const especificos = this.observadores.get(payload.organizadorId);
    if (especificos) {
      especificos.forEach(obs => {
        try {
          obs.onAsistenciaActualizada(payload);
        } catch (error) {
          console.error('[SesionSubject] Error al notificar observador específico:', error);
        }
      });
    }

    // Notificar observadores globales (wildcard)
    const globales = this.observadores.get(WILDCARD);
    if (globales) {
      globales.forEach(obs => {
        try {
          obs.onAsistenciaActualizada(payload);
        } catch (error) {
          console.error('[SesionSubject] Error al notificar observador global:', error);
        }
      });
    }
  }
}
