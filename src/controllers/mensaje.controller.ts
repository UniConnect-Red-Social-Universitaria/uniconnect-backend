import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { emitirMensajeGrupoTiempoReal, emitirMensajeTiempoReal } from '../lib/socket';
import { MensajeService } from '../services/mensaje.service';
import { ServiceError } from '../services/service-error';

export class MensajeController {
    static async enviarMensajeGrupo(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const body = req.body as Record<string, unknown>;
            const mensaje = await MensajeService.enviarMensajeGrupo(req.usuario.id, body.grupoId, body.contenido);

            console.log(`💬 Mensaje grupal | grupo:${mensaje.grupoId} | emisor:${mensaje.emisorId}`);

            emitirMensajeGrupoTiempoReal(mensaje);

            return res.status(201).json({
                success: true,
                message: 'Mensaje grupal enviado correctamente',
                data: mensaje
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                return res.status(400).json({
                    success: false,
                    message: 'grupoId tiene formato inválido'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al enviar mensaje grupal',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async obtenerHistorialGrupo(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { grupoId } = req.params;
            const mensajes = await MensajeService.obtenerHistorialGrupo(req.usuario.id, grupoId, req.query.limit);

            return res.status(200).json({
                success: true,
                data: mensajes
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                return res.status(400).json({
                    success: false,
                    message: 'grupoId tiene formato inválido'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al obtener historial grupal',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async enviarMensaje(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const body = req.body as Record<string, unknown>;
            const mensaje = await MensajeService.enviarMensaje(req.usuario.id, body.receptorId, body.contenido);

            console.log(
                `💬 Mensaje 1:1 | ${mensaje.emisorId} -> ${mensaje.receptorId} | ${mensaje.contenido}`
            );

            emitirMensajeTiempoReal(mensaje);

            return res.status(201).json({
                success: true,
                message: 'Mensaje enviado correctamente',
                data: mensaje
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                return res.status(400).json({
                    success: false,
                    message: 'receptorId tiene formato inválido'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al enviar mensaje',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async obtenerHistorial(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { companeroId } = req.params;
            const mensajes = await MensajeService.obtenerHistorial(req.usuario.id, companeroId, req.query.limit);

            return res.status(200).json({
                success: true,
                data: mensajes
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                return res.status(400).json({
                    success: false,
                    message: 'companeroId tiene formato inválido'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error al obtener historial de mensajes',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
