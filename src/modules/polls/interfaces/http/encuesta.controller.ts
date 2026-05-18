import { Request, Response } from 'express';

import { pollUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class EncuestaController {
    static async obtenerDeGrupo(req: Request, res: Response) {
        try {
            const grupoId = req.params.grupoId;
            const resultado = await pollUseCases.obtenerEncuestasDeGrupo(req.usuario, grupoId);

            return res.status(200).json({
                success: true,
                data: resultado.data,
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al obtener las encuestas del grupo');
        }
    }

    static async crearEnGrupo(req: Request, res: Response) {
        try {
            const grupoId = req.params.id || req.params.grupoId || req.body?.grupoId;
            const resultado = await pollUseCases.crearEncuestaEnGrupo(req.usuario, grupoId, {
                pregunta: req.body?.pregunta,
                opciones: req.body?.opciones ?? req.body?.options,
                autoCloseAt: req.body?.autoCloseAt ?? req.body?.fechaCierre,
            });

            return res.status(201).json({
                success: true,
                message: resultado.message,
                data: resultado.data,
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al crear la encuesta');
        }
    }

    static async votar(req: Request, res: Response) {
        try {
            const encuestaId = req.params.id || req.params.encuestaId || req.body?.encuestaId;
            const resultado = await pollUseCases.votarEncuestaEnGrupo(req.usuario, encuestaId, {
                optionId: req.body?.optionId ?? req.body?.opcionId,
            });

            return res.status(200).json({
                success: true,
                message: resultado.message,
                data: resultado.data,
            });
        } catch (error) {
            return handleControllerError(res, error, 'Error al registrar el voto');
        }
    }
}
