import { MensajeContexto, ResultadoValidacion } from '../../domain/IValidadorMensajeHandler';
import { ValidadorMensajeBase } from './ValidadorMensajeBase';

export interface PermisosChecker {
  esMiembroDeGrupo(emisorId: string, grupoId: string): boolean;
  tieneRelacionAceptada(emisorId: string, receptorId: string): boolean;
}

export class ValidarPermisosHandler extends ValidadorMensajeBase {
  constructor(private readonly checker: PermisosChecker) {
    super();
  }

  protected validar(mensaje: MensajeContexto): ResultadoValidacion {
    if (mensaje.grupoId) {
      if (!this.checker.esMiembroDeGrupo(mensaje.emisorId, mensaje.grupoId)) {
        return { valido: false, error: 'Solo los miembros pueden enviar mensajes al grupo' };
      }
      return { valido: true };
    }

    if (mensaje.receptorId) {
      if (mensaje.emisorId === mensaje.receptorId) {
        return { valido: false, error: 'No puedes enviarte mensajes a ti mismo' };
      }
      if (!this.checker.tieneRelacionAceptada(mensaje.emisorId, mensaje.receptorId)) {
        return { valido: false, error: 'Solo puedes chatear con compañeros agregados' };
      }
      return { valido: true };
    }

    return { valido: false, error: 'El mensaje debe tener un destinatario' };
  }
}
