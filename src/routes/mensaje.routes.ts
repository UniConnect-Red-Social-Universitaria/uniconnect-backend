import express from 'express';
import { verificarJWT } from '../middleware/autenticacion.middleware';
import { MensajeController } from '../controllers/mensaje.controller';

const router = express.Router();

router.post('/grupos', verificarJWT, MensajeController.enviarMensajeGrupo);
router.get('/grupos/:grupoId', verificarJWT, MensajeController.obtenerHistorialGrupo);
router.post('/', verificarJWT, MensajeController.enviarMensaje);
router.get('/:companeroId', verificarJWT, MensajeController.obtenerHistorial);

export default router;
