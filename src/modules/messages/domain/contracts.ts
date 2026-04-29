import { GroupMessageRecord } from '../../../domain/contracts';

export type {
    GroupMessageRecord,
    MessageGateway,
    MessageRecord,
    MessageRepository,
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
}