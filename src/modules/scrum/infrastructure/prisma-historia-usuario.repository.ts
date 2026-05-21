/**
 * Repository para Historia Usuario
 * Implementación con Prisma
 */

import prisma from '../../../lib/prisma';
import {
  HistoriaUsuarioRecord,
  HistoriaUsuarioRepository,
  CreateHistoriaUsuarioDTO,
  UpdateHistoriaUsuarioDTO,
  EstadoHU,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class PrismaHistoriaUsuarioRepository implements HistoriaUsuarioRepository {
  async create(sprintId: string, data: CreateHistoriaUsuarioDTO): Promise<HistoriaUsuarioRecord> {
    // Validar que el sprint existe
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new ApplicationError(404, 'Sprint no encontrado');
    }

    // Validar código único
    const existente = await prisma.historiaUsuario.findFirst({
      where: {
        codigo: data.codigo,
        sprintId,
      },
    });

    if (existente) {
      throw new ApplicationError(409, `Ya existe una HU con código ${data.codigo} en este sprint`);
    }

    const hu = await prisma.historiaUsuario.create({
      data: {
        codigo: data.codigo.toUpperCase(),
        titulo: data.titulo,
        descripcion: data.descripcion,
        storyPoints: data.storyPoints,
        estado: 'PENDIENTE' as EstadoHU,
        prioridad: data.prioridad || 100,
        asignadoA: data.asignadoA,
        sprintId,
      },
    });

    return this.mapToRecord(hu);
  }

  async findById(id: string): Promise<HistoriaUsuarioRecord | null> {
    const hu = await prisma.historiaUsuario.findUnique({
      where: { id },
    });

    return hu ? this.mapToRecord(hu) : null;
  }

  async findByCodigoAndSprint(codigo: string, sprintId: string): Promise<HistoriaUsuarioRecord | null> {
    const hu = await prisma.historiaUsuario.findFirst({
      where: {
        codigo: codigo.toUpperCase(),
        sprintId,
      },
    });

    return hu ? this.mapToRecord(hu) : null;
  }

  async findBySprint(sprintId: string, estado?: EstadoHU): Promise<HistoriaUsuarioRecord[]> {
    const hus = await prisma.historiaUsuario.findMany({
      where: {
        sprintId,
        ...(estado && { estado }),
      },
      orderBy: { prioridad: 'asc' },
    });

    return hus.map((hu) => this.mapToRecord(hu));
  }

  async update(id: string, data: UpdateHistoriaUsuarioDTO): Promise<HistoriaUsuarioRecord> {
    const hu = await prisma.historiaUsuario.update({
      where: { id },
      data: {
        ...(data.titulo && { titulo: data.titulo }),
        ...(data.descripcion && { descripcion: data.descripcion }),
        ...(typeof data.storyPoints === 'number' && { storyPoints: data.storyPoints }),
        ...(data.estado && { estado: data.estado }),
        ...(typeof data.prioridad === 'number' && { prioridad: data.prioridad }),
        ...(data.asignadoA !== undefined && { asignadoA: data.asignadoA }),
      },
    });

    return this.mapToRecord(hu);
  }

  async delete(id: string): Promise<void> {
    await prisma.historiaUsuario.delete({
      where: { id },
    });
  }

  private mapToRecord(data: any): HistoriaUsuarioRecord {
    return {
      id: data.id,
      codigo: data.codigo,
      titulo: data.titulo,
      descripcion: data.descripcion,
      storyPoints: data.storyPoints,
      estado: data.estado as EstadoHU,
      prioridad: data.prioridad,
      asignadoA: data.asignadoA,
      sprintId: data.sprintId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
