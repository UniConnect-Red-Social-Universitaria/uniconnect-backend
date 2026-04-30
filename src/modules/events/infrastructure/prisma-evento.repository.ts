import { CategoriaEvento, EventRepository } from '../../../domain/contracts';
import { EventoModel } from '../../../models/evento.model';

export class PrismaEventoRepository implements EventRepository {
  async create(data: {
    titulo: string;
    descripcion: string;
    lugar: string;
    fechaEvento: Date;
    categoria: CategoriaEvento;
    creadorId: string;
  }) {
    return EventoModel.crear(data) as Promise<any>;
  }

  async listUpcoming() {
    return EventoModel.listarGlobalNoVencidos() as Promise<any>;
  }

  async listByCategoria(categoria: CategoriaEvento) {
    return EventoModel.listarPorCategoria(categoria) as Promise<any>;
  }
}
