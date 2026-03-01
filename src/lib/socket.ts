import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { isTokenRevoked } from './token-blacklist';
import { GrupoModel } from '../models/grupo.model';

interface TokenPayload {
    id: string;
    correo: string;
    nombre: string;
}

let ioInstance: Server | null = null;

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

    io.on('connection', async (socket) => {
        const usuarioId = socket.data.usuarioId as string;

        if (usuarioId) {
            socket.join(`usuario:${usuarioId}`);
            console.log(`🔌 Usuario conectado al chat: ${usuarioId}`);

            try {
                const gruposUsuario = await GrupoModel.obtenerIdsPorUsuario(usuarioId);

                for (const grupoId of gruposUsuario) {
                    socket.join(`grupo:${grupoId}`);
                }

                console.log(`👥 Usuario ${usuarioId} suscrito a ${gruposUsuario.length} grupo(s)`);
            } catch {
                console.log(`⚠️ No se pudieron cargar grupos para ${usuarioId}`);
            }
        }

        socket.on('disconnect', () => {
            if (usuarioId) {
                console.log(`❌ Usuario desconectado del chat: ${usuarioId}`);
            }
        });
    });

    ioInstance = io;
    return io;
}

export function emitirMensajeTiempoReal(payload: {
    id: string;
    contenido: string;
    emisorId: string;
    receptorId: string;
    createdAt: Date;
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
