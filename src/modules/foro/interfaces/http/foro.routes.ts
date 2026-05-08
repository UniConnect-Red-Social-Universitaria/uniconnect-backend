import express from 'express';
import { verificarJWT } from '../../../../middleware/autenticacion.middleware';
import { ForoController } from './foro.controller';

const router = express.Router();

router.get('/:materiaId/preguntas', verificarJWT, ForoController.obtenerPreguntas);
router.post('/:materiaId/preguntas', verificarJWT, ForoController.publicarPregunta);

router.get('/preguntas/:preguntaId/respuestas', verificarJWT, ForoController.obtenerRespuestas);
router.post('/preguntas/:preguntaId/respuestas', verificarJWT, ForoController.publicarRespuesta);

router.post('/respuestas/:respuestaId/votos', verificarJWT, ForoController.votarRespuesta);

export default router;
