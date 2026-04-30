import { GroupMessageRecord } from '../../../domain/contracts';
import { IChatObserver } from './contracts';

/**
 * ChatSubject - Patrón Observer para mensajes de grupo
 * 
 * Responsabilidades:
 * - Mantener un registro de observadores por grupo
 * - Notificar a todos los observadores cuando hay un nuevo mensaje
 * - Permitir que clientes se suscriban/desuscriban por grupo
 * 
 * Diseño:
 * - Un ChatSubject por aplicación que gestiona múltiples grupos
 * - Los observadores concretos (Web/Mobile) viven en infraestructura
 * - No conoce detalles de WebSockets ni plataformas específicas
 */
export class ChatSubject {
  private static instance: ChatSubject;
  
  /**
   * Map que almacena los observadores por ID de grupo
   * Key: grupoId (ID del grupo)
   * Value: Set de observadores suscritos al grupo
   */
  private suscriptores = new Map<string, Set<IChatObserver>>();

  private constructor() {}

  /**
   * Obtiene la instancia única del ChatSubject (Singleton)
   */
  static getInstance(): ChatSubject {
    if (!ChatSubject.instance) {
      ChatSubject.instance = new ChatSubject();
    }
    return ChatSubject.instance;
  }

  /**
   * Suscribe un observador a un grupo específico
   * 
   * @param grupoId ID del grupo al que el cliente quiere escuchar mensajes
   * @param observer Observador concreto (Web o Mobile)
   * 
   * Ejemplo:
   * const observer = new WebChatObserver(socket, grupoId);
   * chatSubject.suscribir('grupo-123', observer);
   */
  suscribir(grupoId: string, observer: IChatObserver): void {
    if (!this.suscriptores.has(grupoId)) {
      this.suscriptores.set(grupoId, new Set());
    }
    this.suscriptores.get(grupoId)!.add(observer);
    
    console.log(`✅ Observer suscrito al grupo ${grupoId}`);
  }

  /**
   * Desuscribe un observador de un grupo específico
   * 
   * Se llama cuando el cliente se desconecta para evitar fugas de memoria
   * 
   * @param grupoId ID del grupo
   * @param observer Observador a remover
   * 
   * Ejemplo:
   * chatSubject.desuscribir('grupo-123', observer);
   */
  desuscribir(grupoId: string, observer: IChatObserver): void {
    const suscriptoresDelGrupo = this.suscriptores.get(grupoId);
    if (suscriptoresDelGrupo) {
      suscriptoresDelGrupo.delete(observer);
      
      // Si no hay más suscriptores, eliminar la entrada del mapa
      if (suscriptoresDelGrupo.size === 0) {
        this.suscriptores.delete(grupoId);
      }
      
      console.log(`❌ Observer desuscrito del grupo ${grupoId}`);
    }
  }

  /**
   * Desuscribe todos los observadores de un usuario de todos los grupos
   * Se llama cuando el usuario se desconecta del socket
   * 
   * @param observer Observer a remover de todos los grupos
   */
  desuscribirDeTodos(observer: IChatObserver): void {
    this.suscriptores.forEach((observadores, grupoId) => {
      if (observadores.has(observer)) {
        observadores.delete(observer);
        
        if (observadores.size === 0) {
          this.suscriptores.delete(grupoId);
        }
      }
    });
    
    console.log(`❌ Observer desuscrito de todos los grupos`);
  }

  /**
   * Emite un nuevo mensaje a todos los observadores de un grupo
   * 
   * Se llama desde el use case enviarMensajeGrupo después de persistir el mensaje
   * 
   * @param grupoId ID del grupo donde se emitió el mensaje
   * @param mensaje Entidad Mensaje decorada con información del emisor
   * 
   * Ejemplo:
   * chatSubject.emitirNuevoMensaje('grupo-123', mensajeGuardado);
   */
  emitirNuevoMensaje(grupoId: string, mensaje: GroupMessageRecord): void {
    const suscriptoresDelGrupo = this.suscriptores.get(grupoId);
    
    if (!suscriptoresDelGrupo) {
      console.warn(`⚠️  No hay observadores suscritos al grupo ${grupoId}`);
      return;
    }

    suscriptoresDelGrupo.forEach((observer) => {
      try {
        observer.onNuevoMensajeGrupo(mensaje);
      } catch (error) {
        console.error('❌ Error al notificar al observador de chat:', error);
      }
    });

    console.log(
      `📨 Mensaje emitido a ${suscriptoresDelGrupo.size} observador(es) del grupo ${grupoId}`,
    );
  }

  /**
   * Retorna el número de observadores suscritos a un grupo
   * Útil para debugging y monitoreo
   * 
   * @param grupoId ID del grupo
   * @returns Número de observadores suscritos
   */
  contarSuscriptores(grupoId: string): number {
    return this.suscriptores.get(grupoId)?.size ?? 0;
  }

  /**
   * Retorna el número total de grupos con al menos un observador
   * Útil para monitoreo del sistema
   * 
   * @returns Número de grupos activos
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
