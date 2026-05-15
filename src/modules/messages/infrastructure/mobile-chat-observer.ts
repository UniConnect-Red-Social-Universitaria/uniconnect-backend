import { Socket } from 'socket.io';
import { GroupMessageRecord, ReaccionMensajeGrupoRecord, MencionMensajeGrupoRecord } from '../../../domain/contracts';
import { IChatObserver } from '../domain/contracts';

/**
 * MobileChatObserver - Observer concreto para clientes Mobile
 * 
 * Responsabilidad: Emitir mensajes de grupo, reacciones y menciones a través de WebSocket (transporte Mobile)
 * 
 * Detalles:
 * - Sabe cómo comunicarse con clientes Mobile (Socket.IO/HTTP)
 * - Similar a WebChatObserver pero puede incluir lógica específica de Mobile
 * - Se registra en ChatSubject cuando el cliente Mobile se conecta a un grupo
 * - Se desregistra cuando el cliente se desconecta
 * 
 * Nota: En la práctica actual, Web y Mobile comparten el mismo transporte (Socket.IO)
 * pero esta separación permite implementar lógicas diferenciadas si es necesario:
 * - Enviar push notifications adicionales en Mobile
 * - Comprimir payloads para conexiones móviles
 * - Implementar retry logic diferente
 * - Analytics y tracking por plataforma
 */
export class MobileChatObserver implements IChatObserver {
  /**
   * @param socket Socket del cliente Mobile conectado
   * @param grupoId ID del grupo al cual este observer está asociado
   */
  constructor(
    private readonly socket: Socket,
    private readonly grupoId: string,
  ) {}

  /**
   * Se invoca cuando el ChatSubject emite un nuevo mensaje
   * 
   * Implementa la interfaz IChatObserver
   * 
   * @param payload Mensaje decorado del grupo con información del emisor
   */
  onNuevoMensajeGrupo(payload: GroupMessageRecord): void {
    try {
      // Emitir el mensaje al cliente Mobile a través del socket
      this.socket.emit('grupo:mensaje:nuevo', payload);
      
      console.log(
        `📱 Mensaje del grupo ${this.grupoId} emitido al cliente Mobile ${this.socket.id}`,
      );

      // Aquí se pueden añadir lógicas específicas de Mobile:
      // - Enviar push notification
      // - Log de analytics
      // - Implementar rate limiting
      // - Serialización optimizada para datos móviles
    } catch (error) {
      console.error(
        `❌ Error al emitir mensaje de grupo al cliente Mobile: ${error}`,
      );
    }
  }

  /**
   * Se invoca cuando se agrega una reacción a un mensaje
   * 
   * @param payload Reacción con información
   */
  onReaccionAgregada(payload: ReaccionMensajeGrupoRecord): void {
    try {
      this.socket.emit('grupo:reaccion:agregada', {
        mensajeId: payload.mensajeId,
        emoji: payload.emoji,
        usuarioId: payload.usuarioId,
        usuario: payload.usuario,
        createdAt: payload.createdAt,
      });
      
      console.log(
        `😊 Reacción del grupo ${this.grupoId} emitida al cliente Mobile ${this.socket.id}`,
      );
    } catch (error) {
      console.error(`❌ Error al emitir reacción agregada en Mobile: ${error}`);
    }
  }

  /**
   * Se invoca cuando se remueve una reacción de un mensaje
   * 
   * @param data Datos de la reacción removida
   */
  onReaccionRemovida(data: { mensajeId: string; usuarioId: string; emoji: string }): void {
    try {
      this.socket.emit('grupo:reaccion:removida', data);
      
      console.log(
        `❌ Reacción removida del grupo ${this.grupoId} emitida al cliente Mobile ${this.socket.id}`,
      );
    } catch (error) {
      console.error(`❌ Error al emitir reacción removida en Mobile: ${error}`);
    }
  }

  /**
   * Se invoca cuando se menciona a un usuario
   * 
   * @param payload Mención con información
   */
  onMencionar(payload: MencionMensajeGrupoRecord): void {
    try {
      this.socket.emit('grupo:mention', {
        mensajeId: payload.mensajeId,
        usuarioMencionadoId: payload.usuarioMencionadoId,
        usuarioMencionado: payload.usuarioMencionado,
        createdAt: payload.createdAt,
      });
      
      console.log(
        `@mention del grupo ${this.grupoId} emitida al cliente Mobile ${this.socket.id}`,
      );
    } catch (error) {
      console.error(`❌ Error al emitir mención en Mobile: ${error}`);
    }
  }

  /**
   * Retorna el ID del socket del cliente
   * Útil para debugging y limpieza de suscriptores
   */
  getSocketId(): string {
    return this.socket.id;
  }

  /**
   * Retorna el ID del grupo asociado
   */
  getGrupoId(): string {
    return this.grupoId;
  }
}
