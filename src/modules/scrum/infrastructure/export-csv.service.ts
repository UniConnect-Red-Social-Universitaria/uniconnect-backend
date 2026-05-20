/**
 * Servicio de Exportación a CSV
 */

import { HistoriaUsuarioRepository } from '../domain/scrum-contracts';
import { CriterioAceptacionRepository } from '../domain/scrum-contracts';
import { EvaluacionCriterioRepository } from '../domain/scrum-contracts';
import { ImpedimentoRepository } from '../domain/scrum-contracts';

export class ExportCSVService {
  constructor(
    private huRepository: HistoriaUsuarioRepository,
    private criterioRepository: CriterioAceptacionRepository,
    private evaluacionRepository: EvaluacionCriterioRepository,
    private impedimentoRepository: ImpedimentoRepository,
  ) {}

  /**
   * Exportar historias de usuario a CSV
   */
  async exportarHistorias(sprintId: string): Promise<string> {
    const hus = await this.huRepository.findBySprint(sprintId);

    if (hus.length === 0) {
      return this.crearHeaderCSV(['ID', 'Código', 'Título', 'Story Points', 'Estado', 'Prioridad', 'Asignado A']);
    }

    const headers = 'ID,Código,Título,Story Points,Estado,Prioridad,Asignado A\n';
    const filas = hus
      .map((hu) =>
        [
          hu.id,
          hu.codigo,
          this.escaparCSV(hu.titulo),
          hu.storyPoints,
          hu.estado,
          hu.prioridad,
          hu.asignadoA || '',
        ].join(','),
      )
      .join('\n');

    return headers + filas;
  }

  /**
   * Exportar criterios de aceptación a CSV
   */
  async exportarCriterios(sprintId: string): Promise<string> {
    const hus = await this.huRepository.findBySprint(sprintId);

    const headers = 'HU,Número,Descripción Criterio,Cumplido,Fecha Evaluación,Observaciones\n';
    const filas: string[] = [];

    for (const hu of hus) {
      const criterios = await this.criterioRepository.findByHU(hu.id);

      for (const criterio of criterios) {
        const evaluacion = await this.evaluacionRepository.findLatest(criterio.id);

        filas.push(
          [
            hu.codigo,
            criterio.numero,
            this.escaparCSV(criterio.descripcion),
            evaluacion?.cumplido ? 'Sí' : 'No',
            evaluacion?.fechaEvaluacion ? new Date(evaluacion.fechaEvaluacion).toISOString() : '',
            evaluacion?.observaciones ? this.escaparCSV(evaluacion.observaciones) : '',
          ].join(','),
        );
      }
    }

    return headers + filas.join('\n');
  }

  /**
   * Exportar impedimentos a CSV
   */
  async exportarImpedimentos(sprintId: string): Promise<string> {
    const impedimentos = await this.impedimentoRepository.findBySprint(sprintId);

    if (impedimentos.length === 0) {
      return this.crearHeaderCSV(['ID', 'Descripción', 'Estado', 'Es Crítico', 'Días Abierto', 'Fecha Apertura', 'Responsable']);
    }

    const headers = 'ID,Descripción,Estado,Es Crítico,Días Abierto,Fecha Apertura,Responsable\n';
    const filas = impedimentos
      .map((imp) =>
        [
          imp.id,
          this.escaparCSV(imp.descripcion),
          imp.estado,
          imp.esCritico ? 'Sí' : 'No',
          imp.diasAbierto,
          new Date(imp.fechaApertura).toISOString(),
          imp.responsable || '',
        ].join(','),
      )
      .join('\n');

    return headers + filas;
  }

  /**
   * Exportar velocidad histórica a CSV
   */
  async exportarVelocidad(velocidades: any[]): Promise<string> {
    if (velocidades.length === 0) {
      return this.crearHeaderCSV(['Sprint', 'Velocidad Planeada', 'Velocidad Real', 'Cumplimiento %']);
    }

    const headers = 'Sprint,Velocidad Planeada,Velocidad Real,Cumplimiento %\n';
    const filas = velocidades
      .map((v) =>
        [
          v.sprintId,
          v.velocidadPlaneada,
          v.velocidadReal,
          v.porcentajeCumplimiento.toFixed(2),
        ].join(','),
      )
      .join('\n');

    return headers + filas;
  }

  /**
   * Escapa comillas y saltos de línea en campos CSV
   */
  private escaparCSV(valor: string): string {
    if (valor.includes(',') || valor.includes('"') || valor.includes('\n')) {
      return `"${valor.replace(/"/g, '""')}"`;
    }
    return valor;
  }

  private crearHeaderCSV(columnas: string[]): string {
    return columnas.join(',') + '\n';
  }
}
