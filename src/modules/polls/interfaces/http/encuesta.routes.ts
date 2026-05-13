import express from 'express';

import { verificarJWT } from '../../../../middleware/autenticacion.middleware';
import { EncuestaController } from './encuesta.controller';

const router = express.Router();

/**
 * @swagger
 * /api/encuestas/grupos/{grupoId}:
 *   post:
 *     summary: Crear una encuesta rápida en un grupo
 *     tags: [Encuestas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grupoId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pregunta, opciones, autoCloseAt]
 *             properties:
 *               pregunta: { type: string, minLength: 3 }
 *               opciones:
 *                 type: array
 *                 minItems: 2
 *                 items:
 *                   oneOf:
 *                     - type: string
 *                     - type: object
 *                       properties:
 *                         text: { type: string }
 *                         position: { type: integer }
 *               autoCloseAt: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Encuesta creada
 */
router.get('/grupos/:grupoId', verificarJWT, EncuestaController.obtenerDeGrupo);
router.post('/grupos/:grupoId', verificarJWT, EncuestaController.crearEnGrupo);


/**
 * @swagger
 * /api/encuestas/{encuestaId}/votos:
 *   post:
 *     summary: Registrar un voto en una encuesta de grupo
 *     tags: [Encuestas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encuestaId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [optionId]
 *             properties:
 *               optionId: { type: string }
 *     responses:
 *       200:
 *         description: Voto registrado y encuesta actualizada
 */
router.post('/:encuestaId/votos', verificarJWT, EncuestaController.votar);

export default router;
