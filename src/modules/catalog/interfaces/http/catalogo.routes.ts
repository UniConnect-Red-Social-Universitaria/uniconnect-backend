import express from 'express';

import { CatalogoController } from './catalogo.controller';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/catalogos/poblar:
 *   post:
 *     summary: Poblar catálogos con datos iniciales (admin)
 *     tags: [Catálogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Catálogos poblados exitosamente
 */
router.post('/poblar', verificarJWT, CatalogoController.poblar);

/**
 * @swagger
 * /api/catalogos:
 *   get:
 *     summary: Listar catálogos disponibles (materias, programas, etc.)
 *     tags: [Catálogos]
 *     responses:
 *       200:
 *         description: Catálogos del sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 */
router.get('/', CatalogoController.listar);

export default router;
