import { EventoModel } from '../models/evento.model';
import { ServiceError } from './service-error';

type CrearEventoInput = {
    titulo: unknown;
    descripcion: unknown;
    lugar: unknown;
    fechaEvento: unknown;
};

export class EventoService {
    static async crear(creadorId: string, input: CrearEventoInput) {
        const { titulo, descripcion, lugar, fechaEvento } = input;

        if (typeof titulo !== 'string' || !titulo.trim()) {
            throw new ServiceError(400, 'Debes enviar un título válido');
        }

        if (typeof descripcion !== 'string' || !descripcion.trim()) {
            throw new ServiceError(400, 'Debes enviar una descripción válida');
        }

        if (typeof lugar !== 'string' || !lugar.trim()) {
            throw new ServiceError(400, 'Debes enviar un lugar válido');
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
            lugar: lugar.trim(),
            fechaEvento: fecha,
            creadorId
        });
    }

    static async listarGlobal(_usuarioId: string) {
        return EventoModel.listarGlobalNoVencidos();
    }
}
