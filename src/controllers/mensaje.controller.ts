import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { MensajeModel } from '../models/mensaje.model';
import { UsuarioModel } from '../models/usuario.model';
import { ContactoModel } from '../models/contacto.model';
import { emitirMensajeTiempoReal } from '../lib/socket';

export class MensajeController {
    static async enviarMensaje(req: Request, res: Response) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const { receptorId, contenido } = req.body;

            if (typeof receptorId !== 'string' || !receptorId.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar un receptorId válido'
                });
            }

            if (typeof contenido !== 'string' || !contenido.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar un contenido de mensaje válido'
                });
            }

            if (receptorId.trim() === req.usuario.id) {
                return res.status(400).json({
                    success: false,
                    message: 'No puedes enviarte mensajes a ti mismo'
                });
            }

            const receptor = await UsuarioModel.buscarPorId(receptorId.trim());

            if (!receptor) {
                return res.status(404).json({
                    success: false,
                    message: 'El receptor no existe'
                });
            }

            const relacion = await ContactoModel.existeRelacionEntreUsuarios(req.usuario.id, receptorId.trim());

            if (!relacion || relacion.estado !== 'ACEPTADA') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo puedes chatear con compañeros agregados'
                });
            }

            const mensaje = await MensajeModel.crear({
                contenido: contenido.trim(),
                emisorId: req.usuario.id,
                receptorId: receptorId.trim()
            });

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
            const limitQuery = Number(req.query.limit ?? 50);
            const limit = Number.isInteger(limitQuery) && limitQuery > 0 && limitQuery <= 200
                ? limitQuery
                : 50;

            if (typeof companeroId !== 'string' || !companeroId.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar un companeroId válido'
                });
            }

            if (companeroId.trim() === req.usuario.id) {
                return res.status(400).json({
                    success: false,
                    message: 'No puedes consultar conversación contigo mismo'
                });
            }

            const companero = await UsuarioModel.buscarPorId(companeroId.trim());

            if (!companero) {
                return res.status(404).json({
                    success: false,
                    message: 'El compañero no existe'
                });
            }

            const relacion = await ContactoModel.existeRelacionEntreUsuarios(req.usuario.id, companeroId.trim());

            if (!relacion || relacion.estado !== 'ACEPTADA') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo puedes consultar chats con compañeros agregados'
                });
            }

            const mensajes = await MensajeModel.obtenerConversacion(req.usuario.id, companeroId.trim(), limit);

            return res.json({
                success: true,
                data: mensajes
            });
        } catch (error) {
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
