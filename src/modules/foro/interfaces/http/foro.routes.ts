import express from 'express';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';
import { ForoController } from './foro.controller';

const router = express.Router();

/**
 * @swagger
 * /api/foro/{materiaId}/preguntas:
 *   get:
 *     summary: Obtener preguntas del foro de una materia
 *     tags: [Foro]
 *     parameters:
 *       - in: path
 *         name: materiaId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de preguntas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ForoPregunta' }
 *   post:
 *     summary: Publicar una pregunta en el foro
 *     tags: [Foro]
 *     parameters:
 *       - in: path
 *         name: materiaId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, contenido]
 *             properties:
 *               titulo: { type: string }
 *               contenido: { type: string }
 *     responses:
 *       201:
 *         description: Pregunta creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/ForoPregunta' }
 *       403:
 *         description: Sin matrícula activa
 */
router.get('/:materiaId/preguntas', verificarJWT, ForoController.obtenerPreguntas);
router.post('/:materiaId/preguntas', verificarJWT, ForoController.publicarPregunta);

/**
 * @swagger
 * /api/foro/preguntas/{preguntaId}/respuestas:
 *   get:
 *     summary: Obtener respuestas de una pregunta ordenadas por puntuación
 *     tags: [Foro]
 *     parameters:
 *       - in: path
 *         name: preguntaId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de respuestas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ForoRespuesta' }
 *   post:
 *     summary: Publicar una respuesta a una pregunta
 *     tags: [Foro]
 *     parameters:
 *       - in: path
 *         name: preguntaId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contenido, materiaId]
 *             properties:
 *               contenido: { type: string }
 *               materiaId: { type: string }
 *     responses:
 *       201:
 *         description: Respuesta creada
 */
router.get('/preguntas/:preguntaId/respuestas', verificarJWT, ForoController.obtenerRespuestas);
router.post('/preguntas/:preguntaId/respuestas', verificarJWT, ForoController.publicarRespuesta);

/**
 * @swagger
 * /api/foro/respuestas/{respuestaId}/votos:
 *   post:
 *     summary: Votar una respuesta (1 positivo, -1 negativo)
 *     tags: [Foro]
 *     parameters:
 *       - in: path
 *         name: respuestaId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [valor]
 *             properties:
 *               valor: { type: integer, enum: [1, -1] }
 *     responses:
 *       200:
 *         description: Respuesta con puntuación actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/ForoRespuesta' }
 */
router.post('/respuestas/:respuestaId/votos', verificarJWT, ForoController.votarRespuesta);

export default router;
