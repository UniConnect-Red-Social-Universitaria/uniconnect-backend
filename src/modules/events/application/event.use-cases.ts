import { AuthenticatedUser, EventRepository } from '../../../domain/contracts';
import { ApplicationError } from '../../../shared/application-error';

export class EventUseCases {
  constructor(private readonly eventRepository: EventRepository) {}

  async crear(
    usuario: AuthenticatedUser | undefined,
    titulo: unknown,
    descripcion: unknown,
    lugar: unknown,
    fechaEvento: unknown,
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

    const evento = await this.eventRepository.create({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      lugar: typeof lugar === 'string' && lugar.trim() ? lugar.trim() : 'Por definir',
      fechaEvento: fecha,
      creadorId: authUser.id,
    });

    return {
      message: 'Evento creado correctamente',
      data: evento,
    };
  }

  async listarGlobal() {
    const eventos = await this.eventRepository.listUpcoming();
    return { data: eventos };
  }

  private ensureAuthenticated(usuario: AuthenticatedUser | undefined) {
    if (!usuario) {
      throw new ApplicationError(401, 'Usuario no autenticado');
    }

    return usuario;
  }
}