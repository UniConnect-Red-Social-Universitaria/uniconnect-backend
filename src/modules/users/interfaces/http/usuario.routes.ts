import express from 'express';

import { UsuarioController } from './usuario.controller';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';
import { validarCorreoInstitucional } from '../../../../middleware/correo-institucional.middleware';

const router = express.Router();

router.post('/registro', validarCorreoInstitucional, UsuarioController.registrar);
router.post('/login', UsuarioController.login);
router.get('/', UsuarioController.obtenerTodos);
router.get('/perfil', verificarJWT, UsuarioController.obtenerPerfil);
router.put('/perfil', verificarJWT, UsuarioController.actualizarPerfil);
router.post('/logout', verificarJWT, UsuarioController.logout);
router.get('/buscar-por-materia', verificarJWT, UsuarioController.buscarPorMateria);
router.post('/solicitudes', verificarJWT, UsuarioController.enviarSolicitudConexion);
router.get('/solicitudes-recibidas', verificarJWT, UsuarioController.listarSolicitudesRecibidas);
router.post('/solicitudes/aceptar', verificarJWT, UsuarioController.aceptarSolicitud);
router.get('/companeros', verificarJWT, UsuarioController.listarCompaneros);
router.delete('/:id', UsuarioController.eliminarUsuario);

export default router;