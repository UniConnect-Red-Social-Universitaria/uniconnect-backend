import { INotificacion, NotificacionDTO } from './INotificacion';
import { NotificacionDecorator } from './NotificacionDecorator';

export interface EncuestaNotificacion {
    encuestaId: string;
    grupoId: string;
    pregunta: string;
    estado: 'OPEN' | 'CLOSED';
    totalOpciones: number;
    autoCloseAt?: Date | null;
}

export interface NotificacionConEncuestaDTO extends NotificacionDTO {
    encuesta: EncuestaNotificacion;
}

export class NotificacionConEncuesta extends NotificacionDecorator {
    constructor(
        wrapped: INotificacion,
        private readonly encuesta: EncuestaNotificacion,
    ) {
        super(wrapped);
    }

    render(): NotificacionConEncuestaDTO {
        return {
            ...this.wrapped.render(),
            encuesta: this.encuesta,
        };
    }
}