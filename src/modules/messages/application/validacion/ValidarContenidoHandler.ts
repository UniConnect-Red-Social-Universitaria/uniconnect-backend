import { MensajeContexto, ResultadoValidacion } from '../../domain/IValidadorMensajeHandler';
import { ValidadorMensajeBase } from './ValidadorMensajeBase';

const PALABRAS_PROHIBIDAS = ['spam', 'phishing', 'scam'];

export class ValidarContenidoHandler extends ValidadorMensajeBase {
  protected validar(mensaje: MensajeContexto): ResultadoValidacion {
    const contenidoNormalizado = mensaje.contenido.trim().toLowerCase();

    if (/^\s*$/.test(mensaje.contenido)) {
      return { valido: false, error: 'El contenido no puede ser solo espacios' };
    }

    const palabraProhibida = PALABRAS_PROHIBIDAS.find((p) =>
      contenidoNormalizado.includes(p),
    );
    if (palabraProhibida) {
      return {
        valido: false,
        error: `El mensaje contiene contenido no permitido: "${palabraProhibida}"`,
      };
    }

    return { valido: true };
  }
}
