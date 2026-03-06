import { EventoModel } from '../models/evento.model';
import { ServiceError } from './service-error';

type CrearEventoInput = {
    titulo: unknown;
    descripcion: unknown;
    fechaEvento: unknown;
};

export class EventoService {
    static async crear(creadorId: string, input: CrearEventoInput) {
        const { titulo, descripcion, fechaEvento } = input;

        if (typeof titulo !== 'string' || !titulo.trim()) {
            throw new ServiceError(400, 'Debes enviar un título válido');
        }

        if (typeof descripcion !== 'string' || !descripcion.trim()) {
            throw new ServiceError(400, 'Debes enviar una descripción válida');
        }

        if (typeof fechaEvento !== 'string') {
            throw new ServiceError(400, 'Debes enviar fechaEvento en formato ISO');
        }

        const fecha = new Date(fechaEvento);

        if (Number.isNaN(fecha.getTime())) {
            throw new ServiceError(400, 'fechaEvento tiene formato inválido');
        }

        if (fecha <= new Date()) {
            throw new ServiceError(400, 'La fecha del evento debe ser futura');
        }

        return EventoModel.crear({
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            fechaEvento: fecha,
            creadorId
        });
    }

    static async listarGlobal(usuarioId: string) {
        return EventoModel.listarGlobalNoVencidosDeOtros(usuarioId);
    }
}
