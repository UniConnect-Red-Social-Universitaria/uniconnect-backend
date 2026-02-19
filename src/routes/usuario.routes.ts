import express from 'express';
import { UsuarioController } from '../controllers/usuario.controller';

const router = express.Router();

router.post('/registro', UsuarioController.registrar);
router.get('/', UsuarioController.obtenerTodos);

export default router;