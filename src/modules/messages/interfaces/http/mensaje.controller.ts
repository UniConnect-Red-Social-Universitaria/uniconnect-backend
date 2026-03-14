import { Request, Response } from 'express';

import { messageUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class MensajeController {
    static async enviarMensaje(req: Request, res: Response) {
        try {
            const resultado = await messageUseCases.enviarMensaje(
                req.usuario,
                req.body?.receptorId,
                req.body?.contenido
            );

            console.log(
                `💬 Mensaje 1:1 | ${resultado.data.emisorId} -> ${resultado.data.receptorId} | ${resultado.data.contenido}`
            );

            return res.status(201).json({
                success: true,
                message: resultado.message,
                data: resultado.data
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al enviar mensaje');
        }
    }

    static async obtenerHistorial(req: Request, res: Response) {
        try {
            const resultado = await messageUseCases.obtenerHistorial(
                req.usuario,
                req.params.companeroId,
                req.query.limit
            );

            return res.json({
                success: true,
                data: resultado.data
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al obtener historial de mensajes');
        }
    }

    static async enviarMensajeGrupo(req: Request, res: Response) {
        try {
            const resultado = await messageUseCases.enviarMensajeGrupo(
                req.usuario,
                req.body?.grupoId,
                req.body?.contenido
            );

            console.log(
                `👥 Mensaje grupo | ${resultado.data.emisorId} -> ${resultado.data.grupoId} | ${resultado.data.contenido}`
            );

            return res.status(201).json({
                success: true,
                message: resultado.message,
                data: resultado.data
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al enviar mensaje al grupo');
        }
    }

    static async obtenerHistorialGrupo(req: Request, res: Response) {
        try {
            const resultado = await messageUseCases.obtenerHistorialGrupo(
                req.usuario,
                req.params.grupoId,
                req.query.limit
            );

            return res.json({
                success: true,
                data: resultado.data
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al obtener historial del grupo');
        }
    }
}
