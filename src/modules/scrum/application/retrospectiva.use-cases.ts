/**
 * Use Cases para Retrospectiva
 */

import {
  AuthenticatedUser,
  RetrospectivaRepository,
  CreateRetrospectivaDTO,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class RetrospectivaUseCases {
  constructor(private retroRepository: RetrospectivaRepository) {}

  async crearRetrospectiva(usuario: AuthenticatedUser | undefined, sprintId: unknown, data: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof sprintId !== 'string' || !sprintId.trim()) {
      throw new ApplicationError(400, 'Sprint ID requerido');
    }

    if (typeof data !== 'object' || !data) {
      throw new ApplicationError(400, 'Datos de retrospectiva requeridos');
    }

    const retroData = data as CreateRetrospectivaDTO;

    if (!retroData.fechaRetrospectiva) {
      throw new ApplicationError(400, 'Fecha de retrospectiva requerida');
    }

    const retrospectiva = await this.retroRepository.create(sprintId, retroData);

    return {
      message: 'Retrospectiva creada correctamente',
      data: retrospectiva,
    };
  }

  async obtenerRetrospectiva(usuario: AuthenticatedUser | undefined, sprintId: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof sprintId !== 'string' || !sprintId.trim()) {
      throw new ApplicationError(400, 'Sprint ID requerido');
    }

    const retrospectiva = await this.retroRepository.findBySprint(sprintId);

    if (!retrospectiva) {
      throw new ApplicationError(404, 'Retrospectiva no encontrada para este sprint');
    }

    return { data: retrospectiva };
  }

  async agregarAcuerdo(usuario: AuthenticatedUser | undefined, retroId: unknown, descripcion: unknown, responsable: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof retroId !== 'string' || !retroId.trim()) {
      throw new ApplicationError(400, 'ID de retrospectiva requerido');
    }

    if (typeof descripcion !== 'string' || !descripcion.trim()) {
      throw new ApplicationError(400, 'Descripción de acuerdo requerida');
    }

    const acuerdo = await this.retroRepository.createAcuerdo(retroId, {
      descripcion: descripcion.trim(),
      responsable: typeof responsable === 'string' ? responsable.trim() : undefined,
      estado: 'PENDIENTE',
    });

    return {
      message: 'Acuerdo agregado correctamente',
      data: acuerdo,
    };
  }

  async agregarImpedimento(
    usuario: AuthenticatedUser | undefined,
    retroId: unknown,
    descripcion: unknown,
    impacto: unknown,
    responsable: unknown,
  ) {
    this.ensureAuthenticated(usuario);

    if (typeof retroId !== 'string' || !retroId.trim()) {
      throw new ApplicationError(400, 'ID de retrospectiva requerido');
    }

    if (typeof descripcion !== 'string' || !descripcion.trim()) {
      throw new ApplicationError(400, 'Descripción de impedimento requerida');
    }

    const impedimento = await this.retroRepository.createImpedimento(retroId, {
      descripcion: descripcion.trim(),
      impacto: typeof impacto === 'string' ? impacto : undefined,
      responsable: typeof responsable === 'string' ? responsable.trim() : undefined,
      estado: 'ABIERTO',
    });

    return {
      message: 'Impedimento agregado correctamente',
      data: impedimento,
    };
  }

  private ensureAuthenticated(usuario: AuthenticatedUser | undefined) {
    if (!usuario) {
      throw new ApplicationError(401, 'Usuario no autenticado');
    }
  }
}
