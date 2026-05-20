/**
 * Controller para Métricas
 */

import { Request, Response } from 'express';
import { metricasUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class MetricasController {
  static async calcularMetricas(req: Request, res: Response) {
    try {
      const resultado = await metricasUseCases.calcularMetricasSprint(req.usuario, req.params.sprintId);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al calcular métricas');
    }
  }

  static async calcularBurndown(req: Request, res: Response) {
    try {
      const resultado = await metricasUseCases.calcularBurndown(req.usuario, req.params.sprintId);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al calcular burn-down');
    }
  }

  static async calcularCumplimiento(req: Request, res: Response) {
    try {
      const resultado = await metricasUseCases.calcularCumplimientoGlobalSprint(req.usuario, req.params.sprintId);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al calcular cumplimiento');
    }
  }

  static async velocidadHistorica(req: Request, res: Response) {
    try {
      const resultado = await metricasUseCases.calcularVelocidadHistorica(req.usuario);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener velocidad histórica');
    }
  }
}
