import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { isTokenRevoked } from './token-blacklist';
import { GrupoModel } from '../models/grupo.model';
import { chatSubject } from '../container';
import { WebChatObserver } from '../modules/messages/infrastructure/web-chat-observer';
import { MobileChatObserver } from '../modules/messages/infrastructure/mobile-chat-observer';
import { PollBroadcastRecord } from '../domain/contracts';

export type RoomType = 'usuario' | 'grupo';

export function roomName(tipo: RoomType, id: string): string {
    return `${tipo}:${id}`;
}

export interface SocketServerToClientEvents {
    'mensaje:nuevo': (payload: unknown) => void;
    'mensaje:enviado': (payload: unknown) => void;
    'grupo:mensaje:nuevo': (payload: unknown) => void;
    'evento:nuevo:categoria': (payload: unknown) => void;
    'notificacion:nueva': (payload: unknown) => void;
    'encuesta:nueva': (payload: PollBroadcastRecord) => void;
    'encuesta:actualizada': (payload: PollBroadcastRecord) => void;
    'contacto:solicitud:nueva': (payload: unknown) => void;
    'contacto:solicitud:rechazada': (payload: unknown) => void;
    'grupo:solicitud:nueva': (payload: unknown) => void;
    'grupo:solicitud:resuelta': (payload: unknown) => void;
    'grupo:admin:transferido': (payload: unknown) => void;
    'grupo:admin:transferencia_pendiente': (payload: unknown) => void;
    'grupo:admin:transferencia_aceptada': (payload: unknown) => void;
    'grupo:admin:transferencia_rechazada': (payload: unknown) => void;
    'grupo:admin:transferencia_cancelada': (payload: unknown) => void;
    'mensaje:reaccion:agregada': (payload: unknown) => void;
    'mensaje:reaccion:removida': (payload: unknown) => void;
    'mensaje:mencion': (payload: unknown) => void;
}

export interface SocketClientToServerEvents {
    'grupo:suscribir': (grupoId: string) => void;
    'grupo:desuscribir': (grupoId: string) => void;
}

export interface SocketData {
    usuarioId?: string;
}

interface TokenPayload {
    id: string;
    correo: string;
    nombre: string;
}

let ioInstance: Server<SocketClientToServerEvents, SocketServerToClientEvents, Record<string, never>, SocketData> | null = null;

/**
 * Mapa que almacena los observers de chat por socketId
 * Esto permite desuscribir al observer cuando el cliente se desconecta
 */
const chatObserversBySocket = new Map<string, { grupoId: string; observer: WebChatObserver | MobileChatObserver }[]>();

export function inicializarSocket(server: HttpServer) {
    const io = new Server<SocketClientToServerEvents, SocketServerToClientEvents, Record<string, never>, SocketData>(server, {
        cors: {
            origin: '*'
        }
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token as string | undefined;

            if (!token) {
                return next(new Error('Token no proporcionado'));
            }

            if (isTokenRevoked(token)) {
                return next(new Error('Token revocado'));
            }

            if (!process.env.JWT_SECRET) {
                return next(new Error('JWT_SECRET no configurado'));
            }

            const payload = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
            socket.data.usuarioId = payload.id;
            next();
        } catch {
            next(new Error('Token inválido'));
        }
    });

    io.on('connection', (socket) => {
        const usuarioId = socket.data.usuarioId;

        if (usuarioId) {
            socket.join(roomName('usuario', usuarioId));
            GrupoModel.listarPorUsuario(usuarioId)
                .then((grupos) => {
                    grupos.forEach((grupo) => {
                        socket.join(roomName('grupo', grupo.id));

                        // Registrar el observer en ChatSubject
                        registrarObserverGrupo(socket, grupo.id);
                    });
                })
                .catch((error) => {
                    console.error('Error al suscribir salas de grupo:', error);
                });

            console.log(`🔌 Usuario conectado al chat: ${usuarioId}`);
        }

        socket.on('disconnect', () => {
            if (usuarioId) {
                // Desuscribir todos los observers cuando el cliente se desconecta
                desuscribirObserversDelSocket(socket);
                console.log(`❌ Usuario desconectado del chat: ${usuarioId}`);
            }
        });

        /**
         * Evento opcional: permitir que el cliente se suscriva manualmente a un grupo específico
         * Útil para casos donde el usuario se une a un grupo después de conectarse
         */
        socket.on('grupo:suscribir', (grupoId: string) => {
            if (typeof grupoId === 'string' && grupoId.trim()) {
                socket.join(roomName('grupo', grupoId.trim()));
                registrarObserverGrupo(socket, grupoId.trim());
                console.log(`✅ Cliente ${socket.id} suscrito al grupo ${grupoId}`);
            }
        });

        /**
         * Evento opcional: permitir que el cliente se desuscriba manualmente de un grupo
         */
        socket.on('grupo:desuscribir', (grupoId: string) => {
            if (typeof grupoId === 'string' && grupoId.trim()) {
                socket.leave(roomName('grupo', grupoId.trim()));
                desuscribirObserverGrupo(socket, grupoId.trim());
                console.log(`✅ Cliente ${socket.id} desuscrito del grupo ${grupoId}`);
            }
        });
    });

    ioInstance = io;
    return io;
}

/**
 * Registra un observer en ChatSubject para que el cliente reciba mensajes de un grupo
 * Distingue entre clientes Web y Mobile
 * 
 * @param socket Socket.IO del cliente
 * @param grupoId ID del grupo
 */
function registrarObserverGrupo(socket: Socket, grupoId: string): void {
    try {
        // Detectar si es cliente Web o Mobile
        // Se puede pasar en handshake.auth.platform o asumir Web por defecto
        const platform = (socket.handshake.auth.platform as string) || 'web';

        let observer: WebChatObserver | MobileChatObserver;

        if (platform.toLowerCase() === 'mobile') {
            observer = new MobileChatObserver(socket, grupoId);
        } else {
            observer = new WebChatObserver(socket, grupoId);
        }

        // Suscribir el observer en ChatSubject
        chatSubject.suscribir(grupoId, observer);

        // Guardar referencia para desuscribir después
        if (!chatObserversBySocket.has(socket.id)) {
            chatObserversBySocket.set(socket.id, []);
        }
        chatObserversBySocket.get(socket.id)!.push({ grupoId, observer });

    } catch (error) {
        console.error(
            `❌ Error al registrar observer para socket ${socket.id} en grupo ${grupoId}: ${error}`,
        );
    }
}

/**
 * Desuscribe un observer específico de un grupo cuando el cliente se desconecta
 * 
 * @param socket Socket.IO del cliente
 * @param grupoId ID del grupo
 */
function desuscribirObserverGrupo(socket: Socket, grupoId: string): void {
    try {
        const observers = chatObserversBySocket.get(socket.id) || [];
        const index = observers.findIndex((o) => o.grupoId === grupoId);

        if (index !== -1) {
            const { observer } = observers[index];
            chatSubject.desuscribir(grupoId, observer);
            observers.splice(index, 1);
        }
    } catch (error) {
        console.error(
            `❌ Error al desuscribir observer para socket ${socket.id} del grupo ${grupoId}: ${error}`,
        );
    }
}

/**
 * Desuscribe todos los observers de un socket cuando el cliente se desconecta
 * Previene fugas de memoria
 * 
 * @param socket Socket.IO del cliente desconectado
 */
function desuscribirObserversDelSocket(socket: Socket): void {
    try {
        const observers = chatObserversBySocket.get(socket.id) || [];

        observers.forEach(({ grupoId, observer }) => {
            chatSubject.desuscribir(grupoId, observer);
        });

        chatObserversBySocket.delete(socket.id);
    } catch (error) {
        console.error(
            `❌ Error al desuscribir observers del socket ${socket.id}: ${error}`,
        );
    }
}

export function emitirMensajeTiempoReal(payload: {
    id: string;
    contenido: string;
    emisorId: string;
    receptorId: string;
    createdAt: Date;
    emisor?: {
        id: string;
        nombre: string;
        apellido: string;
    };
}) {
    if (!ioInstance) {
        return;
    }

    ioInstance.to(roomName('usuario', payload.receptorId)).emit('mensaje:nuevo', payload);
    ioInstance.to(roomName('usuario', payload.emisorId)).emit('mensaje:enviado', payload);
}

export function emitirMensajeGrupoTiempoReal(payload: {
    id: string;
    contenido: string;
    grupoId: string;
    nombreGrupo?: string;
    emisorId: string;
    createdAt: Date;
    emisor?: {
        id: string;
        nombre: string;
        apellido: string;
    };
}) {
    if (!ioInstance) {
        return;
    }

    ioInstance.to(roomName('grupo', payload.grupoId)).emit('grupo:mensaje:nuevo', payload);
}

export function emitirReaccionTiempoReal(receptorId: string, payload: any) {
    if (!ioInstance) return;
    ioInstance.to(roomName('usuario', receptorId)).emit('mensaje:reaccion:agregada', payload);
}

export function emitirReaccionRemovidaTiempoReal(receptorId: string, payload: any) {
    if (!ioInstance) return;
    ioInstance.to(roomName('usuario', receptorId)).emit('mensaje:reaccion:removida', payload);
}

export function emitirMencionTiempoReal(receptorId: string, payload: any) {
    if (!ioInstance) return;
    ioInstance.to(roomName('usuario', receptorId)).emit('mensaje:mencion', payload);
}

export function emitirEventoNuevoPorCategoria(usuarioId: string, evento: object) {
    if (!ioInstance) {
        return;
    }

    ioInstance.to(roomName('usuario', usuarioId)).emit('evento:nuevo:categoria', evento);
}

export function emitirNotificacion(destinatario: string, datos: object) {
    if (!ioInstance) {
        return;
    }

    ioInstance.to(roomName('usuario', destinatario)).emit('notificacion:nueva', datos);
}

export function emitirNotificacionGrupo(grupoId: string, datos: object) {
    if (!ioInstance) {
        return;
    }

    ioInstance.to(roomName('grupo', grupoId)).emit('notificacion:nueva', datos);
}

export function emitirEncuestaGrupoTiempoReal(payload: PollBroadcastRecord) {
    if (!ioInstance) {
        return;
    }

    ioInstance.to(roomName('grupo', payload.grupoId)).emit('encuesta:nueva', payload);
}

export function emitirEncuestaActualizadaGrupoTiempoReal(payload: PollBroadcastRecord) {
    if (!ioInstance) {
        return;
    }

    ioInstance.to(roomName('grupo', payload.grupoId)).emit('encuesta:actualizada', payload);
}

export function emitirSolicitudContactoTiempoReal(payload: {
    solicitudId: string;
    receptorId: string;
    solicitanteId: string;
    solicitanteNombre: string;
    solicitanteApellido?: string;
    createdAt?: Date;
}) {
    if (!ioInstance) {
        return;
    }

    ioInstance
        .to(roomName('usuario', payload.receptorId))
        .emit('contacto:solicitud:nueva', payload);
}

export function emitirSolicitudContactoRechazadaTiempoReal(payload: {
    solicitudId: string;
    solicitanteId: string;
    receptorId: string;
    receptorNombre?: string;
    receptorApellido?: string;
    updatedAt?: Date;
}) {
    if (!ioInstance) {
        return;
    }

    ioInstance
        .to(roomName('usuario', payload.solicitanteId))
        .emit('contacto:solicitud:rechazada', payload);
}

// ── Eventos de grupo ──

export function emitirSolicitudGrupoNueva(payload: {
    solicitudId: string;
    grupoId: string;
    grupoNombre: string;
    administradorId: string;
    solicitanteId: string;
    solicitanteNombre: string;
    solicitanteApellido?: string;
}) {
    if (!ioInstance) {
        return;
    }

    ioInstance
        .to(roomName('usuario', payload.administradorId))
        .emit('grupo:solicitud:nueva', payload);
}

export function emitirSolicitudGrupoResuelta(payload: {
    solicitudId: string;
    grupoId: string;
    grupoNombre: string;
    solicitanteId: string;
    estado: 'APROBADA' | 'RECHAZADA';
}) {
    if (!ioInstance) {
        return;
    }

    ioInstance
        .to(roomName('usuario', payload.solicitanteId))
        .emit('grupo:solicitud:resuelta', payload);
}

export function emitirTransferenciaAdmin(payload: {
    grupoId: string;
    grupoNombre: string;
    anteriorAdminId: string;
    anteriorAdminNombre: string;
    nuevoAdminId: string;
    nuevoAdminNombre: string;
}) {
    if (!ioInstance) {
        return;
    }

    ioInstance
        .to(roomName('usuario', payload.nuevoAdminId))
        .emit('grupo:admin:transferido', payload);

    ioInstance
        .to(roomName('usuario', payload.anteriorAdminId))
        .emit('grupo:admin:transferido', payload);
}

export function emitirTransferenciaPendiente(payload: {
    grupoId: string;
    grupoNombre: string;
    adminId: string;
    candidatoId: string;
    candidatoNombre: string;
    nuevoEstado: string;
}) {
    if (!ioInstance) {
        return;
    }
    ioInstance
        .to(roomName('usuario', payload.candidatoId))
        .emit('grupo:admin:transferencia_pendiente', payload);
}

export function emitirTransferenciaAceptada(payload: {
    grupoId: string;
    grupoNombre: string;
    anteriorAdminId: string;
    nuevoAdminId: string;
    nuevoAdminNombre: string;
    nuevoEstado: string;
}) {
    if (!ioInstance) {
        return;
    }
    ioInstance
        .to(roomName('usuario', payload.anteriorAdminId))
        .emit('grupo:admin:transferencia_aceptada', payload);
    ioInstance
        .to(roomName('usuario', payload.nuevoAdminId))
        .emit('grupo:admin:transferencia_aceptada', payload);
}

export function emitirTransferenciaRechazada(payload: {
    grupoId: string;
    grupoNombre: string;
    adminId: string;
    candidatoId: string;
    candidatoNombre: string;
    nuevoEstado: string;
}) {
    if (!ioInstance) {
        return;
    }
    ioInstance
        .to(roomName('usuario', payload.adminId))
        .emit('grupo:admin:transferencia_rechazada', payload);
}

export function emitirTransferenciaCancelada(payload: {
    grupoId: string;
    grupoNombre: string;
    adminId: string;
    candidatoId: string;
    nuevoEstado: string;
}) {
    if (!ioInstance) {
        return;
    }
    ioInstance
        .to(roomName('usuario', payload.candidatoId))
        .emit('grupo:admin:transferencia_cancelada', payload);
}
