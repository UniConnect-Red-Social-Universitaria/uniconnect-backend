import { 
    GroupMessageRecord, 
    ReaccionMensajeGrupoRecord, 
    MencionMensajeGrupoRecord 
} from '../../../domain/contracts';

export type {
    GroupMessageRecord,
    MessageGateway,
    MessageRecord,
    MessageRepository,
    ReaccionMensajeGrupoRecord,
    MencionMensajeGrupoRecord
} from '../../../domain/contracts';

/**
 * Interfaz para los observadores del ChatSubject (Patrón Observer)
 * Los observers concretos son WebChatObserver y MobileChatObserver
 */
export interface IChatObserver {
    /**
     * Se invoca cuando se emite un nuevo mensaje en el grupo
     * @param payload Mensaje decorado del grupo con información del emisor
     */
    onNuevoMensajeGrupo(payload: GroupMessageRecord): void;

    /**
     * Se invoca cuando se agrega una reacción a un mensaje
     * @param payload Reacción con información del usuario y emoji
     */
    onReaccionAgregada(payload: ReaccionMensajeGrupoRecord): void;

    /**
     * Se invoca cuando se remueve una reacción de un mensaje
     * @param payload Datos de la reacción removida
     */
    onReaccionRemovida(data: { mensajeId: string; usuarioId: string; emoji: string }): void;

    /**
     * Se invoca cuando se menciona a un usuario
     * @param payload Mención con información
     */
    onMencionar(payload: MencionMensajeGrupoRecord): void;
}