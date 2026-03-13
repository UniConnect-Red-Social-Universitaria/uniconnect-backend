import { EventRepository } from '../../../domain/contracts';
import { EventoModel } from '../../../models/evento.model';

export class PrismaEventoRepository implements EventRepository {
  async create(data: {
    titulo: string;
    descripcion: string;
    fechaEvento: Date;
    creadorId: string;
  }) {
    return EventoModel.crear(data);
  }

  async listUpcoming() {
    return EventoModel.listarGlobalNoVencidos();
  }
}