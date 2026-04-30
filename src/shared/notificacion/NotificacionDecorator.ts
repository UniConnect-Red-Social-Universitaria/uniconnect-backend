import { INotificacion, NotificacionDTO } from './INotificacion';

export abstract class NotificacionDecorator implements INotificacion {
  constructor(protected readonly wrapped: INotificacion) {}

  getMensaje(): string {
    return this.wrapped.getMensaje();
  }

  getDestinatario(): string {
    return this.wrapped.getDestinatario();
  }

  getTimestamp(): Date {
    return this.wrapped.getTimestamp();
  }

  render(): NotificacionDTO {
    return this.wrapped.render();
  }
}
