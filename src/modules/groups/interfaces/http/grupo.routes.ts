import express from 'express';

import { GrupoController } from './grupo.controller';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';
import { procesarUploadArchivoGrupo } from '../../../../middleware/archivo-grupo.middleware';

const router = express.Router();

router.post('/', verificarJWT, GrupoController.crearGrupo);
router.get('/', verificarJWT, GrupoController.listarMisGrupos);
router.get('/disponibles', verificarJWT, GrupoController.listarGruposDisponibles);
router.post('/:id/unirse', verificarJWT, GrupoController.unirseAGrupo);
router.post('/:id/miembros', verificarJWT, GrupoController.agregarMiembro);
router.post('/:id/archivos', verificarJWT, procesarUploadArchivoGrupo, GrupoController.subirArchivo);
router.get('/:id/archivos', verificarJWT, GrupoController.listarArchivos);
router.get('/:id/archivos/:archivoId/descargar', verificarJWT, GrupoController.descargarArchivo);
router.patch('/:id/administrador', verificarJWT, GrupoController.cederAdministracion);

export default router;
