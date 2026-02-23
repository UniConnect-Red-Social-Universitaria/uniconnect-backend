import express from 'express';
import { CatalogoController } from '../controllers/catalogo.controller';
import { verificarJWT } from '../middleware/autenticacion.middleware';

const router = express.Router();

router.post('/poblar', verificarJWT, CatalogoController.poblar);
router.get('/', CatalogoController.listar);

export default router;
