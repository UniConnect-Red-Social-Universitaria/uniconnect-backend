/**
 * Use Cases para Trazabilidad
 */

import {
  AuthenticatedUser,
  TrazabilidadHURepository,
  TrazabilidadHURecord,
  TipoRepositorio,
  TrazabilidadResponseDTO,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class TrazabilidadUseCases {
  constructor(private trazabilidadRepository: TrazabilidadHURepository) {}

  async linkearHUConCommit(usuario: AuthenticatedUser | undefined, data: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof data !== 'object' || !data) {
      throw new ApplicationError(400, 'Datos de trazabilidad requeridos');
    }

    const trazaData = data as any;

    if (!trazaData.huId || typeof trazaData.huId !== 'string') {
      throw new ApplicationError(400, 'HU ID requerido');
    }

    if (!trazaData.repositorio || !['BACKEND', 'FRONTEND'].includes(trazaData.repositorio)) {
      throw new ApplicationError(400, 'Repositorio debe ser BACKEND o FRONTEND');
    }

    if (!trazaData.nombreRepositorio || typeof trazaData.nombreRepositorio !== 'string') {
      throw new ApplicationError(400, 'Nombre de repositorio requerido');
    }

    const traza: TrazabilidadHURecord = {
      id: '', // Se genera en DB
      huId: trazaData.huId,
      repositorio: trazaData.repositorio as TipoRepositorio,
      nombreRepositorio: trazaData.nombreRepositorio,
      shaCommit: trazaData.shaCommit,
      urlCommit: trazaData.urlCommit,
      mensajeCommit: trazaData.mensajeCommit,
      autorCommit: trazaData.autorCommit,
      numeroPR: trazaData.numeroPR,
      urlPR: trazaData.urlPR,
      estadoPR: trazaData.estadoPR,
      numeroDespliegue: trazaData.numeroDespliegue,
      urlDespliegue: trazaData.urlDespliegue,
      estadoDespliegue: trazaData.estadoDespliegue,
      extraido: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const trazabilidad = await this.trazabilidadRepository.create(traza);

    return {
      message: 'Trazabilidad creada correctamente',
      data: trazabilidad,
    };
  }

  async obtenerTrazabilidadDeHU(usuario: AuthenticatedUser | undefined, huId: unknown): Promise<{ data: TrazabilidadResponseDTO }> {
    this.ensureAuthenticated(usuario);

    if (typeof huId !== 'string' || !huId.trim()) {
      throw new ApplicationError(400, 'HU ID requerido');
    }

    const trazas = await this.trazabilidadRepository.findByHU(huId);

    const response: TrazabilidadResponseDTO = {
      huId,
      codigo: '', // Se obtendría de la HU si fuera necesario
      titulo: '',
      trazas: trazas.map((t) => ({
        id: t.id,
        repositorio: t.repositorio,
        nombreRepositorio: t.nombreRepositorio,
        tipoArtefacto: t.numeroPR ? 'PR' : t.numeroDespliegue ? 'DEPLOY' : 'COMMIT',
        enlace: t.urlCommit || t.urlPR || t.urlDespliegue || '',
        referencia: t.shaCommit?.substring(0, 7) || `#${t.numeroPR}` || `Deploy #${t.numeroDespliegue}` || '',
        extraido: t.extraido || t.createdAt,
      })),
    };

    return { data: response };
  }

  async listarTrazabilidadesPorRepositorio(usuario: AuthenticatedUser | undefined, repositorio: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof repositorio !== 'string' || !['BACKEND', 'FRONTEND'].includes(repositorio)) {
      throw new ApplicationError(400, 'Repositorio debe ser BACKEND o FRONTEND');
    }

    const trazas = await this.trazabilidadRepository.findByRepositorio(repositorio as TipoRepositorio);

    return {
      data: trazas.map((t) => ({
        id: t.id,
        huId: t.huId,
        repositorio: t.repositorio,
        nombreRepositorio: t.nombreRepositorio,
        referencia: t.shaCommit?.substring(0, 7) || `#${t.numeroPR}` || '',
        enlace: t.urlCommit || t.urlPR || '',
        extraido: t.extraido || t.createdAt,
      })),
    };
  }

  async buscarHUPorCommit(usuario: AuthenticatedUser | undefined, sha: unknown, repositorio: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof sha !== 'string' || !sha.trim()) {
      throw new ApplicationError(400, 'SHA del commit requerido');
    }

    if (typeof repositorio !== 'string' || !['BACKEND', 'FRONTEND'].includes(repositorio)) {
      throw new ApplicationError(400, 'Repositorio debe ser BACKEND o FRONTEND');
    }

    const traza = await this.trazabilidadRepository.findByCommit(sha, repositorio as TipoRepositorio);

    if (!traza) {
      throw new ApplicationError(404, 'No se encontró HU asociada a este commit');
    }

    return { data: traza };
  }

  private ensureAuthenticated(usuario: AuthenticatedUser | undefined) {
    if (!usuario) {
      throw new ApplicationError(401, 'Usuario no autenticado');
    }
  }
}
