import { IValidadorMensajeHandler } from '../../domain/IValidadorMensajeHandler';
import { ValidarTamanoHandler } from './ValidarTamanoHandler';
import { ValidarContenidoHandler } from './ValidarContenidoHandler';
import { ValidarMencionesHandler } from './ValidarMencionesHandler';
import { PermisosChecker, ValidarPermisosHandler } from './ValidarPermisosHandler';
import { ValidarAdjuntoHandler } from './ValidarAdjuntoHandler';

export function crearCadenaValidacion(checker: PermisosChecker): IValidadorMensajeHandler {
  const tamano = new ValidarTamanoHandler();
  const contenido = new ValidarContenidoHandler();
  const menciones = new ValidarMencionesHandler();
  const permisos = new ValidarPermisosHandler(checker);
  const adjunto = new ValidarAdjuntoHandler();

  tamano
    .setSiguiente(contenido)
    .setSiguiente(menciones)
    .setSiguiente(permisos)
    .setSiguiente(adjunto);

  return tamano;
}
