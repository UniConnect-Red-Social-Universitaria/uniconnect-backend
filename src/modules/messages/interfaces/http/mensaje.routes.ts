import express from 'express';

import { MensajeController } from './mensaje.controller';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/mensajes/grupos:
 *   post:
 *     summary: Enviar mensaje a un grupo
 *     tags: [Mensajes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grupoId, contenido]
 *             properties:
 *               grupoId: { type: string }
 *               contenido: { type: string }
 *     responses:
 *       201:
 *         description: Mensaje enviado al grupo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Mensaje' }
 */
router.post('/grupos', verificarJWT, MensajeController.enviarMensajeGrupo);

/**
 * @swagger
 * /api/mensajes/grupos/{grupoId}:
 *   get:
 *     summary: Obtener historial de mensajes de un grupo
 *     tags: [Mensajes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grupoId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Historial de mensajes del grupo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Mensaje' }
 */
router.get('/grupos/:grupoId', verificarJWT, MensajeController.obtenerHistorialGrupo);

/**
 * @swagger
 * /api/mensajes:
 *   post:
 *     summary: Enviar mensaje directo a un compañero
 *     tags: [Mensajes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [destinatarioId, contenido]
 *             properties:
 *               destinatarioId: { type: string }
 *               contenido: { type: string }
 *     responses:
 *       201:
 *         description: Mensaje enviado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Mensaje' }
 */
router.post('/', verificarJWT, MensajeController.enviarMensaje);

/**
 * @swagger
 * /api/mensajes/{companeroId}:
 *   get:
 *     summary: Obtener historial de mensajes directos con un compañero
 *     tags: [Mensajes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companeroId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Historial de mensajes directos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Mensaje' }
 */
router.get('/:companeroId', verificarJWT, MensajeController.obtenerHistorial);

// ==================== REACCIONES ====================

/**
 * @swagger
 * /api/mensajes/{mensajeId}/reacciones:
 *   post:
 *     summary: Agregar reacción a un mensaje
 *     tags: [Reacciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mensajeId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emoji]
 *             properties:
 *               emoji: { type: string, description: "Emoji para la reacción (ej: 👍, ❤️, 😂)" }
 *               esGrupo: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Reacción agregada exitosamente
 */
router.post('/:mensajeId/reacciones', verificarJWT, MensajeController.agregarReaccion);

/**
 * @swagger
 * /api/mensajes/{mensajeId}/reacciones:
 *   delete:
 *     summary: Remover reacción de un mensaje
 *     tags: [Reacciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mensajeId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emoji]
 *             properties:
 *               emoji: { type: string }
 *               esGrupo: { type: boolean, default: true }
 *     responses:
 *       200:
 *         description: Reacción removida exitosamente
 */
router.delete('/:mensajeId/reacciones', verificarJWT, MensajeController.removerReaccion);

/**
 * @swagger
 * /api/mensajes/{mensajeId}/reacciones:
 *   get:
 *     summary: Obtener reacciones de un mensaje
 *     tags: [Reacciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mensajeId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: esGrupo
 *         schema: { type: boolean, default: true }
 *     responses:
 *       200:
 *         description: Reacciones del mensaje
 */
router.get('/:mensajeId/reacciones', verificarJWT, MensajeController.obtenerReacciones);

// ==================== MENCIONES ====================

/**
 * @swagger
 * /api/mensajes/menciones/pendientes:
 *   get:
 *     summary: Obtener menciones pendientes del usuario
 *     tags: [Menciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Menciones pendientes
 */
router.get('/menciones/pendientes', verificarJWT, MensajeController.obtenerMencionesPendientes);

export default router;
