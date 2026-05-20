/**
 * Repository para Trazabilidad HU
 */

import prisma from '../../../lib/prisma';
import {
  TrazabilidadHURecord,
  TrazabilidadHURepository,
  TipoRepositorio,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class PrismaTrazabilidadHURepository implements TrazabilidadHURepository {
  async create(data: TrazabilidadHURecord): Promise<TrazabilidadHURecord> {
    // Validar que HU existe
    const hu = await prisma.historiaUsuario.findUnique({
      where: { id: data.huId },
    });

    if (!hu) {
      throw new ApplicationError(404, 'Historia de usuario no encontrada');
    }

    try {
      const trazabilidad = await prisma.trazabilidadHU.create({
        data: {
          huId: data.huId,
          repositorio: data.repositorio,
          nombreRepositorio: data.nombreRepositorio,
          shaCommit: data.shaCommit,
          urlCommit: data.urlCommit,
          mensajeCommit: data.mensajeCommit,
          autorCommit: data.autorCommit,
          numeroPR: data.numeroPR,
          urlPR: data.urlPR,
          estadoPR: data.estadoPR,
          numeroDespliegue: data.numeroDespliegue,
          urlDespliegue: data.urlDespliegue,
          estadoDespliegue: data.estadoDespliegue,
          extraido: data.extraido || new Date(),
        },
      });

      return this.mapToRecord(trazabilidad);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ApplicationError(409, 'Esta trazabilidad ya existe');
      }
      throw error;
    }
  }

  async findByHU(huId: string): Promise<TrazabilidadHURecord[]> {
    const trazas = await prisma.trazabilidadHU.findMany({
      where: { huId },
      orderBy: { createdAt: 'desc' },
    });

    return trazas.map((t) => this.mapToRecord(t));
  }

  async findByCommit(sha: string, repositorio: TipoRepositorio): Promise<TrazabilidadHURecord | null> {
    const traza = await prisma.trazabilidadHU.findFirst({
      where: {
        shaCommit: sha,
        repositorio,
      },
    });

    return traza ? this.mapToRecord(traza) : null;
  }

  async findByRepositorio(repositorio: TipoRepositorio): Promise<TrazabilidadHURecord[]> {
    const trazas = await prisma.trazabilidadHU.findMany({
      where: { repositorio },
      orderBy: { extraido: 'desc' },
    });

    return trazas.map((t) => this.mapToRecord(t));
  }

  private mapToRecord(data: any): TrazabilidadHURecord {
    return {
      id: data.id,
      huId: data.huId,
      repositorio: data.repositorio as TipoRepositorio,
      nombreRepositorio: data.nombreRepositorio,
      shaCommit: data.shaCommit,
      urlCommit: data.urlCommit,
      mensajeCommit: data.mensajeCommit,
      autorCommit: data.autorCommit,
      numeroPR: data.numeroPR,
      urlPR: data.urlPR,
      estadoPR: data.estadoPR,
      numeroDespliegue: data.numeroDespliegue,
      urlDespliegue: data.urlDespliegue,
      estadoDespliegue: data.estadoDespliegue,
      extraido: data.extraido,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
