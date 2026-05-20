/**
 * Rutas para módulo Scrum
 */

import express, { Router } from 'express';
import { verificarJWT as autenticacion } from '../../../../middleware/autenticacion.middleware';

import { SprintController } from './sprint.controller';
import { HistoriaUsuarioController } from './historia-usuario.controller';
import { CriterioAceptacionController } from './criterio-aceptacion.controller';
import { MetricasController } from './metricas.controller';
import { TrazabilidadController } from './trazabilidad.controller';
import { RetrospectivaController } from './retrospectiva.controller';
import { ImpedimentoController } from './impedimento.controller';
import { ExportacionController } from './exportacion.controller';

const router: Router = express.Router();

// ════════════════════════════════════════════════════════════════════════════════════
// SPRINT ROUTES
// ════════════════════════════════════════════════════════════════════════════════════

/**
 * @route POST /api/scrum/sprints
 * @description Crear nuevo sprint
 * @access Private
 */
router.post('/sprints', autenticacion, SprintController.crear);

/**
 * @route GET /api/scrum/sprints
 * @description Listar todos los sprints
 * @query {boolean} activos - Solo sprints activos
 * @access Private
 */
router.get('/sprints', autenticacion, SprintController.listar);

/**
 * @route GET /api/scrum/sprints/:sprintId
 * @description Obtener datos de un sprint específico
 * @access Private
 */
router.get('/sprints/:sprintId', autenticacion, SprintController.obtener);

/**
 * @route PUT /api/scrum/sprints/:sprintId
 * @description Actualizar datos de un sprint
 * @access Private
 */
router.put('/sprints/:sprintId', autenticacion, SprintController.actualizar);

/**
 * @route POST /api/scrum/sprints/:sprintId/iniciar
 * @description Iniciar un sprint (cambiar estado a ACTIVO)
 * @access Private
 */
router.post('/sprints/:sprintId/iniciar', autenticacion, SprintController.iniciar);

/**
 * @route POST /api/scrum/sprints/:sprintId/cerrar
 * @description Cerrar un sprint (cambiar estado a COMPLETADO)
 * @access Private
 */
router.post('/sprints/:sprintId/cerrar', autenticacion, SprintController.cerrar);

// ════════════════════════════════════════════════════════════════════════════════════
// HISTORIA USUARIO ROUTES
// ════════════════════════════════════════════════════════════════════════════════════

/**
 * @route POST /api/scrum/sprints/:sprintId/historias
 * @description Crear nueva historia de usuario en un sprint
 * @access Private
 */
router.post('/sprints/:sprintId/historias', autenticacion, HistoriaUsuarioController.crear);

/**
 * @route GET /api/scrum/sprints/:sprintId/historias
 * @description Listar historias de usuario de un sprint
 * @query {string} estado - Filtrar por estado (opcional)
 * @access Private
 */
router.get('/sprints/:sprintId/historias', autenticacion, HistoriaUsuarioController.listarPorSprint);

/**
 * @route GET /api/scrum/historias/:huId
 * @description Obtener datos de una historia de usuario específica
 * @access Private
 */
router.get('/historias/:huId', autenticacion, HistoriaUsuarioController.obtener);

/**
 * @route PUT /api/scrum/historias/:huId
 * @description Actualizar datos de una historia de usuario
 * @access Private
 */
router.put('/historias/:huId', autenticacion, HistoriaUsuarioController.actualizar);

/**
 * @route PUT /api/scrum/historias/:huId/estado
 * @description Cambiar estado de una historia de usuario
 * @body {string} estado - Nuevo estado
 * @access Private
 */
router.put('/historias/:huId/estado', autenticacion, HistoriaUsuarioController.cambiarEstado);

/**
 * @route PUT /api/scrum/historias/:huId/asignar
 * @description Asignar historia de usuario a un usuario
 * @body {string} usuarioId - ID del usuario a asignar (null para desasignar)
 * @access Private
 */
router.put('/historias/:huId/asignar', autenticacion, HistoriaUsuarioController.asignar);

// ════════════════════════════════════════════════════════════════════════════════════
// CRITERIO ACEPTACION ROUTES
// ════════════════════════════════════════════════════════════════════════════════════

/**
 * @route POST /api/scrum/historias/:huId/criterios
 * @description Crear criterio de aceptación para una HU
 * @access Private
 */
router.post('/historias/:huId/criterios', autenticacion, CriterioAceptacionController.crear);

/**
 * @route GET /api/scrum/historias/:huId/criterios
 * @description Listar criterios de aceptación de una HU
 * @access Private
 */
router.get('/historias/:huId/criterios', autenticacion, CriterioAceptacionController.listarDeHU);

/**
 * @route POST /api/scrum/criterios/:criterioId/evaluar
 * @description Evaluar cumplimiento de un criterio de aceptación
 * @access Private
 */
router.post('/criterios/:criterioId/evaluar', autenticacion, CriterioAceptacionController.evaluar);

/**
 * @route GET /api/scrum/criterios/:criterioId/historial
 * @description Obtener historial de evaluaciones de un criterio
 * @access Private
 */
router.get('/criterios/:criterioId/historial', autenticacion, CriterioAceptacionController.obtenerHistorial);

/**
 * @route GET /api/scrum/historias/:huId/cumplimiento
 * @description Calcular porcentaje de cumplimiento de criterios de una HU
 * @access Private
 */
router.get('/historias/:huId/cumplimiento', autenticacion, CriterioAceptacionController.calcularCumplimiento);

// ════════════════════════════════════════════════════════════════════════════════════
// MÉTRICAS ROUTES
// ════════════════════════════════════════════════════════════════════════════════════

/**
 * @route GET /api/scrum/sprints/:sprintId/metricas
 * @description Obtener métricas del sprint (velocidad, HU completadas, etc)
 * @access Private
 */
router.get('/sprints/:sprintId/metricas', autenticacion, MetricasController.calcularMetricas);

/**
 * @route GET /api/scrum/sprints/:sprintId/burndown
 * @description Obtener datos para burn-down chart del sprint
 * @access Private
 */
router.get('/sprints/:sprintId/burndown', autenticacion, MetricasController.calcularBurndown);

/**
 * @route GET /api/scrum/sprints/:sprintId/cumplimiento
 * @description Obtener cumplimiento global de criterios de aceptación del sprint
 * @access Private
 */
router.get('/sprints/:sprintId/cumplimiento', autenticacion, MetricasController.calcularCumplimiento);

/**
 * @route GET /api/scrum/metricas/velocidad-historica
 * @description Obtener velocidad histórica (últimos 10 sprints)
 * @access Private
 */
router.get('/metricas/velocidad-historica', autenticacion, MetricasController.velocidadHistorica);

// ════════════════════════════════════════════════════════════════════════════════════
// TRAZABILIDAD ROUTES
// ════════════════════════════════════════════════════════════════════════════════════

/**
 * @route POST /api/scrum/trazabilidad
 * @description Linkear una HU con commit, PR o despliegue
 * @access Private
 */
router.post('/trazabilidad', autenticacion, TrazabilidadController.linkear);

/**
 * @route GET /api/scrum/historias/:huId/trazabilidad
 * @description Obtener trazabilidad completa de una HU
 * @access Private
 */
router.get('/historias/:huId/trazabilidad', autenticacion, TrazabilidadController.obtenerDeHU);

/**
 * @route GET /api/scrum/trazabilidad/buscar
 * @description Buscar HU por commit SHA
 * @query {string} sha - SHA del commit
 * @query {string} repositorio - BACKEND o FRONTEND
 * @access Private
 */
router.get('/trazabilidad/buscar', autenticacion, TrazabilidadController.buscarPorCommit);

/**
 * @route GET /api/scrum/trazabilidad/:repositorio
 * @description Listar trazabilidades de un repositorio específico
 * @param {string} repositorio - BACKEND o FRONTEND
 * @access Private
 */
router.get('/trazabilidad/:repositorio', autenticacion, TrazabilidadController.listarPorRepositorio);

// ════════════════════════════════════════════════════════════════════════════════════
// RETROSPECTIVA ROUTES
// ════════════════════════════════════════════════════════════════════════════════════

/**
 * @route POST /api/scrum/sprints/:sprintId/retrospectiva
 * @description Crear retrospectiva para un sprint
 * @access Private
 */
router.post('/sprints/:sprintId/retrospectiva', autenticacion, RetrospectivaController.crear);

/**
 * @route GET /api/scrum/sprints/:sprintId/retrospectiva
 * @description Obtener retrospectiva de un sprint
 * @access Private
 */
router.get('/sprints/:sprintId/retrospectiva', autenticacion, RetrospectivaController.obtener);

/**
 * @route POST /api/scrum/retrospectivas/:retroId/acuerdos
 * @description Agregar acuerdo a una retrospectiva
 * @access Private
 */
router.post('/retrospectivas/:retroId/acuerdos', autenticacion, RetrospectivaController.agregarAcuerdo);

/**
 * @route POST /api/scrum/retrospectivas/:retroId/impedimentos
 * @description Agregar impedimento a una retrospectiva
 * @access Private
 */
router.post('/retrospectivas/:retroId/impedimentos', autenticacion, RetrospectivaController.agregarImpedimento);

// ════════════════════════════════════════════════════════════════════════════════════
// IMPEDIMENTO ROUTES
// ════════════════════════════════════════════════════════════════════════════════════

/**
 * @route POST /api/scrum/impedimentos
 * @description Crear nuevo impedimento
 * @access Private
 */
router.post('/impedimentos', autenticacion, ImpedimentoController.crear);

/**
 * @route GET /api/scrum/impedimentos/abiertos
 * @description Listar todos los impedimentos abiertos
 * @access Private
 */
router.get('/impedimentos/abiertos', autenticacion, ImpedimentoController.listarAbiertos);

/**
 * @route GET /api/scrum/impedimentos/criticos
 * @description Listar impedimentos marcados como críticos
 * @access Private
 */
router.get('/impedimentos/criticos', autenticacion, ImpedimentoController.listarCriticos);

/**
 * @route GET /api/scrum/impedimentos/:impedimentoId
 * @description Obtener datos de un impedimento específico
 * @access Private
 */
router.get('/impedimentos/:impedimentoId', autenticacion, ImpedimentoController.obtener);

/**
 * @route GET /api/scrum/sprints/:sprintId/impedimentos
 * @description Listar impedimentos de un sprint específico
 * @access Private
 */
router.get('/sprints/:sprintId/impedimentos', autenticacion, ImpedimentoController.listarPorSprint);

/**
 * @route PUT /api/scrum/impedimentos/:impedimentoId/estado
 * @description Actualizar estado de un impedimento
 * @body {string} estado - Nuevo estado
 * @access Private
 */
router.put('/impedimentos/:impedimentoId/estado', autenticacion, ImpedimentoController.actualizarEstado);

/**
 * @route POST /api/scrum/impedimentos/detectar-criticos
 * @description Detectar automáticamente impedimentos abiertos > 3 días y marcarlos como críticos
 * @access Private
 */
router.post('/impedimentos/detectar-criticos', autenticacion, ImpedimentoController.detectarCriticos);

// ════════════════════════════════════════════════════════════════════════════════════
// EXPORTACIÓN ROUTES (CSV, PDF)
// ════════════════════════════════════════════════════════════════════════════════════

/**
 * @route GET /api/scrum/sprints/:sprintId/exportar/historias.csv
 * @description Exportar historias de usuario a CSV
 * @access Private
 */
router.get('/sprints/:sprintId/exportar/historias.csv', autenticacion, ExportacionController.exportarHistoriasCSV);

/**
 * @route GET /api/scrum/sprints/:sprintId/exportar/criterios.csv
 * @description Exportar criterios de aceptación a CSV
 * @access Private
 */
router.get('/sprints/:sprintId/exportar/criterios.csv', autenticacion, ExportacionController.exportarCriteriosCSV);

/**
 * @route GET /api/scrum/sprints/:sprintId/exportar/impedimentos.csv
 * @description Exportar impedimentos a CSV
 * @access Private
 */
router.get('/sprints/:sprintId/exportar/impedimentos.csv', autenticacion, ExportacionController.exportarImpedimentosCSV);

/**
 * @route GET /api/scrum/sprints/:sprintId/exportar/reporte.pdf
 * @description Generar reporte PDF completo del sprint
 * @query {boolean} trazabilidad - Incluir sección de trazabilidad
 * @query {boolean} retrospectiva - Incluir sección de retrospectiva
 * @query {boolean} impedimentos - Incluir sección de impedimentos
 * @access Private
 */
router.get('/sprints/:sprintId/exportar/reporte.pdf', autenticacion, ExportacionController.exportarReportePDF);

export default router;
