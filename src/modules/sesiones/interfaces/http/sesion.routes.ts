import { Router } from 'express';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';
import { SesionController } from './sesion.controller';

const router = Router();

router.post('/series', verificarJWT, SesionController.crearSerie);
router.get('/', verificarJWT, SesionController.obtenerSesiones);
router.patch('/:sesionId', verificarJWT, SesionController.modificarSesion);
router.post('/:sesionId/cancelar', verificarJWT, SesionController.cancelarSesion);

export default router;
