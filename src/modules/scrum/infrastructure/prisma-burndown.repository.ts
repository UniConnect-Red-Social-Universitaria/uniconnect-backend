/**
 * Repository para Burndown Diario
 */

import prisma from '../../../lib/prisma';
import {
  BurndownDiarioRecord,
  BurndownDiarioRepository,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class PrismaBurndownDiarioRepository implements BurndownDiarioRepository {
  async create(data: BurndownDiarioRecord): Promise<BurndownDiarioRecord> {
    // Validar que sprint existe
    const sprint = await prisma.sprint.findUnique({
      where: { id: data.sprintId },
    });

    if (!sprint) {
      throw new ApplicationError(404, 'Sprint no encontrado');
    }

    const burndown = await prisma.burndownDiario.create({
      data: {
        sprintId: data.sprintId,
        fecha: data.fecha,
        dia: data.dia,
        spRestantes: data.spRestantes,
        huCompletadasEnDia: data.huCompletadasEnDia,
        spIdealRestantes: data.spIdealRestantes,
      },
    });

    return this.mapToRecord(burndown);
  }

  async findBySprint(sprintId: string): Promise<BurndownDiarioRecord[]> {
    const burndowns = await prisma.burndownDiario.findMany({
      where: { sprintId },
      orderBy: { dia: 'asc' },
    });

    return burndowns.map((b) => this.mapToRecord(b));
  }

  async findBySprintAndFecha(sprintId: string, fecha: Date): Promise<BurndownDiarioRecord | null> {
    const burndown = await prisma.burndownDiario.findUnique({
      where: {
        sprintId_fecha: {
          sprintId,
          fecha,
        },
      },
    });

    return burndown ? this.mapToRecord(burndown) : null;
  }

  async update(id: string, data: Partial<BurndownDiarioRecord>): Promise<BurndownDiarioRecord> {
    const burndown = await prisma.burndownDiario.update({
      where: { id },
      data: {
        ...(typeof data.spRestantes === 'number' && { spRestantes: data.spRestantes }),
        ...(typeof data.huCompletadasEnDia === 'number' && { huCompletadasEnDia: data.huCompletadasEnDia }),
        ...(typeof data.spIdealRestantes === 'number' && { spIdealRestantes: data.spIdealRestantes }),
      },
    });

    return this.mapToRecord(burndown);
  }

  private mapToRecord(data: any): BurndownDiarioRecord {
    return {
      id: data.id,
      sprintId: data.sprintId,
      fecha: data.fecha,
      dia: data.dia,
      spRestantes: data.spRestantes,
      huCompletadasEnDia: data.huCompletadasEnDia,
      spIdealRestantes: data.spIdealRestantes,
      huIds: data.huIds || [],
      createdAt: data.createdAt,
    };
  }
}
