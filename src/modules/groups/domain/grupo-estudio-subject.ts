import { IGrupoEstudioObserver } from './contracts-grupo-estudio';

/**
 * ============================================================================
 * GrupoEstudioSubject - Patrón Observer para eventos de grupo de estudio
 * ============================================================================
 * 
 * Subject concreto que gestiona observadores de eventos de grupos de estudio:
 * - Creación de grupos
 * - Modificación de grupos
 * - Finalización de grupos
 * - Cambios de miembros
 * 
 * Responsabilidades:
 * - Mantener un registro de observadores por grupo
 * - Notificar a todos los observadores cuando ocurren eventos del grupo
 * - Permitir que clientes se suscriban/desuscriban
 * 
 * Este Subject es similar a ChatSubject pero enfocado en eventos de grupo
 * (no mensajes en tiempo real, sino eventos de ciclo de vida del grupo)
 * 
 * ============================================================================
 */

export interface GrupoEstudioEvent {
  tipo: 'creado' | 'modificado' | 'finalizado' | 'miembro-agregado' | 'miembro-removido';
  grupoId: string;
  nombre: string;
  descripcion: string;
  miembrosActuales: number;
  timestamp: Date;
}

export class GrupoEstudioSubject {
  private static instance: GrupoEstudioSubject;

  /**
   * Map que almacena los observadores por ID de grupo
   * Key: grupoId
   * Value: Set de observadores suscritos al grupo
   */
  private suscriptores = new Map<string, Set<IGrupoEstudioObserver>>();

  private constructor() {}

  /**
   * Obtiene la instancia única del GrupoEstudioSubject (Singleton)
   */
  static getInstance(): GrupoEstudioSubject {
    if (!GrupoEstudioSubject.instance) {
      GrupoEstudioSubject.instance = new GrupoEstudioSubject();
    }
    return GrupoEstudioSubject.instance;
  }

  /**
   * Suscribe un observador a eventos de un grupo específico
   * 
   * @param grupoId ID del grupo
   * @param observer Observador de eventos del grupo
   */
  suscribir(grupoId: string, observer: IGrupoEstudioObserver): void {
    if (!this.suscriptores.has(grupoId)) {
      this.suscriptores.set(grupoId, new Set());
    }
    this.suscriptores.get(grupoId)!.add(observer);
  }

  /**
   * Desuscribe un observador de un grupo específico
   * 
   * @param grupoId ID del grupo
   * @param observer Observador a remover
   */
  desuscribir(grupoId: string, observer: IGrupoEstudioObserver): void {
    const suscriptoresDelGrupo = this.suscriptores.get(grupoId);
    if (suscriptoresDelGrupo) {
      suscriptoresDelGrupo.delete(observer);

      // Limpiar si no hay más suscriptores
      if (suscriptoresDelGrupo.size === 0) {
        this.suscriptores.delete(grupoId);
      }
    }
  }

  /**
   * Emite un evento de grupo a todos los observadores suscritos
   * 
   * @param grupoId ID del grupo
   * @param evento Evento del grupo
   */
  emitirEvento(grupoId: string, evento: GrupoEstudioEvent): void {
    const suscriptoresDelGrupo = this.suscriptores.get(grupoId);

    if (!suscriptoresDelGrupo) {
      console.warn(`⚠️  No hay observadores suscritos al grupo ${grupoId}`);
      return;
    }

    suscriptoresDelGrupo.forEach(observer => {
      try {
        observer.onEventoGrupo(evento);
      } catch (error) {
        console.error('❌ Error al notificar al observador de grupo:', error);
      }
    });
  }

  /**
   * Retorna el número de observadores suscritos a un grupo
   */
  contarSuscriptores(grupoId: string): number {
    return this.suscriptores.get(grupoId)?.size ?? 0;
  }

  /**
   * Retorna el número de grupos activos
   */
  contarGruposActivos(): number {
    return this.suscriptores.size;
  }

  /**
   * Limpia todos los suscriptores (útil para testing)
   */
  limpiar(): void {
    this.suscriptores.clear();
  }
}
