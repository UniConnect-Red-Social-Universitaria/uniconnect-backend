export interface ResultadoValidacion {
  valido: boolean;
  error?: string;
}

export interface MensajeContexto {
  emisorId: string;
  contenido: string;
  grupoId?: string;
  receptorId?: string;
  adjuntoMimeType?: string;
  adjuntoTamanoBytes?: number;
}

export interface IValidadorMensajeHandler {
  setSiguiente(handler: IValidadorMensajeHandler): IValidadorMensajeHandler;
  manejar(mensaje: MensajeContexto): ResultadoValidacion;
}
