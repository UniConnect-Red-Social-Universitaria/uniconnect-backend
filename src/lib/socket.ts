import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { isTokenRevoked } from './token-blacklist';
import { GrupoModel } from '../models/grupo.model';
import { chatSubject } from '../container';
import { WebChatObserver } from '../modules/messages/infrastructure/web-chat-observer';
import { MobileChatObserver } from '../modules/messages/infrastructure/mobile-chat-observer';

interface TokenPayload {
    id: string;
    correo: string;
    nombre: string;
}

let ioInstance: Server | null = null;

/**
 * Mapa que almacena los observers de chat por socketId
 * Esto permite desuscribir al observer cuando el cliente se desconecta
 */
const chatObserversBySocket = new Map<string, { grupoId: string; observer: WebChatObserver | MobileChatObserver }[]>();

export function inicializarSocket(server: HttpServer) {
    const io = new Server(server, {
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
        const usuarioId = socket.data.usuarioId as string;

        if (usuarioId) {
            socket.join(`usuario:${usuarioId}`);
            GrupoModel.listarPorUsuario(usuarioId)
                .then((grupos) => {
                    grupos.forEach((grupo) => {
                        socket.join(`grupo:${grupo.id}`);
                        
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
                socket.join(`grupo:${grupoId}`);
                registrarObserverGrupo(socket, grupoId.trim());
                console.log(`✅ Cliente ${socket.id} suscrito al grupo ${grupoId}`);
            }
        });

        /**
         * Evento opcional: permitir que el cliente se desuscriba manualmente de un grupo
         */
        socket.on('grupo:desuscribir', (grupoId: string) => {
            if (typeof grupoId === 'string' && grupoId.trim()) {
                socket.leave(`grupo:${grupoId}`);
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

    ioInstance.to(`usuario:${payload.receptorId}`).emit('mensaje:nuevo', payload);
    ioInstance.to(`usuario:${payload.emisorId}`).emit('mensaje:enviado', payload);
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

    ioInstance.to(`grupo:${payload.grupoId}`).emit('grupo:mensaje:nuevo', payload);
}

export function emitirEventoNuevoPorCategoria(usuarioId: string, evento: object) {
    if (!ioInstance) {
        return;
    }

    ioInstance.to(`usuario:${usuarioId}`).emit('evento:nuevo:categoria', evento);
}

export function emitirNotificacion(destinatario: string, datos: object) {
    if (!ioInstance) {
        return;
    }

    ioInstance.to(`usuario:${destinatario}`).emit('notificacion:nueva', datos);
}

export function emitirNotificacionGrupo(grupoId: string, datos: object) {
    if (!ioInstance) {
        return;
    }

    ioInstance.to(`grupo:${grupoId}`).emit('notificacion:nueva', datos);
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
        .to(`usuario:${payload.receptorId}`)
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
        .to(`usuario:${payload.solicitanteId}`)
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
        .to(`usuario:${payload.administradorId}`)
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
        .to(`usuario:${payload.solicitanteId}`)
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

    // Notificar al nuevo admin
    ioInstance
        .to(`usuario:${payload.nuevoAdminId}`)
        .emit('grupo:admin:transferido', payload);

    // Notificar al anterior admin
    ioInstance
        .to(`usuario:${payload.anteriorAdminId}`)
        .emit('grupo:admin:transferido', payload);
}
