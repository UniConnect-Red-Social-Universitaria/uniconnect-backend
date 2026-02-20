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
}
