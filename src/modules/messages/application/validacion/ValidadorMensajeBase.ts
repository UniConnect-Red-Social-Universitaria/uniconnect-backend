import { IValidadorMensajeHandler, MensajeContexto, ResultadoValidacion } from '../../domain/IValidadorMensajeHandler';

export abstract class ValidadorMensajeBase implements IValidadorMensajeHandler {
  private siguiente: IValidadorMensajeHandler | null = null;

  setSiguiente(handler: IValidadorMensajeHandler): IValidadorMensajeHandler {
    this.siguiente = handler;
    return handler;
  }

  manejar(mensaje: MensajeContexto): ResultadoValidacion {
    const resultado = this.validar(mensaje);
    if (!resultado.valido) return resultado;
    if (this.siguiente) return this.siguiente.manejar(mensaje);
    return { valido: true };
  }

  protected abstract validar(mensaje: MensajeContexto): ResultadoValidacion;
}
