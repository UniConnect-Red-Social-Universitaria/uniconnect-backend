/**
 * Repository para Impedimento
 */

import prisma from '../../../lib/prisma';
import {
  ImpedimentoRecord,
  ImpedimentoRepository,
  CreateImpedimentoDTO,
  EstadoImpedimento,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class PrismaImpedimentoRepository implements ImpedimentoRepository {
  async create(data: CreateImpedimentoDTO): Promise<ImpedimentoRecord> {
    const impedimento = await prisma.impedimento.create({
      data: {
        descripcion: data.descripcion,
        estado: (data.estado || 'ABIERTO') as EstadoImpedimento,
        responsable: data.responsable,
        sprintId: data.sprintId,
        esCritico: false,
        diasAbierto: 0,
      },
    });

    return this.mapToRecord(impedimento);
  }

  async findById(id: string): Promise<ImpedimentoRecord | null> {
    const impedimento = await prisma.impedimento.findUnique({
      where: { id },
    });

    return impedimento ? this.mapToRecord(impedimento) : null;
  }

  async findAbiertos(): Promise<ImpedimentoRecord[]> {
    const impedimentos = await prisma.impedimento.findMany({
      where: {
        estado: {
          in: ['ABIERTO', 'EN_PROGRESO'] as EstadoImpedimento[],
        },
      },
      orderBy: { fechaApertura: 'asc' },
    });

    return impedimentos.map((i) => this.mapToRecord(i));
  }

  async findCriticos(): Promise<ImpedimentoRecord[]> {
    const impedimentos = await prisma.impedimento.findMany({
      where: { esCritico: true },
      orderBy: { fechaApertura: 'asc' },
    });

    return impedimentos.map((i) => this.mapToRecord(i));
  }

  async findBySprint(sprintId: string): Promise<ImpedimentoRecord[]> {
    const impedimentos = await prisma.impedimento.findMany({
      where: { sprintId },
      orderBy: { fechaApertura: 'desc' },
    });

    return impedimentos.map((i) => this.mapToRecord(i));
  }

  async update(id: string, data: Partial<ImpedimentoRecord>): Promise<ImpedimentoRecord> {
    const impedimento = await prisma.impedimento.update({
      where: { id },
      data: {
        ...(data.descripcion && { descripcion: data.descripcion }),
        ...(data.estado && { estado: data.estado }),
        ...(typeof data.esCritico === 'boolean' && { esCritico: data.esCritico }),
        ...(typeof data.diasAbierto === 'number' && { diasAbierto: data.diasAbierto }),
        ...(data.responsable !== undefined && { responsable: data.responsable }),
        ...(data.fechaResolucion && { fechaResolucion: data.fechaResolucion }),
      },
    });

    return this.mapToRecord(impedimento);
  }

  async marcarComoCritico(id: string): Promise<void> {
    await prisma.impedimento.update({
      where: { id },
      data: { esCritico: true },
    });
  }

  private mapToRecord(data: any): ImpedimentoRecord {
    return {
      id: data.id,
      sprintId: data.sprintId,
      descripcion: data.descripcion,
      estado: data.estado as EstadoImpedimento,
      esCritico: data.esCritico,
      diasAbierto: data.diasAbierto,
      responsable: data.responsable,
      fechaApertura: data.fechaApertura,
      fechaResolucion: data.fechaResolucion,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
