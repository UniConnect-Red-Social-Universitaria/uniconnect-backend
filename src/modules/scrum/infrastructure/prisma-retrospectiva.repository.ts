/**
 * Repository para Retrospectiva
 */

import prisma from '../../../lib/prisma';
import {
  RetrospectivaRecord,
  RetrospectivaRepository,
  CreateRetrospectivaDTO,
  AccuerdoRetroRecord,
  ImpedimentoRetroRecord,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class PrismaRetrospectivaRepository implements RetrospectivaRepository {
  async create(sprintId: string, data: CreateRetrospectivaDTO): Promise<RetrospectivaRecord> {
    // Validar que sprint existe
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new ApplicationError(404, 'Sprint no encontrado');
    }

    const retrospectiva = await prisma.retrospectiva.create({
      data: {
        sprintId,
        fechaRetrospectiva: new Date(data.fechaRetrospectiva),
        comentariosGenerales: data.comentariosGenerales,
      },
      include: {
        acuerdos: true,
        impedimentos: true,
      },
    });

    return this.mapToRecord(retrospectiva);
  }

  async findBySprint(sprintId: string): Promise<RetrospectivaRecord | null> {
    const retrospectiva = await prisma.retrospectiva.findUnique({
      where: { sprintId },
      include: {
        acuerdos: true,
        impedimentos: true,
      },
    });

    return retrospectiva ? this.mapToRecord(retrospectiva) : null;
  }

  async createAcuerdo(
    retroId: string,
    acuerdo: Omit<AccuerdoRetroRecord, 'id' | 'retroId' | 'createdAt' | 'updatedAt'>,
  ): Promise<AccuerdoRetroRecord> {
    const acuerdoCreado = await prisma.accuerdoRetro.create({
      data: {
        retroId,
        descripcion: acuerdo.descripcion,
        responsable: acuerdo.responsable,
        estado: acuerdo.estado || 'PENDIENTE',
      },
    });

    return this.mapAcuerdoToRecord(acuerdoCreado);
  }

  async createImpedimento(
    retroId: string,
    impedimento: Omit<ImpedimentoRetroRecord, 'id' | 'retroId' | 'createdAt' | 'updatedAt'>,
  ): Promise<ImpedimentoRetroRecord> {
    const impedimentoCreado = await prisma.impedimentoRetro.create({
      data: {
        retroId,
        descripcion: impedimento.descripcion,
        impacto: impedimento.impacto,
        responsable: impedimento.responsable,
        estado: impedimento.estado || 'ABIERTO',
      },
    });

    return this.mapImpedimentoToRecord(impedimentoCreado);
  }

  private mapToRecord(data: any): RetrospectivaRecord {
    return {
      id: data.id,
      sprintId: data.sprintId,
      fechaRetrospectiva: data.fechaRetrospectiva,
      comentariosGenerales: data.comentariosGenerales,
      acuerdos: data.acuerdos.map((a: any) => this.mapAcuerdoToRecord(a)),
      impedimentos: data.impedimentos.map((i: any) => this.mapImpedimentoToRecord(i)),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private mapAcuerdoToRecord(data: any): AccuerdoRetroRecord {
    return {
      id: data.id,
      retroId: data.retroId,
      descripcion: data.descripcion,
      responsable: data.responsable,
      estado: data.estado,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private mapImpedimentoToRecord(data: any): ImpedimentoRetroRecord {
    return {
      id: data.id,
      retroId: data.retroId,
      descripcion: data.descripcion,
      impacto: data.impacto,
      responsable: data.responsable,
      estado: data.estado,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
