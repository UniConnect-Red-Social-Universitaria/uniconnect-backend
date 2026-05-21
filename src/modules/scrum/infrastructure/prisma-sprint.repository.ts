/**
 * Repository para Sprint
 * Implementación con Prisma
 */

import prisma from '../../../lib/prisma';
import {
  SprintRecord,
  SprintRepository,
  CreateSprintDTO,
  UpdateSprintDTO,
  EstadoSprint,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class PrismaSprintRepository implements SprintRepository {
  async create(data: CreateSprintDTO): Promise<SprintRecord> {
    try {
      const sprint = await prisma.sprint.create({
        data: {
          numero: data.numero,
          nombre: data.nombre,
          descripcion: data.descripcion,
          velocidadPlaneada: data.velocidadPlaneada || 0,
          estado: 'PLANEACION' as EstadoSprint,
        },
      });

      return this.mapToRecord(sprint);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ApplicationError(409, `Ya existe un sprint con número ${data.numero}`);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<SprintRecord | null> {
    const sprint = await prisma.sprint.findUnique({
      where: { id },
    });

    return sprint ? this.mapToRecord(sprint) : null;
  }

  async findByNumero(numero: number): Promise<SprintRecord | null> {
    const sprint = await prisma.sprint.findFirst({
      where: { numero },
    });

    return sprint ? this.mapToRecord(sprint) : null;
  }

  async findAll(): Promise<SprintRecord[]> {
    const sprints = await prisma.sprint.findMany({
      orderBy: { numero: 'asc' },
    });

    return sprints.map((s) => this.mapToRecord(s));
  }

  async findActivos(): Promise<SprintRecord[]> {
    const sprints = await prisma.sprint.findMany({
      where: {
        estado: {
          in: ['PLANEACION', 'ACTIVO'] as EstadoSprint[],
        },
      },
      orderBy: { numero: 'asc' },
    });

    return sprints.map((s) => this.mapToRecord(s));
  }

  async update(id: string, data: UpdateSprintDTO): Promise<SprintRecord> {
    const sprint = await prisma.sprint.update({
      where: { id },
      data: {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.descripcion && { descripcion: data.descripcion }),
        ...(data.estado && { estado: data.estado }),
        ...(data.fechaInicio && { fechaInicio: new Date(data.fechaInicio) }),
        ...(data.fechaFin && { fechaFin: new Date(data.fechaFin) }),
        ...(typeof data.velocidadPlaneada === 'number' && { velocidadPlaneada: data.velocidadPlaneada }),
      },
    });

    return this.mapToRecord(sprint);
  }

  async delete(id: string): Promise<void> {
    await prisma.sprint.delete({
      where: { id },
    });
  }

  private mapToRecord(data: any): SprintRecord {
    return {
      id: data.id,
      numero: data.numero,
      nombre: data.nombre,
      descripcion: data.descripcion,
      estado: data.estado as EstadoSprint,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      velocidadPlaneada: data.velocidadPlaneada,
      velocidadReal: data.velocidadReal,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
