import { Router } from 'express';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';
import { NotificacionController } from './notificacion.controller';

const router = Router();

/**
 * @swagger
 * /api/notificaciones/tipos:
 *   get:
 *     summary: Obtener tipos de evento y canales disponibles
 *     description: Devuelve los tipos de evento que generan notificaciones y los canales válidos. Útil para construir la UI de preferencias.
 *     tags: [Notificaciones]
 *     responses:
 *       200:
 *         description: Lista de tipos de evento y canales disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tiposEvento:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [mensaje, mensaje-grupo, mencion, encuesta, recordatorio, evento-academico, evento-cultural, evento-deportivo, evento-otro]
 *                     canalesDisponibles:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [in-app, email, push]
 */
router.get('/tipos', NotificacionController.obtenerTiposYCanales);

/**
 * @swagger
 * /api/notificaciones/preferencias:
 *   get:
 *     summary: Obtener todas las preferencias de notificación del usuario
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array con las preferencias de cada tipo de evento
 */
router.get('/preferencias', verificarJWT, NotificacionController.obtenerTodasLasPreferencias);

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
 *           enum: [mensaje, mensaje-grupo, mencion, encuesta, recordatorio, evento-academico, evento-cultural, evento-deportivo, evento-otro]
 *     responses:
 *       200:
 *         description: Preferencias del usuario para ese tipo de evento
 *       400:
 *         description: Tipo de evento inválido
 *   put:
 *     summary: Actualizar canales activos para un tipo de evento
 *     description: El usuario puede elegir uno o varios canales (in-app, email, push) o un array vacío para silenciar ese tipo.
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipoEvento
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mensaje, mensaje-grupo, mencion, encuesta, recordatorio, evento-academico, evento-cultural, evento-deportivo, evento-otro]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [canales]
 *             properties:
 *               canales:
 *                 type: array
 *                 description: Canales deseados (puede ser vacío para silenciar)
 *                 items:
 *                   type: string
 *                   enum: [in-app, email, push]
 *                 example: ["in-app", "push"]
 *     responses:
 *       200:
 *         description: Preferencias actualizadas correctamente
 *       400:
 *         description: Tipo de evento o canales inválidos
 */
router.get('/preferencias/:tipoEvento', verificarJWT, NotificacionController.obtenerPreferencias);
router.put('/preferencias/:tipoEvento', verificarJWT, NotificacionController.actualizarPreferencias);

/**
 * @swagger
 * /api/notificaciones/prueba:
 *   post:
 *     summary: Enviar notificación de prueba al usuario autenticado
 *     description: Prueba el sistema de notificaciones con los canales activos del usuario para el tipo indicado.
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipoEvento]
 *             properties:
 *               tipoEvento:
 *                 type: string
 *                 enum: [mensaje, mensaje-grupo, mencion, encuesta, recordatorio, evento-academico, evento-cultural, evento-deportivo, evento-otro]
 *               mensaje:
 *                 type: string
 *                 description: Texto de la notificación de prueba
 *     responses:
 *       200:
 *         description: Resultados del envío por cada canal activo
 */
router.post('/prueba', verificarJWT, NotificacionController.enviarPrueba);

export default router;
