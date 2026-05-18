import { Router } from 'express';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';
import { NotificacionController } from './notificacion.controller';

const router = Router();

/**
 * @swagger
 * /api/notificaciones/preferencias/{tipoEvento}:
 *   get:
 *     summary: Obtener preferencias de notificación para un tipo de evento
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipoEvento
 *         required: true
 *         schema:
 *           type: string
 *           enum: [academico, social, grupo, sistema]
 *     responses:
 *       200:
 *         description: Preferencias del usuario para ese tipo de evento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/PreferenciaNotificacion' }
 *   put:
 *     summary: Actualizar preferencias de notificación
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipoEvento
 *         required: true
 *         schema:
 *           type: string
 *           enum: [academico, social, grupo, sistema]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activo: { type: boolean }
 *               canales:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [push, email, inApp]
 *     responses:
 *       200:
 *         description: Preferencias actualizadas
 */
router.get('/preferencias', verificarJWT, NotificacionController.obtenerTodasLasPreferencias);
router.get('/preferencias/:tipoEvento', verificarJWT, NotificacionController.obtenerPreferencias);
router.put('/preferencias/:tipoEvento', verificarJWT, NotificacionController.actualizarPreferencias);

/**
 * @swagger
 * /api/notificaciones/prueba:
 *   post:
 *     summary: Enviar notificación de prueba al usuario autenticado
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo: { type: string, enum: [academico, social, grupo, sistema] }
 *     responses:
 *       200:
 *         description: Notificación de prueba enviada
 */
router.post('/prueba', verificarJWT, NotificacionController.enviarPrueba);

export default router;
