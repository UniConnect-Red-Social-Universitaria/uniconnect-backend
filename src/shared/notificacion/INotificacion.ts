export interface NotificacionDTO {
  mensaje: string;
  destinatario: string;
  timestamp: Date;
}

export interface INotificacion {
  getMensaje(): string;
  getDestinatario(): string;
  getTimestamp(): Date;
  render(): NotificacionDTO;
}

export class NotificacionBase implements INotificacion {
  constructor(
    private readonly mensaje: string,
    private readonly destinatario: string,
    private readonly timestamp: Date = new Date(),
  ) {}

  getMensaje(): string {
    return this.mensaje;
  }

  getDestinatario(): string {
    return this.destinatario;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  render(): NotificacionDTO {
    return {
      mensaje: this.mensaje,
      destinatario: this.destinatario,
      timestamp: this.timestamp,
    };
  }
}
