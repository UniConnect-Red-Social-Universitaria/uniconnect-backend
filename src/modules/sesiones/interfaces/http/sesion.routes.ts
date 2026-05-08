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
 *     responses:
 *       201:
 *         description: Serie creada con todas sus instancias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/SerieEstudio' }
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/SesionEstudio' }
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

export default router;
