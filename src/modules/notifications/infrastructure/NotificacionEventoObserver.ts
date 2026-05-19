import { CategoriaEvento, EventRecord } from '../../../domain/contracts';
import { IEventoObserver } from '../../../shared/eventos-observer/IEventoObserver';
import { NotificacionBase } from '../../../shared/notificacion/INotificacion';
import { NotificacionService } from '../application/NotificacionService';
import { TipoNotificacion } from '../domain/contracts';

/** Mapea CategoriaEvento al TipoNotificacion unificado */
function categoriaATipo(categoria: CategoriaEvento): TipoNotificacion {
  switch (categoria) {
    case 'academico':  return 'evento-academico';
    case 'cultural':   return 'evento-cultural';
    case 'deportivo':  return 'evento-deportivo';
    default:           return 'evento-otro';
  }
}

export class NotificacionEventoObserver implements IEventoObserver {
  constructor(
    private readonly usuarioId: string,
    private readonly notificacionService: NotificacionService,
  ) {}

  onNuevoEvento(evento: EventRecord): void {
    const notificacion = new NotificacionBase(
      `Nuevo evento: ${evento.titulo}`,
      this.usuarioId,
    );

    this.notificacionService
      .notificar(notificacion.render(), this.usuarioId, categoriaATipo(evento.categoria))
      .catch((error) => {
        console.error('[NotificacionEventoObserver] Error al notificar:', error);
      });
  }

  getUsuarioId(): string {
    return `notif:${this.usuarioId}`;
  }
}
