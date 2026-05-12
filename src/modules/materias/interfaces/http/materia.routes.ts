import express from 'express';

import { MateriaController } from './materia.controller';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/materias/buscar:
 *   get:
 *     summary: Buscar materias por nombre
 *     tags: [Materias]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Materias encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Materia' }
 */
router.get('/buscar', MateriaController.buscar);

/**
 * @swagger
 * /api/materias:
 *   post:
 *     summary: Crear una nueva materia
 *     tags: [Materias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre: { type: string }
 *               codigo: { type: string }
 *               descripcion: { type: string }
 *     responses:
 *       201:
 *         description: Materia creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Materia' }
 *   get:
 *     summary: Listar todas las materias
 *     tags: [Materias]
 *     responses:
 *       200:
 *         description: Lista de materias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Materia' }
 */
router.post('/', verificarJWT, MateriaController.crear);
router.get('/', MateriaController.listar);

export default router;
