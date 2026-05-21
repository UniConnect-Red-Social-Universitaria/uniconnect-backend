import { Router } from 'express';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';
import { SesionController } from './sesion.controller';

const router = Router();

/**
 * @swagger
 * /api/sesiones/series:
 *   post:
 *     summary: Crear una serie de sesiones de estudio recurrentes
 *     tags: [Sesiones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, descripcion, lugar, frecuencia, fechaInicio, fechaFin]
 *             properties:
 *               titulo: { type: string }
 *               descripcion: { type: string }
 *               lugar: { type: string }
 *               frecuencia:
 *                 type: string
 *                 enum: [DIARIA, SEMANAL, QUINCENAL]
 *               fechaInicio: { type: string, format: date-time }
 *               fechaFin: { type: string, format: date-time }
 *               recordatorioMinutos: { type: integer, default: 30 }
 *               grupoId: { type: string, description: "Opcional. ID del grupo para sesiones grupales" }
 *     responses:
 *       201:
 *         description: Serie creada con todas sus instancias
 */
router.post('/series', verificarJWT, SesionController.crearSerie);

/**
 * @swagger
 * /api/sesiones:
 *   get:
 *     summary: Obtener sesiones activas del usuario autenticado
 *     tags: [Sesiones]
 *     responses:
 *       200:
 *         description: Lista de sesiones no canceladas
 */
router.get('/', verificarJWT, SesionController.obtenerSesiones);

/**
 * @swagger
 * /api/sesiones/{sesionId}:
 *   patch:
 *     summary: Modificar una sesión con alcance solo_esta o esta_y_siguientes
 *     tags: [Sesiones]
 *     parameters:
 *       - in: path
 *         name: sesionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [alcance]
 *             properties:
 *               alcance:
 *                 type: string
 *                 enum: [solo_esta, esta_y_siguientes]
 *               titulo: { type: string }
 *               descripcion: { type: string }
 *               lugar: { type: string }
 *               fecha: { type: string, format: date-time }
 *               recordatorioMinutos: { type: integer }
 *     responses:
 *       200:
 *         description: Sesión(es) actualizada(s)
 */
router.patch('/:sesionId', verificarJWT, SesionController.modificarSesion);

/**
 * @swagger
 * /api/sesiones/{sesionId}/cancelar:
 *   post:
 *     summary: Cancelar una sesión con alcance solo_esta o esta_y_siguientes
 *     tags: [Sesiones]
 *     parameters:
 *       - in: path
 *         name: sesionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [alcance]
 *             properties:
 *               alcance:
 *                 type: string
 *                 enum: [solo_esta, esta_y_siguientes]
 *     responses:
 *       200:
 *         description: Sesión(es) cancelada(s)
 */
router.post('/:sesionId/cancelar', verificarJWT, SesionController.cancelarSesion);

// ── Criterio 3: Cancelar múltiples sesiones específicas ──

/**
 * @swagger
 * /api/sesiones/cancelar-multiples:
 *   post:
 *     summary: Cancelar múltiples sesiones específicas (Criterio 3)
 *     description: Permite cancelar una o varias sesiones por sus IDs sin afectar el resto de la serie
 *     tags: [Sesiones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sesionIds]
 *             properties:
 *               sesionIds:
 *                 type: array
 *                 items: { type: string }
 *                 description: IDs de las sesiones a cancelar
 *     responses:
 *       200:
 *         description: Sesiones canceladas
 */
router.post('/cancelar-multiples', verificarJWT, SesionController.cancelarSesionesPorIds);

// ── Criterio 4: Calendario web ──

/**
 * @swagger
 * /api/sesiones/calendario:
 *   get:
 *     summary: Obtener calendario completo de sesiones (Criterio 4)
 *     description: Retorna sesiones del usuario ordenadas cronológicamente con indicador de recurrencia, estado de cancelación, participantes y asistencia
 *     tags: [Sesiones]
 *     responses:
 *       200:
 *         description: Calendario de sesiones
 */
router.get('/calendario', verificarJWT, SesionController.obtenerCalendario);

// ── Criterio 5: Detalle de sesión y asistencia ──

/**
 * @swagger
 * /api/sesiones/{sesionId}/detalle:
 *   get:
 *     summary: Obtener detalle completo de una sesión (Criterio 5)
 *     tags: [Sesiones]
 *     parameters:
 *       - in: path
 *         name: sesionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detalle de la sesión incluyendo asistentes y recurrencia
 */
router.get('/:sesionId/detalle', verificarJWT, SesionController.obtenerDetalleSesion);

/**
 * @swagger
 * /api/sesiones/{sesionId}/asistir:
 *   post:
 *     summary: Confirmar asistencia a una sesión (Criterio 5)
 *     tags: [Sesiones]
 *     parameters:
 *       - in: path
 *         name: sesionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Asistencia confirmada
 */
router.post('/:sesionId/asistir', verificarJWT, SesionController.confirmarAsistencia);

/**
 * @swagger
 * /api/sesiones/{sesionId}/declinar:
 *   post:
 *     summary: Declinar asistencia a una sesión (Criterio 5)
 *     tags: [Sesiones]
 *     parameters:
 *       - in: path
 *         name: sesionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Asistencia declinada
 */
router.post('/:sesionId/declinar', verificarJWT, SesionController.declinarAsistencia);

export default router;
