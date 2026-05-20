/**
 * Use Cases para Criterio Aceptacion y Evaluaciones
 */

import {
  AuthenticatedUser,
  CriterioAceptacionRepository,
  EvaluacionCriterioRepository,
  CreateCriterioAceptacionDTO,
  CreateEvaluacionCriterioDTO,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class CriterioAceptacionUseCases {
  constructor(
    private criterioRepository: CriterioAceptacionRepository,
    private evaluacionRepository: EvaluacionCriterioRepository,
  ) {}

  async crearCriterio(
    usuario: AuthenticatedUser | undefined,
    huId: unknown,
    numero: unknown,
    descripcion: unknown,
  ) {
    this.ensureAuthenticated(usuario);

    if (typeof huId !== 'string' || !huId.trim()) {
      throw new ApplicationError(400, 'ID de HU requerido');
    }

    if (typeof numero !== 'number' || numero <= 0) {
      throw new ApplicationError(400, 'Número de criterio debe ser mayor a 0');
    }

    if (typeof descripcion !== 'string' || !descripcion.trim()) {
      throw new ApplicationError(400, 'Descripción del criterio requerida');
    }

    const criterio = await this.criterioRepository.create(huId, {
      numero,
      descripcion: descripcion.trim(),
    });

    return {
      message: 'Criterio de aceptación creado correctamente',
      data: criterio,
    };
  }

  async listarCriteriosDeHU(usuario: AuthenticatedUser | undefined, huId: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof huId !== 'string' || !huId.trim()) {
      throw new ApplicationError(400, 'ID de HU requerido');
    }

    const criterios = await this.criterioRepository.findByHU(huId);

    return { data: criterios };
  }

  async evaluarCriterio(
    usuario: AuthenticatedUser | undefined,
    criterioId: unknown,
    cumplido: unknown,
    observaciones: unknown,
  ) {
    this.ensureAuthenticated(usuario);

    if (typeof criterioId !== 'string' || !criterioId.trim()) {
      throw new ApplicationError(400, 'ID de criterio requerido');
    }

    if (typeof cumplido !== 'boolean') {
      throw new ApplicationError(400, 'Cumplido debe ser un booleano');
    }

    const evaluacion = await this.evaluacionRepository.create(criterioId, {
      cumplido,
      observaciones: typeof observaciones === 'string' ? observaciones.trim() : undefined,
      evaluador: usuario!.id,
      fechaEvaluacion: new Date().toISOString(),
    });

    return {
      message: 'Criterio evaluado correctamente',
      data: evaluacion,
    };
  }

  async obtenerHistorialEvaluaciones(usuario: AuthenticatedUser | undefined, criterioId: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof criterioId !== 'string' || !criterioId.trim()) {
      throw new ApplicationError(400, 'ID de criterio requerido');
    }

    const evaluaciones = await this.evaluacionRepository.findByCriterio(criterioId);

    return { data: evaluaciones };
  }

  async obtenerEvaluacionMasReciente(usuario: AuthenticatedUser | undefined, criterioId: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof criterioId !== 'string' || !criterioId.trim()) {
      throw new ApplicationError(400, 'ID de criterio requerido');
    }

    const evaluacion = await this.evaluacionRepository.findLatest(criterioId);

    if (!evaluacion) {
      throw new ApplicationError(404, 'No hay evaluaciones para este criterio');
    }

    return { data: evaluacion };
  }

  async calcularCumplimientoPorHU(usuario: AuthenticatedUser | undefined, huId: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof huId !== 'string' || !huId.trim()) {
      throw new ApplicationError(400, 'ID de HU requerido');
    }

    const criterios = await this.criterioRepository.findByHU(huId);

    if (criterios.length === 0) {
      return {
        data: {
          cumplidos: 0,
          total: 0,
          porcentaje: 0,
        },
      };
    }

    let cumplidos = 0;

    for (const criterio of criterios) {
      const evaluacion = await this.evaluacionRepository.findLatest(criterio.id);
      if (evaluacion && evaluacion.cumplido) {
        cumplidos++;
      }
    }

    const porcentaje = (cumplidos / criterios.length) * 100;

    return {
      data: {
        cumplidos,
        total: criterios.length,
        porcentaje: Math.round(porcentaje * 100) / 100,
      },
    };
  }

  private ensureAuthenticated(usuario: AuthenticatedUser | undefined) {
    if (!usuario) {
      throw new ApplicationError(401, 'Usuario no autenticado');
    }
  }
}
