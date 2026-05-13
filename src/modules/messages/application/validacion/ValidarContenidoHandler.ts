import { MensajeContexto, ResultadoValidacion } from '../../domain/IValidadorMensajeHandler';
import { ValidadorMensajeBase } from './ValidadorMensajeBase';
import { findModerationViolation } from '../../../../shared/moderation/content-moderation';

export class ValidarContenidoHandler extends ValidadorMensajeBase {
  protected validar(mensaje: MensajeContexto): ResultadoValidacion {
    const violacion = findModerationViolation(mensaje.contenido);

    if (violacion) {
      return { valido: false, error: violacion };
    }

    return { valido: true };
  }
}
