import express from 'express';
import { GrupoController } from '../controllers/grupo.controller';
import { verificarJWT } from '../middleware/autenticacion.middleware';

const router = express.Router();

router.post('/', verificarJWT, GrupoController.crearGrupo);

export default router;
