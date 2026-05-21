/**
 * Controller para Trazabilidad
 */

import { Request, Response } from 'express';
import { trazabilidadUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class TrazabilidadController {
  static async linkear(req: Request, res: Response) {
    try {
      const resultado = await trazabilidadUseCases.linkearHUConCommit(req.usuario, req.body);

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al crear trazabilidad');
    }
  }

  static async obtenerDeHU(req: Request, res: Response) {
    try {
      const resultado = await trazabilidadUseCases.obtenerTrazabilidadDeHU(req.usuario, req.params.huId);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener trazabilidad');
    }
  }

  static async listarPorRepositorio(req: Request, res: Response) {
    try {
      const resultado = await trazabilidadUseCases.listarTrazabilidadesPorRepositorio(
        req.usuario,
        req.params.repositorio,
      );

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar trazabilidades');
    }
  }

  static async buscarPorCommit(req: Request, res: Response) {
    try {
      const resultado = await trazabilidadUseCases.buscarHUPorCommit(
        req.usuario,
        req.query.sha,
        req.query.repositorio,
      );

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al buscar HU por commit');
    }
  }
}
