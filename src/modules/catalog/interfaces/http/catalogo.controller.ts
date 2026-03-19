import { Request, Response } from 'express';

import { catalogUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class CatalogoController {
    static async poblar(req: Request, res: Response) {
        try {
            const resultado = await catalogUseCases.poblar();

            return res.status(200).json({
                success: true,
                message: resultado.message,
                data: resultado.data
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al poblar catálogos');
        }
    }

    static async listar(req: Request, res: Response) {
        try {
            const resultado = await catalogUseCases.listar();

            return res.json({
                success: true,
                data: resultado.data
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al listar catálogos');
        }
    }
}
