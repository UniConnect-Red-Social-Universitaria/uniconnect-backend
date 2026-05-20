/**
 * Repository para Criterio Aceptacion
 */

import prisma from '../../../lib/prisma';
import {
  CriterioAceptacionRecord,
  CriterioAceptacionRepository,
  CreateCriterioAceptacionDTO,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class PrismaCriterioAceptacionRepository implements CriterioAceptacionRepository {
  async create(huId: string, data: CreateCriterioAceptacionDTO): Promise<CriterioAceptacionRecord> {
    // Validar que la HU existe
    const hu = await prisma.historiaUsuario.findUnique({
      where: { id: huId },
    });

    if (!hu) {
      throw new ApplicationError(404, 'Historia de usuario no encontrada');
    }

    // Validar número único por HU
    const existente = await prisma.criterioAceptacion.findFirst({
      where: {
        huId,
        numero: data.numero,
      },
    });

    if (existente) {
      throw new ApplicationError(409, `Ya existe criterio #${data.numero} para esta HU`);
    }

    const criterio = await prisma.criterioAceptacion.create({
      data: {
        numero: data.numero,
        descripcion: data.descripcion,
        huId,
      },
    });

    return this.mapToRecord(criterio);
  }

  async findByHU(huId: string): Promise<CriterioAceptacionRecord[]> {
    const criterios = await prisma.criterioAceptacion.findMany({
      where: { huId },
      orderBy: { numero: 'asc' },
    });

    return criterios.map((c) => this.mapToRecord(c));
  }

  async findById(id: string): Promise<CriterioAceptacionRecord | null> {
    const criterio = await prisma.criterioAceptacion.findUnique({
      where: { id },
    });

    return criterio ? this.mapToRecord(criterio) : null;
  }

  async delete(id: string): Promise<void> {
    await prisma.criterioAceptacion.delete({
      where: { id },
    });
  }

  private mapToRecord(data: any): CriterioAceptacionRecord {
    return {
      id: data.id,
      numero: data.numero,
      descripcion: data.descripcion,
      huId: data.huId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
