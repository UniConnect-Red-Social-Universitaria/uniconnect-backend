import express from 'express';

import { MensajeController } from './mensaje.controller';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';

const router = express.Router();

router.post('/', verificarJWT, MensajeController.enviarMensaje);
router.get('/:companeroId', verificarJWT, MensajeController.obtenerHistorial);

export default router;