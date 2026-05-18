import express from 'express';

import { UsuarioController } from './usuario.controller';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';
import { validarCorreoInstitucional } from '../../../../middleware/correo-institucional.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/usuarios/registro:
 *   post:
 *     summary: Registrar nuevo usuario con correo institucional
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, apellido, correo, contrasena]
 *             properties:
 *               nombre: { type: string }
 *               apellido: { type: string }
 *               correo: { type: string, format: email }
 *               contrasena: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Correo no institucional o datos inválidos
 */
router.post('/registro', validarCorreoInstitucional, UsuarioController.registrar);

/**
 * @swagger
 * /api/usuarios/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo, contrasena]
 *             properties:
 *               correo: { type: string, format: email }
 *               contrasena: { type: string }
 *     responses:
 *       200:
 *         description: Login exitoso, retorna JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string }
 *                     usuario: { $ref: '#/components/schemas/Usuario' }
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', UsuarioController.login);

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Usuario' }
 */
router.get('/', UsuarioController.obtenerTodos);

/**
 * @swagger
 * /api/usuarios/perfil:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Usuario' }
 *   put:
 *     summary: Actualizar perfil del usuario autenticado
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string }
 *               apellido: { type: string }
 *               bio: { type: string }
 *               fotoPerfil: { type: string }
 *     responses:
 *       200:
 *         description: Perfil actualizado
 */
router.get('/perfil', verificarJWT, UsuarioController.obtenerPerfil);
router.put('/perfil', verificarJWT, UsuarioController.actualizarPerfil);

/**
 * @swagger
 * /api/usuarios/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada
 */
router.post('/logout', verificarJWT, UsuarioController.logout);

/**
 * @swagger
 * /api/usuarios/buscar:
 *   get:
 *     summary: Búsqueda global de usuarios por nombre o correo
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 */
router.get('/buscar', verificarJWT, UsuarioController.buscarGlobal);

/**
 * @swagger
 * /api/usuarios/buscar-por-materia:
 *   get:
 *     summary: Buscar usuarios que cursan una materia
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: materia
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Usuarios encontrados
 */
router.get('/buscar-por-materia', verificarJWT, UsuarioController.buscarPorMateria);
router.post('/buscar-por-materia', verificarJWT, UsuarioController.buscarPorMateria);

/**
 * @swagger
 * /api/usuarios/solicitudes:
 *   post:
 *     summary: Enviar solicitud de conexión a otro usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [destinatarioId]
 *             properties:
 *               destinatarioId: { type: string }
 *     responses:
 *       201:
 *         description: Solicitud enviada
 */
router.post('/solicitudes', verificarJWT, UsuarioController.enviarSolicitudConexion);

/**
 * @swagger
 * /api/usuarios/solicitudes-recibidas:
 *   get:
 *     summary: Listar solicitudes de conexión recibidas pendientes
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes recibidas
 */
router.get('/solicitudes-recibidas', verificarJWT, UsuarioController.listarSolicitudesRecibidas);

/**
 * @swagger
 * /api/usuarios/solicitudes/aceptar:
 *   post:
 *     summary: Aceptar solicitud de conexión
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [solicitudId]
 *             properties:
 *               solicitudId: { type: string }
 *     responses:
 *       200:
 *         description: Solicitud aceptada, ahora son compañeros
 */
router.post('/solicitudes/aceptar', verificarJWT, UsuarioController.aceptarSolicitud);

/**
 * @swagger
 * /api/usuarios/solicitudes/rechazar:
 *   post:
 *     summary: Rechazar solicitud de conexión
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [solicitudId]
 *             properties:
 *               solicitudId: { type: string }
 *     responses:
 *       200:
 *         description: Solicitud rechazada
 */
router.post('/solicitudes/rechazar', verificarJWT, UsuarioController.rechazarSolicitud);

/**
 * @swagger
 * /api/usuarios/companeros:
 *   get:
 *     summary: Listar compañeros (conexiones aceptadas)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de compañeros
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Usuario' }
 */
router.get('/companeros', verificarJWT, UsuarioController.listarCompaneros);

/**
 * @swagger
 * /api/usuarios/perfil/{id}:
 *   get:
 *     summary: Obtener perfil público de un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Perfil público
 */
router.get('/perfil/:id', UsuarioController.obtenerPerfilPublico);

/**
 * @swagger
 * /api/usuarios/perfil/{id}/estadisticas:
 *   get:
 *     summary: Obtener perfil enriquecido con estadísticas
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Perfil con estadísticas de grupos, eventos y materias
 */
router.get('/perfil/:id/estadisticas', verificarJWT, UsuarioController.obtenerPerfilEnriquecido);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar usuario por ID (admin)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
router.delete('/:id', UsuarioController.eliminarUsuario);

export default router;
