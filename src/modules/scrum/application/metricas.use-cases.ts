/**
 * Use Cases para Métricas Scrum
 * Cálculos de velocidad, burn-down, cumplimiento, etc
 */

import {
  AuthenticatedUser,
  SprintRepository,
  HistoriaUsuarioRepository,
  VelocidadSprintRepository,
  BurndownDiarioRepository,
  CriterioAceptacionRepository,
  EvaluacionCriterioRepository,
  MetricasSprintResponseDTO,
  BurndownChartDataDTO,
} from '../domain/scrum-contracts';
import { ApplicationError } from '../../../shared/application-error';

export class MetricasUseCases {
  constructor(
    private sprintRepository: SprintRepository,
    private huRepository: HistoriaUsuarioRepository,
    private velocidadRepository: VelocidadSprintRepository,
    private burndownRepository: BurndownDiarioRepository,
    private criterioRepository: CriterioAceptacionRepository,
    private evaluacionRepository: EvaluacionCriterioRepository,
  ) {}

  async calcularMetricasSprint(
    usuario: AuthenticatedUser | undefined,
    sprintId: unknown,
  ): Promise<{ data: MetricasSprintResponseDTO }> {
    this.ensureAuthenticated(usuario);

    if (typeof sprintId !== 'string' || !sprintId.trim()) {
      throw new ApplicationError(400, 'Sprint ID requerido');
    }

    const sprint = await this.sprintRepository.findById(sprintId);
    if (!sprint) {
      throw new ApplicationError(404, 'Sprint no encontrado');
    }

    const hus = await this.huRepository.findBySprint(sprintId);

    const huCompletadas = hus.filter((hu) => hu.estado === 'COMPLETADA').length;
    const huEnProgreso = hus.filter((hu) => hu.estado === 'EN_PROGRESO').length;
    const huBloqueadas = hus.filter((hu) => hu.estado === 'BLOQUEADA').length;

    const velocidadReal = hus
      .filter((hu) => hu.estado === 'COMPLETADA')
      .reduce((sum, hu) => sum + hu.storyPoints, 0);

    const porcentajeCumplimiento = sprint.velocidadPlaneada > 0
      ? (velocidadReal / sprint.velocidadPlaneada) * 100
      : 0;

    const metricas: MetricasSprintResponseDTO = {
      sprintId,
      numero: sprint.numero,
      velocidadPlaneada: sprint.velocidadPlaneada,
      velocidadReal,
      porcentajeCumplimiento: Math.round(porcentajeCumplimiento * 100) / 100,
      huTotales: hus.length,
      huCompletadas,
      huEnProgreso,
      huBloqueadas,
    };

    // Calcular promedio de los últimos 3 sprints
    try {
      const ultimasVelocidades = await this.velocidadRepository.findLast(3);
      const promedio =
        ultimasVelocidades.length > 0
          ? ultimasVelocidades.reduce((sum, v) => sum + v.velocidadReal, 0) / ultimasVelocidades.length
          : undefined;
      metricas.promedio3Sprints = promedio ? Math.round(promedio * 100) / 100 : undefined;
    } catch (error) {
      // Si falla, simplemente no incluimos el promedio
    }

    return { data: metricas };
  }

  async calcularBurndown(usuario: AuthenticatedUser | undefined, sprintId: unknown): Promise<{ data: BurndownChartDataDTO }> {
    this.ensureAuthenticated(usuario);

    if (typeof sprintId !== 'string' || !sprintId.trim()) {
      throw new ApplicationError(400, 'Sprint ID requerido');
    }

    const sprint = await this.sprintRepository.findById(sprintId);
    if (!sprint) {
      throw new ApplicationError(404, 'Sprint no encontrado');
    }

    if (!sprint.fechaInicio) {
      throw new ApplicationError(400, 'El sprint debe estar iniciado para calcular burn-down');
    }

    const burndownDatos = await this.burndownRepository.findBySprint(sprintId);
    const hus = await this.huRepository.findBySprint(sprintId);

    // Calcular SP completados
    const spCompletados = hus
      .filter((hu) => hu.estado === 'COMPLETADA')
      .reduce((sum, hu) => sum + hu.storyPoints, 0);

    const data: BurndownChartDataDTO = {
      sprintId,
      dias: burndownDatos.map((bd) => ({
        dia: bd.dia,
        fecha: bd.fecha,
        spRestantesReal: bd.spRestantes,
        spRestantesIdeal: bd.spIdealRestantes,
        huCompletadas: bd.huCompletadasEnDia,
      })),
      totalSpPlaneados: sprint.velocidadPlaneada,
      spCompletados,
      proyeccionFinal: this.proyectarFinalizacion(burndownDatos, hus.length),
    };

    return { data };
  }

  async calcularCumplimientoGlobalSprint(usuario: AuthenticatedUser | undefined, sprintId: unknown) {
    this.ensureAuthenticated(usuario);

    if (typeof sprintId !== 'string' || !sprintId.trim()) {
      throw new ApplicationError(400, 'Sprint ID requerido');
    }

    const hus = await this.huRepository.findBySprint(sprintId);

    let totalCriterios = 0;
    let criteriosCumplidos = 0;

    for (const hu of hus) {
      const criterios = await this.criterioRepository.findByHU(hu.id);
      totalCriterios += criterios.length;

      for (const criterio of criterios) {
        const evaluacion = await this.evaluacionRepository.findLatest(criterio.id);
        if (evaluacion && evaluacion.cumplido) {
          criteriosCumplidos++;
        }
      }
    }

    const porcentaje = totalCriterios > 0 ? (criteriosCumplidos / totalCriterios) * 100 : 0;

    return {
      data: {
        sprintId,
        criteriosTotales: totalCriterios,
        criteriosCumplidos,
        porcentajeCumplimiento: Math.round(porcentaje * 100) / 100,
      },
    };
  }

  async calcularVelocidadHistorica(usuario: AuthenticatedUser | undefined) {
    this.ensureAuthenticated(usuario);

    const ultimasVelocidades = await this.velocidadRepository.findLast(10);

    return {
      data: ultimasVelocidades.map((v) => ({
        sprintId: v.sprintId,
        velocidadPlaneada: v.velocidadPlaneada,
        velocidadReal: v.velocidadReal,
        porcentajeCumplimiento: v.porcentajeCumplimiento,
      })),
    };
  }

  private proyectarFinalizacion(burndownDatos: any[], totalHUs: number): number {
    // Simple proyección: si no hay cambios, cuándo terminaríamos?
    if (burndownDatos.length < 2) {
      return totalHUs;
    }

    const últimos = burndownDatos.slice(-3);
    const velocidadPromedio = últimos.reduce((sum, bd) => sum + bd.huCompletadasEnDia, 0) / últimos.length;

    if (velocidadPromedio === 0) {
      return totalHUs;
    }

    const huPendientes = últimos[últimos.length - 1]?.huIds?.length || 0;
    return Math.ceil(huPendientes / velocidadPromedio);
  }

  private ensureAuthenticated(usuario: AuthenticatedUser | undefined) {
    if (!usuario) {
      throw new ApplicationError(401, 'Usuario no autenticado');
    }
  }
}
