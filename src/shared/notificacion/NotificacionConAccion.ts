import { INotificacion, NotificacionDTO } from './INotificacion';
import { NotificacionDecorator } from './NotificacionDecorator';

export interface Accion {
  label: string;
  endpoint: string;
}

export interface NotificacionConAccionDTO extends NotificacionDTO {
  accion: Accion;
}

export class NotificacionConAccion extends NotificacionDecorator {
  constructor(
    wrapped: INotificacion,
    private readonly accion: Accion,
  ) {
    super(wrapped);
  }

  render(): NotificacionConAccionDTO {
    return {
      ...this.wrapped.render(),
      accion: this.accion,
    };
  }
}
