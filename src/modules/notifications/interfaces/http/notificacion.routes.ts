import { Router } from 'express';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';
import { NotificacionController } from './notificacion.controller';

const router = Router();

router.get('/preferencias/:tipoEvento', verificarJWT, NotificacionController.obtenerPreferencias);
router.put('/preferencias/:tipoEvento', verificarJWT, NotificacionController.actualizarPreferencias);
router.post('/prueba', verificarJWT, NotificacionController.enviarPrueba);

export default router;
