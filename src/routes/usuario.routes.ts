import express from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import { verificarJWT } from '../middleware/autenticacion.middleware';

const router = express.Router();

// Rutas públicas
router.post('/registro', UsuarioController.registrar);
router.post('/login', UsuarioController.login);
router.get('/', UsuarioController.obtenerTodos);

// Rutas protegidas (requieren JWT)
router.get('/perfil', verificarJWT, UsuarioController.obtenerPerfil);
router.put('/perfil', verificarJWT, UsuarioController.actualizarPerfil);
router.get('/buscar-por-materia', verificarJWT, UsuarioController.buscarPorMateria);
router.post('/solicitudes', verificarJWT, UsuarioController.enviarSolicitudConexion);
router.get('/solicitudes-recibidas', verificarJWT, UsuarioController.listarSolicitudesRecibidas);
router.post('/solicitudes/aceptar', verificarJWT, UsuarioController.aceptarSolicitud);
router.get('/companeros', verificarJWT, UsuarioController.listarCompaneros);

export default router;