import express from 'express';

import { EventoController } from './evento.controller';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';

const router = express.Router();

router.post('/', verificarJWT, EventoController.crear);
router.get('/', verificarJWT, EventoController.listarGlobal);

export default router;