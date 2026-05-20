/**
 * Use Cases para Historia Usuario
 */

import {
  AuthenticatedUser,
  HistoriaUsuarioRepository,
  CreateHistoriaUsuarioDTO,
  UpdateHistoriaUsuarioDTO,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class HistoriaUsuarioUseCases {
  constructor(private huRepository: HistoriaUsuarioRepository) {}

  async crearHU(
    usuario: AuthenticatedUser | undefined,
    sprintId: unknown,
    codigo: unknown,
    titulo: unknown,
    descripcion: unknown,
    storyPoints: unknown,
    prioridad: unknown,
  ) {
    this.ensureAuthenticated(usuario);

    if (typeof sprintId !== 'string' || !sprintId.trim()) {
      throw new ApplicationError(400, 'Sprint ID requerido');
    }

    if (typeof codigo !== 'string' || !codigo.trim()) {
      throw new ApplicationError(400, 'Código de HU requerido (ej: HU-001)');
    }

    if (typeof titulo !== 'string' || !titulo.trim()) {
      throw new ApplicationError(400, 'Título de HU requerido');
    }

    if (typeof descripcion !== 'string' || !descripcion.trim()) {
      throw new ApplicationError(400, 'Descripción de HU requerida');
    }

    if (typeof storyPoints !== 'number' || storyPoints <= 0) {
      throw new ApplicationError(400, 'Story points debe ser mayor a 0');
    }

    const hu = await this.huRepository.create(sprintId, {
      codigo: codigo.trim().toUpperCase(),
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      storyPoints,
      prioridad: typeof prioridad === 'number' ? prioridad : 100,
    });

    return {
      message: 'Historia de usuario creada correctamente',
      data: hu,
    };
  }

  async obtenerHU(usuario: AuthenticatedUser | undefined, huId: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof huId !== 'string' || !huId.trim()) {
      throw new ApplicationError(400, 'ID de HU requerido');
    }

    const hu = await this.huRepository.findById(huId);
    if (!hu) {
      throw new ApplicationError(404, 'Historia de usuario no encontrada');
    }

    return { data: hu };
  }

  async listarHUsPorSprint(usuario: AuthenticatedUser | undefined, sprintId: unknown, estado: unknown = undefined) {
    this.ensureAuthenticated(usuario);

    if (typeof sprintId !== 'string' || !sprintId.trim()) {
      throw new ApplicationError(400, 'Sprint ID requerido');
    }

    const hus = await this.huRepository.findBySprint(
      sprintId,
      typeof estado === 'string' ? (estado as any) : undefined,
    );

    return { data: hus };
  }

  async actualizarHU(usuario: AuthenticatedUser | undefined, huId: unknown, updates: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof huId !== 'string' || !huId.trim()) {
      throw new ApplicationError(400, 'ID de HU requerido');
    }

    const hu = await this.huRepository.findById(huId);
    if (!hu) {
      throw new ApplicationError(404, 'Historia de usuario no encontrada');
    }

    if (typeof updates !== 'object' || !updates) {
      throw new ApplicationError(400, 'Datos de actualización requeridos');
    }

    const huActualizado = await this.huRepository.update(huId, updates as UpdateHistoriaUsuarioDTO);

    return {
      message: 'Historia de usuario actualizada correctamente',
      data: huActualizado,
    };
  }

  async cambiarEstado(usuario: AuthenticatedUser | undefined, huId: unknown, nuevoEstado: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof huId !== 'string' || !huId.trim()) {
      throw new ApplicationError(400, 'ID de HU requerido');
    }

    const estadosValidos = ['PENDIENTE', 'EN_PROGRESO', 'BLOQUEADA', 'COMPLETADA', 'CANCELADA'];
    if (typeof nuevoEstado !== 'string' || !estadosValidos.includes(nuevoEstado)) {
      throw new ApplicationError(400, `Estado inválido. Válidos: ${estadosValidos.join(', ')}`);
    }

    const hu = await this.huRepository.findById(huId);
    if (!hu) {
      throw new ApplicationError(404, 'Historia de usuario no encontrada');
    }

    const huActualizado = await this.huRepository.update(huId, {
      estado: nuevoEstado as any,
    });

    return {
      message: `Historia de usuario marcada como ${nuevoEstado}`,
      data: huActualizado,
    };
  }

  async asignarHU(usuario: AuthenticatedUser | undefined, huId: unknown, usuarioIdAsignado: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof huId !== 'string' || !huId.trim()) {
      throw new ApplicationError(400, 'ID de HU requerido');
    }

    if (usuarioIdAsignado !== null && (typeof usuarioIdAsignado !== 'string' || !usuarioIdAsignado.trim())) {
      throw new ApplicationError(400, 'ID de usuario asignado inválido');
    }

    const hu = await this.huRepository.findById(huId);
    if (!hu) {
      throw new ApplicationError(404, 'Historia de usuario no encontrada');
    }

    const huActualizado = await this.huRepository.update(huId, {
      asignadoA: usuarioIdAsignado as string | undefined,
    });

    return {
      message: 'Historia de usuario asignada correctamente',
      data: huActualizado,
    };
  }

  private ensureAuthenticated(usuario: AuthenticatedUser | undefined) {
    if (!usuario) {
      throw new ApplicationError(401, 'Usuario no autenticado');
    }
  }
}
