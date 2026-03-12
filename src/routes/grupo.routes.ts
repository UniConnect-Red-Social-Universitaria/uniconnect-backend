import express from 'express';
import { GrupoController } from '../controllers/grupo.controller';
import { verificarJWT } from '../middleware/autenticacion.middleware';
import { GrupoArchivoController } from '../controllers/grupo-archivo.controller';
import { procesarUploadArchivoGrupo } from '../middleware/archivo-grupo.middleware';

const router = express.Router();

router.post('/', verificarJWT, GrupoController.crearGrupo);
router.get('/', verificarJWT, GrupoController.listarMisGrupos);
router.get('/buscar', verificarJWT, GrupoController.buscar);
router.get('/disponibles', verificarJWT, GrupoController.listarDisponibles);
router.patch('/:grupoId/cerrar', verificarJWT, GrupoController.cerrarGrupo);
router.post('/:grupoId/administrador', verificarJWT, GrupoController.cambiarAdministrador);
router.post('/:grupoId/salir', verificarJWT, GrupoController.salirGrupo);
router.post('/:grupoId/unirse', verificarJWT, GrupoController.unirseGrupo);
router.post('/:grupoId/miembros', verificarJWT, GrupoController.agregarMiembro);
router.delete('/:grupoId/miembros/:usuarioId', verificarJWT, GrupoController.removerMiembro);
router.post('/:grupoId/archivos', verificarJWT, procesarUploadArchivoGrupo, GrupoArchivoController.subirPdf);
router.get('/:grupoId/archivos', verificarJWT, GrupoArchivoController.listarPdfGrupo);
router.get('/:grupoId/archivos/:archivoId/descargar', verificarJWT, GrupoArchivoController.descargarPdfGrupo);
router.get('/:grupoId/:archivoId/descargar', verificarJWT, GrupoArchivoController.descargarPdfGrupo);

export default router;
