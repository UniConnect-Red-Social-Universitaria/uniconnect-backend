import {
  AuthenticatedUser,
  CategoriaEvento,
  CATEGORIAS_EVENTO,
  EventRecord,
  EventRepository,
} from '../../../domain/contracts';
import { ApplicationError } from '../../../shared/application-error';
import { EventoPublicador } from '../../../shared/eventos-observer/EventoPublicador';

export class EventUseCases {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly publicador: EventoPublicador = EventoPublicador.getInstance(),
  ) {}

  async crear(
    usuario: AuthenticatedUser | undefined,
    titulo: unknown,
    descripcion: unknown,
    lugar: unknown,
    fechaEvento: unknown,
    categoria: unknown,
  ) {
    const authUser = this.ensureAuthenticated(usuario);

    if (typeof titulo !== 'string' || !titulo.trim()) {
      throw new ApplicationError(400, 'Debes enviar un título válido');
    }

    if (typeof descripcion !== 'string' || !descripcion.trim()) {
      throw new ApplicationError(400, 'Debes enviar una descripción válida');
    }

    if (lugar !== undefined && typeof lugar !== 'string') {
      throw new ApplicationError(400, 'Debes enviar un lugar válido');
    }

    if (typeof fechaEvento !== 'string') {
      throw new ApplicationError(400, 'Debes enviar fechaEvento en formato ISO');
    }

    const fecha = new Date(fechaEvento);

    if (Number.isNaN(fecha.getTime())) {
      throw new ApplicationError(400, 'fechaEvento tiene formato inválido');
    }

    if (fecha <= new Date()) {
      throw new ApplicationError(400, 'La fecha del evento debe ser futura');
    }

    const categoriaValida: CategoriaEvento =
      typeof categoria === 'string' && (CATEGORIAS_EVENTO as string[]).includes(categoria)
        ? (categoria as CategoriaEvento)
        : 'otro';

    const evento = await this.eventRepository.create({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      lugar: typeof lugar === 'string' && lugar.trim() ? lugar.trim() : 'Por definir',
      fechaEvento: fecha,
      categoria: categoriaValida,
      creadorId: authUser.id,
    });

    this.publicador.notificar(categoriaValida, evento as EventRecord, authUser.id);

    return {
      message: 'Evento creado correctamente',
      data: evento,
    };
  }

  async listarGlobal() {
    const eventos = await this.eventRepository.listUpcoming();
    return { data: eventos };
  }

  async filtrarPorCategoria(categoria: unknown) {
    if (typeof categoria !== 'string' || !(CATEGORIAS_EVENTO as string[]).includes(categoria)) {
      throw new ApplicationError(400, `Categoría inválida. Valores posibles: ${CATEGORIAS_EVENTO.join(', ')}`);
    }

    const eventos = await this.eventRepository.listByCategoria(categoria as CategoriaEvento);
    return { data: eventos };
  }

  private ensureAuthenticated(usuario: AuthenticatedUser | undefined) {
    if (!usuario) {
      throw new ApplicationError(401, 'Usuario no autenticado');
    }

    return usuario;
  }
}
