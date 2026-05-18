import express from 'express';

import { EventoController } from './evento.controller';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/eventos:
 *   get:
 *     summary: Listar eventos globales (opcionalmente filtrar por categoría)
 *     tags: [Eventos]
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *           enum: [academico, cultural, deportivo, otro]
 *     responses:
 *       200:
 *         description: Lista de eventos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Evento' }
 *   post:
 *     summary: Crear un evento
 *     tags: [Eventos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, descripcion, fechaEvento]
 *             properties:
 *               titulo: { type: string }
 *               descripcion: { type: string }
 *               lugar: { type: string }
 *               fechaEvento: { type: string, format: date-time }
 *               categoria:
 *                 type: string
 *                 enum: [academico, cultural, deportivo, otro]
 *     responses:
 *       201:
 *         description: Evento creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Evento' }
 */
router.get('/', verificarJWT, EventoController.listarGlobal);
router.post('/', verificarJWT, EventoController.crear);

/**
 * @swagger
 * /api/eventos/suscripciones:
 *   get:
 *     summary: Listar categorías suscritas por el usuario
 *     tags: [Eventos]
 *     responses:
 *       200:
 *         description: Categorías suscritas
 *   post:
 *     summary: Suscribirse a una categoría de eventos
 *     tags: [Eventos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoria]
 *             properties:
 *               categoria:
 *                 type: string
 *                 enum: [academico, cultural, deportivo, otro]
 *     responses:
 *       200:
 *         description: Suscripción registrada
 */
router.get('/suscripciones', verificarJWT, EventoController.listarSuscripciones);
router.post('/suscripciones', verificarJWT, EventoController.suscribir);

/**
 * @swagger
 * /api/eventos/suscripciones/{categoria}:
 *   delete:
 *     summary: Desuscribirse de una categoría de eventos
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: categoria
 *         required: true
 *         schema:
 *           type: string
 *           enum: [academico, cultural, deportivo, otro]
 *     responses:
 *       200:
 *         description: Desuscripción exitosa
 */
router.delete('/suscripciones/:categoria', verificarJWT, EventoController.desuscribir);

export default router;
