/**
 * Controller para Exportación (CSV, PDF)
 */

import { Request, Response } from 'express';
import { handleControllerError } from '../../../../shared/controller-error';
import { ApplicationError } from '../../../../shared/application-error';
import { ExportCSVService } from '../../infrastructure/export-csv.service';
import { ExportPDFService } from '../../infrastructure/export-pdf.service';
import {
  historiaUsuarioRepository,
  criterioAceptacionRepository,
  evaluacionCriterioRepository,
  impedimentoRepository,
  sprintRepository,
  metricasUseCases,
} from '../../../../container';

// Instanciar servicios
const csvService = new ExportCSVService(
  historiaUsuarioRepository,
  criterioAceptacionRepository,
  evaluacionCriterioRepository,
  impedimentoRepository,
);

const pdfService = new ExportPDFService(historiaUsuarioRepository);

export class ExportacionController {
  static async exportarHistoriasCSV(req: Request, res: Response) {
    try {
      if (!req.usuario) {
        throw new ApplicationError(401, 'Usuario no autenticado');
      }

      const sprintId = req.params.sprintId;

      if (typeof sprintId !== 'string' || !sprintId.trim()) {
        throw new ApplicationError(400, 'Sprint ID requerido');
      }

      const csv = await csvService.exportarHistorias(sprintId);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="historias-sprint-${sprintId}.csv"`);
      res.send(csv);
    } catch (error) {
      return handleControllerError(res, error, 'Error al exportar historias');
    }
  }

  static async exportarCriteriosCSV(req: Request, res: Response) {
    try {
      if (!req.usuario) {
        throw new ApplicationError(401, 'Usuario no autenticado');
      }

      const sprintId = req.params.sprintId;

      if (typeof sprintId !== 'string' || !sprintId.trim()) {
        throw new ApplicationError(400, 'Sprint ID requerido');
      }

      const csv = await csvService.exportarCriterios(sprintId);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="criterios-sprint-${sprintId}.csv"`);
      res.send(csv);
    } catch (error) {
      return handleControllerError(res, error, 'Error al exportar criterios');
    }
  }

  static async exportarImpedimentosCSV(req: Request, res: Response) {
    try {
      if (!req.usuario) {
        throw new ApplicationError(401, 'Usuario no autenticado');
      }

      const sprintId = req.params.sprintId;

      if (typeof sprintId !== 'string' || !sprintId.trim()) {
        throw new ApplicationError(400, 'Sprint ID requerido');
      }

      const csv = await csvService.exportarImpedimentos(sprintId);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="impedimentos-sprint-${sprintId}.csv"`);
      res.send(csv);
    } catch (error) {
      return handleControllerError(res, error, 'Error al exportar impedimentos');
    }
  }

  static async exportarReportePDF(req: Request, res: Response) {
    try {
      if (!req.usuario) {
        throw new ApplicationError(401, 'Usuario no autenticado');
      }

      const sprintId = req.params.sprintId;

      if (typeof sprintId !== 'string' || !sprintId.trim()) {
        throw new ApplicationError(400, 'Sprint ID requerido');
      }

      // Obtener sprint
      const sprint = await sprintRepository.findById(sprintId);
      if (!sprint) {
        throw new ApplicationError(404, 'Sprint no encontrado');
      }

      // Obtener métricas
      const metricas = await metricasUseCases.calcularMetricasSprint(req.usuario, sprintId);

      // Generar PDF
      const pdfBuffer = await pdfService.generarReporteSprint(sprintId, sprint.numero, metricas.data, {
        incluirTrazabilidad: req.query.trazabilidad === 'true',
        incluirRetrospectiva: req.query.retrospectiva === 'true',
        incluirImpedimentos: req.query.impedimentos === 'true',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-sprint-${sprint.numero}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      return handleControllerError(res, error, 'Error al generar PDF');
    }
  }
}
