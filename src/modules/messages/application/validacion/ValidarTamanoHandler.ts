import { MensajeContexto, ResultadoValidacion } from '../../domain/IValidadorMensajeHandler';
import { ValidadorMensajeBase } from './ValidadorMensajeBase';

const LONGITUD_MAXIMA = 1000;

export class ValidarTamanoHandler extends ValidadorMensajeBase {
  protected validar(mensaje: MensajeContexto): ResultadoValidacion {
    if (!mensaje.contenido || mensaje.contenido.trim().length === 0) {
      return { valido: false, error: 'El mensaje no puede estar vacío' };
    }
    if (mensaje.contenido.length > LONGITUD_MAXIMA) {
      return {
        valido: false,
        error: `El mensaje no puede superar ${LONGITUD_MAXIMA} caracteres`,
      };
    }
    return { valido: true };
  }
}
