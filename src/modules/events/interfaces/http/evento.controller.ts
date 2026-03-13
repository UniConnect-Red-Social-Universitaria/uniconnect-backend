import { Request, Response } from 'express';

import { eventUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class EventoController {
    static async crear(req: Request, res: Response) {
        try {
            const resultado = await eventUseCases.crear(
                req.usuario,
                req.body?.titulo,
                req.body?.descripcion,
                req.body?.fechaEvento
            );

            return res.status(201).json({
                success: true,
                message: resultado.message,
                data: resultado.data
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al crear evento');
        }
    }

    static async listarGlobal(req: Request, res: Response) {
        try {
            const resultado = await eventUseCases.listarGlobal();

            return res.json({
                success: true,
                data: resultado.data
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al listar eventos');
        }
    }
}
