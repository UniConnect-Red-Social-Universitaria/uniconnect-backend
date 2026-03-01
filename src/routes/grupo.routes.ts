import express from 'express';
import { GrupoController } from '../controllers/grupo.controller';
import { verificarJWT } from '../middleware/autenticacion.middleware';

const router = express.Router();

router.post('/', verificarJWT, GrupoController.crearGrupo);
router.get('/', verificarJWT, GrupoController.listarMisGrupos);
router.post('/:grupoId/unirse', verificarJWT, GrupoController.unirseGrupo);
router.post('/:grupoId/miembros', verificarJWT, GrupoController.agregarMiembro);

export default router;
