import { IForoHandler } from '../../domain/IForoHandler';
import { ValidarAutenticacionForoHandler } from './ValidarAutenticacionForoHandler';
import { ValidarContenidoForoHandler } from './ValidarContenidoForoHandler';
import { ValidarMatriculaForoHandler } from './ValidarMatriculaForoHandler';

export function crearCadenaForo(): IForoHandler {
  const autenticacion = new ValidarAutenticacionForoHandler();
  const matricula = new ValidarMatriculaForoHandler();
  const contenido = new ValidarContenidoForoHandler();

  autenticacion.setSiguiente(matricula).setSiguiente(contenido);

  return autenticacion;
}
