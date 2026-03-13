import express from 'express';

import { MateriaController } from './materia.controller';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';

const router = express.Router();

router.post('/', verificarJWT, MateriaController.crear);
router.get('/', MateriaController.listar);

export default router;