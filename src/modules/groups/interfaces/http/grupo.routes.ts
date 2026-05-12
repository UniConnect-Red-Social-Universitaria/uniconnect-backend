import express from 'express';

import { GrupoController } from './grupo.controller';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';
import { procesarUploadArchivoGrupo } from '../../../../middleware/archivo-grupo.middleware';
import { MensajeController } from '../../../messages/interfaces/http/mensaje.controller';

const router = express.Router();

/**
 * @swagger
 * /api/grupos:
 *   post:
 *     summary: Crear un nuevo grupo de estudio
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, materiaId]
 *             properties:
 *               nombre: { type: string }
 *               materiaId: { type: string }
 *     responses:
 *       201:
 *         description: Grupo creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Grupo' }
 *   get:
 *     summary: Listar grupos del usuario autenticado
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de grupos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Grupo' }
 */
router.post('/', verificarJWT, GrupoController.crearGrupo);
router.get('/', verificarJWT, GrupoController.listarMisGrupos);

/**
 * @swagger
 * /api/grupos/buscar:
 *   get:
 *     summary: Buscar grupos por nombre o materia
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Grupos encontrados
 */
router.get('/buscar', verificarJWT, GrupoController.buscar);

/**
 * @swagger
 * /api/grupos/disponibles:
 *   get:
 *     summary: Listar grupos disponibles para unirse (mismas materias del usuario)
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Grupos disponibles
 */
router.get('/disponibles', verificarJWT, GrupoController.listarGruposDisponibles);

/**
 * @swagger
 * /api/grupos/mis-solicitudes:
 *   get:
 *     summary: Listar solicitudes de ingreso enviadas por el usuario
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Solicitudes enviadas
 */
router.get('/mis-solicitudes', verificarJWT, GrupoController.listarMisSolicitudes);

/**
 * @swagger
 * /api/grupos/{id}:
 *   get:
 *     summary: Obtener detalle de un grupo
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detalle del grupo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Grupo' }
 */
router.get('/:id', verificarJWT, GrupoController.obtenerGrupo);

/**
 * @swagger
 * /api/grupos/{id}/miembros:
 *   get:
 *     summary: Listar miembros de un grupo
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de miembros
 *   post:
 *     summary: Agregar un miembro al grupo (solo administrador)
 *     tags: [Grupos]
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
 *             required: [usuarioId]
 *             properties:
 *               usuarioId: { type: string }
 *     responses:
 *       200:
 *         description: Miembro agregado
 */
router.get('/:id/miembros', verificarJWT, GrupoController.obtenerMiembrosGrupo);
router.post('/:id/miembros', verificarJWT, GrupoController.agregarMiembro);

/**
 * @swagger
 * /api/grupos/{id}/solicitar-ingreso:
 *   post:
 *     summary: Enviar solicitud de ingreso a un grupo
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Solicitud enviada
 */
router.post('/:id/solicitar-ingreso', verificarJWT, GrupoController.solicitarIngreso);

/**
 * @swagger
 * /api/grupos/{id}/solicitudes:
 *   get:
 *     summary: Listar solicitudes de ingreso al grupo (solo administrador)
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de solicitudes pendientes
 */
router.get('/:id/solicitudes', verificarJWT, GrupoController.listarSolicitudesGrupo);

/**
 * @swagger
 * /api/grupos/{id}/solicitudes/{solicitudId}/aprobar:
 *   patch:
 *     summary: Aprobar solicitud de ingreso
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: solicitudId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Solicitud aprobada
 */
router.patch('/:id/solicitudes/:solicitudId/aprobar', verificarJWT, GrupoController.aprobarSolicitud);

/**
 * @swagger
 * /api/grupos/{id}/solicitudes/{solicitudId}/rechazar:
 *   patch:
 *     summary: Rechazar solicitud de ingreso
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: solicitudId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Solicitud rechazada
 */
router.patch('/:id/solicitudes/:solicitudId/rechazar', verificarJWT, GrupoController.rechazarSolicitud);

/**
 * @swagger
 * /api/grupos/{id}/abandonar:
 *   delete:
 *     summary: Abandonar un grupo
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Grupo abandonado exitosamente
 *       409:
 *         description: El administrador debe transferir el rol antes de abandonar
 */
router.delete('/:id/abandonar', verificarJWT, GrupoController.abandonarGrupo);

/**
 * @swagger
 * /api/grupos/{id}/archivos:
 *   post:
 *     summary: Subir archivo PDF al grupo
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Archivo subido a Cloudinary
 *   get:
 *     summary: Listar archivos del grupo
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de archivos
 */
router.post('/:id/archivos', verificarJWT, procesarUploadArchivoGrupo, GrupoController.subirArchivo);
router.get('/:id/archivos', verificarJWT, GrupoController.listarArchivos);

/**
 * @swagger
 * /api/grupos/{id}/archivos/{archivoId}/descargar:
 *   get:
 *     summary: Descargar un archivo del grupo
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: archivoId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: URL de descarga del archivo
 */
router.get('/:id/archivos/:archivoId/descargar', verificarJWT, GrupoController.descargarArchivo);

/**
 * @swagger
 * /api/grupos/{id}/administrador:
 *   patch:
 *     summary: Transferir rol de administrador a otro miembro
 *     tags: [Grupos]
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
 *             required: [nuevoAdminId]
 *             properties:
 *               nuevoAdminId: { type: string }
 *     responses:
 *       200:
 *         description: Administración transferida
 */
router.patch('/:id/administrador', verificarJWT, GrupoController.cederAdministracion);

/**
 * @swagger
 * /api/grupos/{id}/mensajes:
 *   post:
 *     summary: Enviar mensaje al chat del grupo
 *     tags: [Grupos]
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
 *             required: [contenido]
 *             properties:
 *               contenido: { type: string }
 *     responses:
 *       201:
 *         description: Mensaje enviado
 *   get:
 *     summary: Obtener historial de mensajes del grupo
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Historial de mensajes
 */
router.post('/:id/mensajes', verificarJWT, MensajeController.enviarMensajeGrupo);
router.get('/:id/mensajes', verificarJWT, MensajeController.obtenerHistorialGrupo);

export default router;
