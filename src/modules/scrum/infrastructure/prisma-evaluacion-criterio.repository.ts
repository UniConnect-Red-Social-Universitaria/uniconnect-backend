/**
 * Repository para Evaluacion Criterio
 */

import prisma from '../../../lib/prisma';
import {
  EvaluacionCriterioRecord,
  EvaluacionCriterioRepository,
  CreateEvaluacionCriterioDTO,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class PrismaEvaluacionCriterioRepository implements EvaluacionCriterioRepository {
  async create(criterioId: string, data: CreateEvaluacionCriterioDTO): Promise<EvaluacionCriterioRecord> {
    // Validar que el criterio existe
    const criterio = await prisma.criterioAceptacion.findUnique({
      where: { id: criterioId },
    });

    if (!criterio) {
      throw new ApplicationError(404, 'Criterio de aceptación no encontrado');
    }

    const evaluacion = await prisma.evaluacionCriterio.create({
      data: {
        criterioId,
        cumplido: data.cumplido,
        observaciones: data.observaciones,
        evaluador: data.evaluador,
        fechaEvaluacion: new Date(data.fechaEvaluacion),
      },
    });

    return this.mapToRecord(evaluacion);
  }

  async findByCriterio(criterioId: string): Promise<EvaluacionCriterioRecord[]> {
    const evaluaciones = await prisma.evaluacionCriterio.findMany({
      where: { criterioId },
      orderBy: { fechaEvaluacion: 'desc' },
    });

    return evaluaciones.map((e) => this.mapToRecord(e));
  }

  async findLatest(criterioId: string): Promise<EvaluacionCriterioRecord | null> {
    const evaluacion = await prisma.evaluacionCriterio.findFirst({
      where: { criterioId },
      orderBy: { fechaEvaluacion: 'desc' },
    });

    return evaluacion ? this.mapToRecord(evaluacion) : null;
  }

  private mapToRecord(data: any): EvaluacionCriterioRecord {
    return {
      id: data.id,
      criterioId: data.criterioId,
      cumplido: data.cumplido,
      observaciones: data.observaciones,
      evaluador: data.evaluador,
      fechaEvaluacion: data.fechaEvaluacion,
      createdAt: data.createdAt,
    };
  }
}
