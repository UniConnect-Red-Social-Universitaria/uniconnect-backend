import { MensajeContexto, ResultadoValidacion } from '../../domain/IValidadorMensajeHandler';
import { ValidadorMensajeBase } from './ValidadorMensajeBase';

const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Demuestra Open/Closed: handler agregado sin modificar los existentes ni la cadena base.
 * Solo actúa cuando el mensaje trae adjunto; si no, pasa al siguiente.
 */
export class ValidarAdjuntoHandler extends ValidadorMensajeBase {
  protected validar(mensaje: MensajeContexto): ResultadoValidacion {
    if (!mensaje.adjuntoMimeType && mensaje.adjuntoTamanoBytes === undefined) {
      return { valido: true };
    }

    if (mensaje.adjuntoMimeType && !MIME_PERMITIDOS.includes(mensaje.adjuntoMimeType)) {
      return {
        valido: false,
        error: `Tipo de adjunto no permitido: ${mensaje.adjuntoMimeType}`,
      };
    }

    if (mensaje.adjuntoTamanoBytes !== undefined && mensaje.adjuntoTamanoBytes > TAMANO_MAXIMO_BYTES) {
      return {
        valido: false,
        error: `El adjunto supera el tamaño máximo de ${TAMANO_MAXIMO_BYTES / (1024 * 1024)} MB`,
      };
    }

    return { valido: true };
  }
}
