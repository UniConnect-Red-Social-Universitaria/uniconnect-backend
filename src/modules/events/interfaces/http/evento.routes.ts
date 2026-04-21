import express from 'express';

import { EventoController } from './evento.controller';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';

const router = express.Router();

router.get('/', verificarJWT, EventoController.listarGlobal);
router.post('/', verificarJWT, EventoController.crear);
router.post('/suscripciones', verificarJWT, EventoController.suscribir);
router.delete('/suscripciones/:categoria', verificarJWT, EventoController.desuscribir);

export default router;
