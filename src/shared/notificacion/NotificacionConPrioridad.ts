import { INotificacion, NotificacionDTO } from './INotificacion';
import { NotificacionDecorator } from './NotificacionDecorator';

export type NivelPrioridad = 'normal' | 'urgente' | 'critica';

export interface NotificacionConPrioridadDTO extends NotificacionDTO {
  nivel: NivelPrioridad;
}

export class NotificacionConPrioridad extends NotificacionDecorator {
  constructor(
    wrapped: INotificacion,
    private readonly nivel: NivelPrioridad,
  ) {
    super(wrapped);
  }

  render(): NotificacionConPrioridadDTO {
    return {
      ...this.wrapped.render(),
      nivel: this.nivel,
    };
  }
}
