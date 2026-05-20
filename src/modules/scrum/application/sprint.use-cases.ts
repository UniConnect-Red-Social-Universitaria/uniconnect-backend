/**
 * Use Cases para Sprint
 */

import {
  AuthenticatedUser,
  SprintRepository,
  SprintRecord,
  CreateSprintDTO,
  UpdateSprintDTO,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class SprintUseCases {
  constructor(private sprintRepository: SprintRepository) {}

  async crearSprint(
    usuario: AuthenticatedUser | undefined,
    numero: unknown,
    nombre: unknown,
    descripcion: unknown,
    velocidadPlaneada: unknown,
  ) {
    this.ensureAuthenticated(usuario);

    if (typeof numero !== 'number' || numero <= 0) {
      throw new ApplicationError(400, 'El número del sprint debe ser mayor a 0');
    }

    if (typeof nombre !== 'string' || !nombre.trim()) {
      throw new ApplicationError(400, 'El nombre del sprint es requerido');
    }

    // Validar que no exista sprint con mismo número
    const existe = await this.sprintRepository.findByNumero(numero);
    if (existe) {
      throw new ApplicationError(409, `Ya existe un sprint con número ${numero}`);
    }

    const sprint = await this.sprintRepository.create({
      numero,
      nombre: nombre.trim(),
      descripcion: typeof descripcion === 'string' ? descripcion.trim() : undefined,
      velocidadPlaneada: typeof velocidadPlaneada === 'number' ? velocidadPlaneada : 0,
    });

    return {
      message: 'Sprint creado correctamente',
      data: sprint,
    };
  }

  async obtenerSprint(usuario: AuthenticatedUser | undefined, sprintId: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof sprintId !== 'string' || !sprintId.trim()) {
      throw new ApplicationError(400, 'ID del sprint requerido');
    }

    const sprint = await this.sprintRepository.findById(sprintId);
    if (!sprint) {
      throw new ApplicationError(404, 'Sprint no encontrado');
    }

    return { data: sprint };
  }

  async listarSprints(usuario: AuthenticatedUser | undefined, soloActivos: unknown = false) {
    this.ensureAuthenticated(usuario);

    const sprints = soloActivos === true ? await this.sprintRepository.findActivos() : await this.sprintRepository.findAll();

    return { data: sprints };
  }

  async actualizarSprint(usuario: AuthenticatedUser | undefined, sprintId: unknown, updates: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof sprintId !== 'string' || !sprintId.trim()) {
      throw new ApplicationError(400, 'ID del sprint requerido');
    }

    const sprint = await this.sprintRepository.findById(sprintId);
    if (!sprint) {
      throw new ApplicationError(404, 'Sprint no encontrado');
    }

    if (typeof updates !== 'object' || !updates) {
      throw new ApplicationError(400, 'Datos de actualización requeridos');
    }

    const sprintActualizado = await this.sprintRepository.update(sprintId, updates as UpdateSprintDTO);

    return {
      message: 'Sprint actualizado correctamente',
      data: sprintActualizado,
    };
  }

  async iniciarSprint(usuario: AuthenticatedUser | undefined, sprintId: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof sprintId !== 'string' || !sprintId.trim()) {
      throw new ApplicationError(400, 'ID del sprint requerido');
    }

    const sprint = await this.sprintRepository.findById(sprintId);
    if (!sprint) {
      throw new ApplicationError(404, 'Sprint no encontrado');
    }

    if (sprint.estado !== 'PLANEACION') {
      throw new ApplicationError(400, 'El sprint debe estar en estado PLANEACION para iniciar');
    }

    const sprintActualizado = await this.sprintRepository.update(sprintId, {
      estado: 'ACTIVO',
      fechaInicio: new Date().toISOString(),
    });

    return {
      message: 'Sprint iniciado correctamente',
      data: sprintActualizado,
    };
  }

  async cerrarSprint(usuario: AuthenticatedUser | undefined, sprintId: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof sprintId !== 'string' || !sprintId.trim()) {
      throw new ApplicationError(400, 'ID del sprint requerido');
    }

    const sprint = await this.sprintRepository.findById(sprintId);
    if (!sprint) {
      throw new ApplicationError(404, 'Sprint no encontrado');
    }

    if (sprint.estado !== 'ACTIVO') {
      throw new ApplicationError(400, 'Solo se pueden cerrar sprints en estado ACTIVO');
    }

    const sprintActualizado = await this.sprintRepository.update(sprintId, {
      estado: 'COMPLETADO',
      fechaFin: new Date().toISOString(),
    });

    return {
      message: 'Sprint cerrado correctamente',
      data: sprintActualizado,
    };
  }

  private ensureAuthenticated(usuario: AuthenticatedUser | undefined) {
    if (!usuario) {
      throw new ApplicationError(401, 'Usuario no autenticado');
    }
  }
}
