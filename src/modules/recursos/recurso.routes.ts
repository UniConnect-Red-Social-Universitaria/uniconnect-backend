import { Router } from 'express';
import { recursoController } from './recurso.controller';
import { verificarJWT } from '../../middleware/autenticacion.middleware';

const router = Router();

router.post('/', verificarJWT, recursoController.crearRecurso);
router.get('/grupo/:grupoId', verificarJWT, recursoController.obtenerRecursos);
router.put('/:id', verificarJWT, recursoController.editarRecurso);
router.delete('/:id', verificarJWT, recursoController.eliminarRecurso);

export default router;