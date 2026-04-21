import { Request, Response } from 'express';

import { materiaUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class MateriaController {
    static async crear(req: Request, res: Response) {
        try {
            const resultado = await materiaUseCases.crear(req.body?.nombre);

            return res.status(201).json({
                success: true,
                message: resultado.message,
                data: resultado.data
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al crear materia');
        }
    }

    static async listar(_req: Request, res: Response) {
        try {
            const resultado = await materiaUseCases.listar();

            return res.json({
                success: true,
                data: resultado.data
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al listar materias');
        }
    }

    static async buscar(req: Request, res: Response) {
        try {
            const resultado = await materiaUseCases.buscar(req.query.q);

            return res.json({
                success: true,
                data: resultado.data
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al buscar materias');
        }
    }
}
