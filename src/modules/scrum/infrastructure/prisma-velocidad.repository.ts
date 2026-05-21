/**
 * Repository para Velocidad Sprint
 */

import prisma from '../../../lib/prisma';
import {
  VelocidadSprintRecord,
  VelocidadSprintRepository,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class PrismaVelocidadSprintRepository implements VelocidadSprintRepository {
  async create(
    sprintId: string,
    datos: Omit<VelocidadSprintRecord, 'id' | 'sprintId' | 'createdAt' | 'updatedAt'>,
  ): Promise<VelocidadSprintRecord> {
    // Validar que sprint existe
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new ApplicationError(404, 'Sprint no encontrado');
    }

    const velocidad = await prisma.velocidadSprint.create({
      data: {
        sprintId,
        velocidadPlaneada: datos.velocidadPlaneada,
        velocidadReal: datos.velocidadReal,
        porcentajeCumplimiento: datos.porcentajeCumplimiento,
        huCompletadas: datos.huCompletadas,
        huTotales: datos.huTotales,
      },
    });

    return this.mapToRecord(velocidad);
  }

  async findBySprint(sprintId: string): Promise<VelocidadSprintRecord | null> {
    const velocidad = await prisma.velocidadSprint.findUnique({
      where: { sprintId },
    });

    return velocidad ? this.mapToRecord(velocidad) : null;
  }

  async findLast(cantidad: number): Promise<VelocidadSprintRecord[]> {
    const velocidades = await prisma.velocidadSprint.findMany({
      orderBy: { createdAt: 'desc' },
      take: cantidad,
    });

    return velocidades.map((v) => this.mapToRecord(v));
  }

  private mapToRecord(data: any): VelocidadSprintRecord {
    return {
      id: data.id,
      sprintId: data.sprintId,
      velocidadPlaneada: data.velocidadPlaneada,
      velocidadReal: data.velocidadReal,
      porcentajeCumplimiento: data.porcentajeCumplimiento,
      huCompletadas: data.huCompletadas,
      huTotales: data.huTotales,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
