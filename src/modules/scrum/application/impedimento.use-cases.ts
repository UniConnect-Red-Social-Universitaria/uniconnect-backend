/**
 * Use Cases para Impedimentos
 */

import {
  AuthenticatedUser,
  ImpedimentoRepository,
  CreateImpedimentoDTO,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class ImpedimentoUseCases {
  constructor(private impedimentoRepository: ImpedimentoRepository) {}

  async crearImpedimento(
    usuario: AuthenticatedUser | undefined,
    descripcion: unknown,
    estado: unknown,
    responsable: unknown,
    sprintId: unknown,
  ) {
    this.ensureAuthenticated(usuario);

    if (typeof descripcion !== 'string' || !descripcion.trim()) {
      throw new ApplicationError(400, 'Descripción de impedimento requerida');
    }

    const impedimento = await this.impedimentoRepository.create({
      descripcion: descripcion.trim(),
      estado: typeof estado === 'string' ? (estado as any) : 'ABIERTO',
      responsable: typeof responsable === 'string' ? responsable.trim() : undefined,
      sprintId: typeof sprintId === 'string' ? sprintId.trim() : undefined,
    });

    return {
      message: 'Impedimento creado correctamente',
      data: impedimento,
    };
  }

  async obtenerImpedimento(usuario: AuthenticatedUser | undefined, impedimentoId: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof impedimentoId !== 'string' || !impedimentoId.trim()) {
      throw new ApplicationError(400, 'ID de impedimento requerido');
    }

    const impedimento = await this.impedimentoRepository.findById(impedimentoId);

    if (!impedimento) {
      throw new ApplicationError(404, 'Impedimento no encontrado');
    }

    return { data: impedimento };
  }

  async listarAbiertos(usuario: AuthenticatedUser | undefined) {
    this.ensureAuthenticated(usuario);

    const impedimentos = await this.impedimentoRepository.findAbiertos();

    return { data: impedimentos };
  }

  async listarCriticos(usuario: AuthenticatedUser | undefined) {
    this.ensureAuthenticated(usuario);

    const impedimentos = await this.impedimentoRepository.findCriticos();

    return { data: impedimentos };
  }

  async listarPorSprint(usuario: AuthenticatedUser | undefined, sprintId: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof sprintId !== 'string' || !sprintId.trim()) {
      throw new ApplicationError(400, 'Sprint ID requerido');
    }

    const impedimentos = await this.impedimentoRepository.findBySprint(sprintId);

    return { data: impedimentos };
  }

  async actualizarEstado(usuario: AuthenticatedUser | undefined, impedimentoId: unknown, nuevoEstado: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof impedimentoId !== 'string' || !impedimentoId.trim()) {
      throw new ApplicationError(400, 'ID de impedimento requerido');
    }

    const estadosValidos = ['ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO'];
    if (typeof nuevoEstado !== 'string' || !estadosValidos.includes(nuevoEstado)) {
      throw new ApplicationError(400, `Estado inválido. Válidos: ${estadosValidos.join(', ')}`);
    }

    const impedimento = await this.impedimentoRepository.findById(impedimentoId);
    if (!impedimento) {
      throw new ApplicationError(404, 'Impedimento no encontrado');
    }

    const fechaResolucion = nuevoEstado === 'CERRADO' ? new Date() : undefined;

    const actualizado = await this.impedimentoRepository.update(impedimentoId, {
      estado: nuevoEstado as any,
      fechaResolucion,
    });

    return {
      message: `Impedimento actualizado a estado ${nuevoEstado}`,
      data: actualizado,
    };
  }

  async detectarYMarcarCriticos(usuario: AuthenticatedUser | undefined) {
    this.ensureAuthenticated(usuario);

    const impedimentos = await this.impedimentoRepository.findAbiertos();
    const ahora = new Date();
    let marcados = 0;

    for (const impedimento of impedimentos) {
      // Calcular días hábiles abiertos
      const diasAbiertos = this.calcularDíasHábiles(impedimento.fechaApertura, ahora);

      if (diasAbiertos > 3 && !impedimento.esCritico) {
        await this.impedimentoRepository.marcarComoCritico(impedimento.id);
        marcados++;
      }
    }

    return {
      message: `${marcados} impedimento(s) marcado(s) como crítico(s)`,
      data: {
        marcados,
        total: impedimentos.length,
      },
    };
  }

  private calcularDíasHábiles(fechaInicio: Date, fechaFin: Date): number {
    let dias = 0;
    const fecha = new Date(fechaInicio);

    while (fecha < fechaFin) {
      // 0 = domingo, 6 = sábado
      const diaSemana = fecha.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        dias++;
      }
      fecha.setDate(fecha.getDate() + 1);
    }

    return dias;
  }

  private ensureAuthenticated(usuario: AuthenticatedUser | undefined) {
    if (!usuario) {
      throw new ApplicationError(401, 'Usuario no autenticado');
    }
  }
}
