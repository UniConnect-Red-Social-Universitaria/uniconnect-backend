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
            const grupoId = req.params.id || req.params.grupoId || req.body?.grupoId;
            const resultado = await messageUseCases.enviarMensajeGrupo(
                req.usuario,
                grupoId,
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
            const grupoId = req.params.id || req.params.grupoId;
            const resultado = await messageUseCases.obtenerHistorialGrupo(
                req.usuario,
                grupoId,
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

    // ==================== REACCIONES ====================

    static async agregarReaccion(req: Request, res: Response) {
        try {
            const mensajeId = req.params.mensajeId;
            const { emoji } = req.body;
            const esGrupo = req.body?.esGrupo ?? true; // Por defecto true para compatibilidad

            const resultado = await messageUseCases.agregarReaccion(
                req.usuario,
                mensajeId,
                emoji,
                esGrupo
            );

            console.log(
                `😊 Reacción agregada | Usuario: ${req.usuario?.id} | Mensaje: ${mensajeId} | Emoji: ${emoji}`
            );

            return res.status(201).json({
                success: true,
                message: resultado.message,
                data: resultado.data
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al agregar reacción');
        }
    }

    static async removerReaccion(req: Request, res: Response) {
        try {
            const mensajeId = req.params.mensajeId;
            const { emoji } = req.body;
            const esGrupo = req.body?.esGrupo ?? true; // Por defecto true para compatibilidad

            const resultado = await messageUseCases.removerReaccion(
                req.usuario,
                mensajeId,
                emoji,
                esGrupo
            );

            console.log(
                `❌ Reacción removida | Usuario: ${req.usuario?.id} | Mensaje: ${mensajeId} | Emoji: ${emoji}`
            );

            return res.json({
                success: true,
                message: resultado.message
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al remover reacción');
        }
    }

    static async obtenerReacciones(req: Request, res: Response) {
        try {
            const mensajeId = req.params.mensajeId;
            const esGrupo = req.query.esGrupo === 'true'; // Parámetro de query

            const resultado = await messageUseCases.obtenerReacciones(
                req.usuario,
                mensajeId,
                esGrupo
            );

            return res.json({
                success: true,
                data: resultado.data
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al obtener reacciones');
        }
    }

    // ==================== MENCIONES ====================

    static async obtenerMencionesPendientes(req: Request, res: Response) {
        try {
            const resultado = await messageUseCases.obtenerMencionesPendientes(req.usuario);

            return res.json({
                success: true,
                data: resultado.data
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al obtener menciones pendientes');
        }
    }
}
