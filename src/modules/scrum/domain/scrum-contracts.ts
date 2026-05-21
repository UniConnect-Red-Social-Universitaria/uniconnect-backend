/**
 * Contratos para módulo Scrum
 * Define interfaces para repositorios, DTOs y tipos
 */

import { AuthenticatedUser } from '../../../domain/contracts';

// ════════════════════════════════════════════════════════════════════════════════════
// TIPOS Y ENUMS
// ════════════════════════════════════════════════════════════════════════════════════

export type EstadoSprint = 'PLANEACION' | 'ACTIVO' | 'COMPLETADO' | 'CANCELADO';
export type EstadoHU = 'PENDIENTE' | 'EN_PROGRESO' | 'BLOQUEADA' | 'COMPLETADA' | 'CANCELADA';
export type EstadoImpedimento = 'ABIERTO' | 'EN_PROGRESO' | 'RESUELTO' | 'CERRADO';
export type TipoRepositorio = 'BACKEND' | 'FRONTEND';

// ════════════════════════════════════════════════════════════════════════════════════
// RECORDS (Modelos de datos del dominio)
// ════════════════════════════════════════════════════════════════════════════════════

export interface SprintRecord {
  id: string;
  numero: number;
  nombre: string;
  descripcion?: string;
  estado: EstadoSprint;
  fechaInicio?: Date;
  fechaFin?: Date;
  velocidadPlaneada: number;
  velocidadReal?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoriaUsuarioRecord {
  id: string;
  codigo: string; // HU-001, HU-002, etc
  titulo: string;
  descripcion: string;
  storyPoints: number;
  estado: EstadoHU;
  prioridad: number;
  asignadoA?: string; // usuarioId
  sprintId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CriterioAceptacionRecord {
  id: string;
  numero: number; // 1, 2, 3...
  descripcion: string;
  huId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvaluacionCriterioRecord {
  id: string;
  criterioId: string;
  cumplido: boolean;
  observaciones?: string;
  evaluador?: string; // usuarioId
  fechaEvaluacion: Date;
  createdAt: Date;
}

export interface TrazabilidadHURecord {
  id: string;
  huId: string;
  repositorio: TipoRepositorio;
  nombreRepositorio: string; // "uniconnect-backend", "Frontend-UnConnect"
  
  // Commit
  shaCommit?: string;
  urlCommit?: string;
  mensajeCommit?: string;
  autorCommit?: string;
  
  // PR
  numeroPR?: number;
  urlPR?: string;
  estadoPR?: string;
  
  // Deploy
  numeroDespliegue?: number;
  urlDespliegue?: string;
  estadoDespliegue?: string;
  
  extraido?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VelocidadSprintRecord {
  id: string;
  sprintId: string;
  velocidadPlaneada: number;
  velocidadReal: number;
  porcentajeCumplimiento: number; // 0-100
  huCompletadas: number;
  huTotales: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BurndownDiarioRecord {
  id: string;
  sprintId: string;
  fecha: Date;
  dia: number; // 1, 2, 3...
  spRestantes: number;
  huCompletadasEnDia: number;
  spIdealRestantes: number;
  huIds: string[];
  createdAt: Date;
}

export interface RetrospectivaRecord {
  id: string;
  sprintId: string;
  fechaRetrospectiva: Date;
  comentariosGenerales?: string;
  acuerdos: AccuerdoRetroRecord[];
  impedimentos: ImpedimentoRetroRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AccuerdoRetroRecord {
  id: string;
  retroId: string;
  descripcion: string;
  responsable?: string;
  estado: string; // PENDIENTE, EN_PROGRESO, COMPLETADO
  createdAt: Date;
  updatedAt: Date;
}

export interface ImpedimentoRetroRecord {
  id: string;
  retroId: string;
  descripcion: string;
  impacto?: string;
  responsable?: string;
  estado: string; // ABIERTO, EN_PROGRESO, RESUELTO
  createdAt: Date;
  updatedAt: Date;
}

export interface ImpedimentoRecord {
  id: string;
  sprintId?: string;
  descripcion: string;
  estado: EstadoImpedimento;
  esCritico: boolean;
  diasAbierto: number;
  responsable?: string;
  fechaApertura: Date;
  fechaResolucion?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ════════════════════════════════════════════════════════════════════════════════════
// DTOs DE ENTRADA (Para Controllers)
// ════════════════════════════════════════════════════════════════════════════════════

export interface CreateSprintDTO {
  numero: number;
  nombre: string;
  descripcion?: string;
  velocidadPlaneada?: number;
}

export interface UpdateSprintDTO {
  nombre?: string;
  descripcion?: string;
  estado?: EstadoSprint;
  fechaInicio?: string;
  fechaFin?: string;
  velocidadPlaneada?: number;
}

export interface CreateHistoriaUsuarioDTO {
  codigo: string;
  titulo: string;
  descripcion: string;
  storyPoints: number;
  prioridad?: number;
  asignadoA?: string;
}

export interface UpdateHistoriaUsuarioDTO {
  titulo?: string;
  descripcion?: string;
  storyPoints?: number;
  estado?: EstadoHU;
  prioridad?: number;
  asignadoA?: string;
}

export interface CreateCriterioAceptacionDTO {
  numero: number;
  descripcion: string;
}

export interface CreateEvaluacionCriterioDTO {
  cumplido: boolean;
  observaciones?: string;
  evaluador?: string;
  fechaEvaluacion: string; // ISO format
}

export interface LinkTrazabilidadDTO {
  huId: string;
  repositorio: TipoRepositorio;
  nombreRepositorio: string;
  shaCommit?: string;
  urlCommit?: string;
  mensajeCommit?: string;
  numeroPR?: number;
  urlPR?: string;
  estadoPR?: string;
}

export interface CreateRetrospectivaDTO {
  fechaRetrospectiva: string; // ISO format
  comentariosGenerales?: string;
  acuerdos?: Array<{
    descripcion: string;
    responsable?: string;
  }>;
  impedimentos?: Array<{
    descripcion: string;
    impacto?: string;
    responsable?: string;
  }>;
}

export interface CreateImpedimentoDTO {
  descripcion: string;
  estado?: EstadoImpedimento;
  responsable?: string;
  sprintId?: string;
}

// ════════════════════════════════════════════════════════════════════════════════════
// DTOs DE SALIDA (Para respuestas)
// ════════════════════════════════════════════════════════════════════════════════════

export interface SprintResponseDTO {
  id: string;
  numero: number;
  nombre: string;
  estado: EstadoSprint;
  velocidadPlaneada: number;
  velocidadReal?: number;
  fechaInicio?: Date;
  fechaFin?: Date;
  historiasCount?: number;
}

export interface HistoriaUsuarioResponseDTO {
  id: string;
  codigo: string;
  titulo: string;
  storyPoints: number;
  estado: EstadoHU;
  prioridad: number;
  criteriosAceptacion?: CriterioAceptacionRecord[];
  trazabilidades?: TrazabilidadHURecord[];
}

export interface MetricasSprintResponseDTO {
  sprintId: string;
  numero: number;
  velocidadPlaneada: number;
  velocidadReal: number;
  porcentajeCumplimiento: number;
  huTotales: number;
  huCompletadas: number;
  huEnProgreso: number;
  huBloqueadas: number;
  promedio3Sprints?: number; // Velocidad promedio últimos 3 sprints
}

export interface BurndownChartDataDTO {
  sprintId: string;
  dias: Array<{
    dia: number;
    fecha: Date;
    spRestantesReal: number;
    spRestantesIdeal: number;
    huCompletadas: number;
  }>;
  totalSpPlaneados: number;
  spCompletados: number;
  proyeccionFinal?: number;
}

export interface TrazabilidadResponseDTO {
  huId: string;
  codigo: string;
  titulo: string;
  trazas: Array<{
    id: string;
    repositorio: TipoRepositorio;
    nombreRepositorio: string;
    tipoArtefacto: 'COMMIT' | 'PR' | 'DEPLOY';
    enlace: string;
    referencia: string; // SHA, #PR, etc
    extraido: Date;
  }>;
}

export interface ReportePDFDTO {
  sprintId: string;
  incluirTrazabilidad: boolean;
  incluirRetrospectiva: boolean;
  incluirImpedimentos: boolean;
}

export interface ReporteCSVDTO {
  tipo: 'HISTORIAS' | 'CRITERIOS' | 'IMPEDIMENTOS' | 'VELOCIDAD';
  sprintId?: string;
  filtro?: Record<string, unknown>;
}

// ════════════════════════════════════════════════════════════════════════════════════
// REPOSITORY CONTRACTS
// ════════════════════════════════════════════════════════════════════════════════════

export interface SprintRepository {
  create(data: CreateSprintDTO): Promise<SprintRecord>;
  findById(id: string): Promise<SprintRecord | null>;
  findByNumero(numero: number): Promise<SprintRecord | null>;
  findAll(): Promise<SprintRecord[]>;
  findActivos(): Promise<SprintRecord[]>;
  update(id: string, data: UpdateSprintDTO): Promise<SprintRecord>;
  delete(id: string): Promise<void>;
}

export interface HistoriaUsuarioRepository {
  create(sprintId: string, data: CreateHistoriaUsuarioDTO): Promise<HistoriaUsuarioRecord>;
  findById(id: string): Promise<HistoriaUsuarioRecord | null>;
  findByCodigoAndSprint(codigo: string, sprintId: string): Promise<HistoriaUsuarioRecord | null>;
  findBySprint(sprintId: string, estado?: EstadoHU): Promise<HistoriaUsuarioRecord[]>;
  update(id: string, data: UpdateHistoriaUsuarioDTO): Promise<HistoriaUsuarioRecord>;
  delete(id: string): Promise<void>;
}

export interface CriterioAceptacionRepository {
  create(huId: string, data: CreateCriterioAceptacionDTO): Promise<CriterioAceptacionRecord>;
  findByHU(huId: string): Promise<CriterioAceptacionRecord[]>;
  findById(id: string): Promise<CriterioAceptacionRecord | null>;
  delete(id: string): Promise<void>;
}

export interface EvaluacionCriterioRepository {
  create(criterioId: string, data: CreateEvaluacionCriterioDTO): Promise<EvaluacionCriterioRecord>;
  findByCriterio(criterioId: string): Promise<EvaluacionCriterioRecord[]>;
  findLatest(criterioId: string): Promise<EvaluacionCriterioRecord | null>;
}

export interface TrazabilidadHURepository {
  create(data: TrazabilidadHURecord): Promise<TrazabilidadHURecord>;
  findByHU(huId: string): Promise<TrazabilidadHURecord[]>;
  findByCommit(sha: string, repositorio: TipoRepositorio): Promise<TrazabilidadHURecord | null>;
  findByRepositorio(repositorio: TipoRepositorio): Promise<TrazabilidadHURecord[]>;
}

export interface VelocidadSprintRepository {
  create(sprintId: string, datos: Omit<VelocidadSprintRecord, 'id' | 'sprintId' | 'createdAt' | 'updatedAt'>): Promise<VelocidadSprintRecord>;
  findBySprint(sprintId: string): Promise<VelocidadSprintRecord | null>;
  findLast(cantidad: number): Promise<VelocidadSprintRecord[]>;
}

export interface BurndownDiarioRepository {
  create(data: BurndownDiarioRecord): Promise<BurndownDiarioRecord>;
  findBySprint(sprintId: string): Promise<BurndownDiarioRecord[]>;
  findBySprintAndFecha(sprintId: string, fecha: Date): Promise<BurndownDiarioRecord | null>;
  update(id: string, data: Partial<BurndownDiarioRecord>): Promise<BurndownDiarioRecord>;
}

export interface RetrospectivaRepository {
  create(sprintId: string, data: CreateRetrospectivaDTO): Promise<RetrospectivaRecord>;
  findBySprint(sprintId: string): Promise<RetrospectivaRecord | null>;
  createAcuerdo(retroId: string, acuerdo: Omit<AccuerdoRetroRecord, 'id' | 'retroId' | 'createdAt' | 'updatedAt'>): Promise<AccuerdoRetroRecord>;
  createImpedimento(retroId: string, impedimento: Omit<ImpedimentoRetroRecord, 'id' | 'retroId' | 'createdAt' | 'updatedAt'>): Promise<ImpedimentoRetroRecord>;
}

export interface ImpedimentoRepository {
  create(data: CreateImpedimentoDTO): Promise<ImpedimentoRecord>;
  findById(id: string): Promise<ImpedimentoRecord | null>;
  findAbiertos(): Promise<ImpedimentoRecord[]>;
  findCriticos(): Promise<ImpedimentoRecord[]>;
  findBySprint(sprintId: string): Promise<ImpedimentoRecord[]>;
  update(id: string, data: Partial<ImpedimentoRecord>): Promise<ImpedimentoRecord>;
  marcarComoCritico(id: string): Promise<void>;
}

// ════════════════════════════════════════════════════════════════════════════════════
// SERVICE CONTRACTS (Para lógica de negocio)
// ════════════════════════════════════════════════════════════════════════════════════

export interface CálculoMetricasService {
  calcularVelocidadHistorica(sprintId: string): Promise<VelocidadSprintRecord>;
  calcularPromedioMovil(ultimos: number): Promise<number>;
  calcularBurndown(sprintId: string): Promise<BurndownChartDataDTO>;
  calcularCumplimientoCriterios(huId: string): Promise<{ cumplidos: number; total: number; porcentaje: number }>;
  detectarImpedimentosCriticos(): Promise<ImpedimentoRecord[]>;
}

export interface GitHubIntegrationService {
  extraerCommitsDeHU(huCodigo: string, repositorio: TipoRepositorio): Promise<TrazabilidadHURecord[]>;
  obtenerPRsRelacionados(huCodigo: string, repositorio: TipoRepositorio): Promise<TrazabilidadHURecord[]>;
  obtenerDeployRelacionados(huCodigo: string): Promise<TrazabilidadHURecord[]>;
}

export interface ExportService {
  generarCSV(tipo: 'HISTORIAS' | 'CRITERIOS' | 'IMPEDIMENTOS' | 'VELOCIDAD', sprintId?: string): Promise<string>;
  generarPDF(sprintId: string, opciones?: { incluirTrazabilidad?: boolean; incluirRetrospectiva?: boolean }): Promise<Buffer>;
}

export { AuthenticatedUser };
