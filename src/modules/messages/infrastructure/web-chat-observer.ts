import { Socket } from 'socket.io';
import { GroupMessageRecord, ReaccionMensajeGrupoRecord, MencionMensajeGrupoRecord } from '../../../domain/contracts';
import { IChatObserver } from '../domain/contracts';

/**
 * WebChatObserver - Observer concreto para clientes Web
 * 
 * Responsabilidad: Emitir mensajes de grupo, reacciones y menciones a través de WebSocket
 * 
 * Detalles:
 * - Sabe cómo comunicarse con clientes Web (Socket.IO)
 * - Se registra en ChatSubject cuando el cliente se conecta a un grupo
 * - Se desregistra cuando el cliente se desconecta
 * - Recibe notificaciones del ChatSubject y las emite por WebSocket
 */
export class WebChatObserver implements IChatObserver {
  /**
   * @param socket Socket.IO del cliente conectado
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
      // Emitir el mensaje al cliente Web a través del socket
      // El evento 'grupo:mensaje:nuevo' se escucha en el cliente
      this.socket.emit('grupo:mensaje:nuevo', payload);
      
      console.log(
        `📤 Mensaje del grupo ${this.grupoId} emitido al cliente Web ${this.socket.id}`,
      );
    } catch (error) {
      console.error(
        `❌ Error al emitir mensaje de grupo al cliente Web: ${error}`,
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
        `😊 Reacción del grupo ${this.grupoId} emitida al cliente Web ${this.socket.id}`,
      );
    } catch (error) {
      console.error(`❌ Error al emitir reacción agregada: ${error}`);
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
        `❌ Reacción removida del grupo ${this.grupoId} emitida al cliente Web ${this.socket.id}`,
      );
    } catch (error) {
      console.error(`❌ Error al emitir reacción removida: ${error}`);
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
        `@mention del grupo ${this.grupoId} emitida al cliente Web ${this.socket.id}`,
      );
    } catch (error) {
      console.error(`❌ Error al emitir mención: ${error}`);
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
