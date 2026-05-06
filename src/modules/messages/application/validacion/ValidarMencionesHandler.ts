import { MensajeContexto, ResultadoValidacion } from '../../domain/IValidadorMensajeHandler';
import { ValidadorMensajeBase } from './ValidadorMensajeBase';

// Menciones válidas: @palabra con solo letras, números, puntos o guiones bajos
const MENCION_VALIDA = /^[a-zA-Z0-9._]+$/;

export class ValidarMencionesHandler extends ValidadorMensajeBase {
  protected validar(mensaje: MensajeContexto): ResultadoValidacion {
    const menciones = mensaje.contenido.match(/@(\S+)/g);
    if (!menciones) return { valido: true };

    for (const mencion of menciones) {
      const nombre = mencion.slice(1); // quita el @
      if (!MENCION_VALIDA.test(nombre)) {
        return {
          valido: false,
          error: `La mención "${mencion}" tiene formato inválido. Solo se permiten letras, números, puntos y guiones bajos`,
        };
      }
    }

    return { valido: true };
  }
}
