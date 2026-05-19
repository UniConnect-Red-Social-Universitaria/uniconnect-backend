import { Router } from 'express';
import { recursoController } from './recurso.controller';
import { verificarJWT } from '../../middleware/autenticacion.middleware';

const router = Router();

/**
 * @swagger
 * /api/recursos:
 *   post:
 *     summary: Crear un recurso del grupo
 *     tags: [Recursos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, contenido, grupoId]
 *             properties:
 *               titulo: { type: string }
 *               contenido: { type: string }
 *               tipo: { type: string }
 *               metadata: { type: object }
 *               grupoId: { type: string }
 *     responses:
 *       201:
 *         description: Recurso creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recurso'
 *       401:
 *         description: No autorizado
 */
router.post('/', verificarJWT, recursoController.crearRecurso);

/**
 * @swagger
 * /api/recursos/grupo/{grupoId}:
 *   get:
 *     summary: Obtener recursos de un grupo
 *     tags: [Recursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grupoId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de recursos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recurso'
 *       401:
 *         description: No autorizado
 */
router.get('/grupo/:grupoId', verificarJWT, recursoController.obtenerRecursos);

/**
 * @swagger
 * /api/recursos/{id}:
 *   put:
 *     summary: Editar un recurso
 *     tags: [Recursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo: { type: string }
 *               contenido: { type: string }
 *               metadata: { type: object }
 *     responses:
 *       200:
 *         description: Recurso actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recurso'
 *       401:
 *         description: No autorizado
 */
router.put('/:id', verificarJWT, recursoController.editarRecurso);

/**
 * @swagger
 * /api/recursos/{id}:
 *   delete:
 *     summary: Eliminar un recurso
 *     tags: [Recursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Recurso eliminado
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', verificarJWT, recursoController.eliminarRecurso);

export default router;