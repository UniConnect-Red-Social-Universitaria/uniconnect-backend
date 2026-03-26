import express from 'express';

import { GrupoController } from './grupo.controller';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';

const router = express.Router();

router.post('/', verificarJWT, GrupoController.crearGrupo);
router.get('/', verificarJWT, GrupoController.listarMisGrupos);
router.get('/buscar', verificarJWT, GrupoController.buscar);
router.get('/disponibles', verificarJWT, GrupoController.listarGruposDisponibles);
router.post('/:id/unirse', verificarJWT, GrupoController.unirseAGrupo);

export default router;