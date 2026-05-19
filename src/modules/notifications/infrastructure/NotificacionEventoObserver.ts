import { EventRecord, CategoriaEvento } from "../../../domain/contracts";
import { IEventoObserver } from "../../../shared/eventos-observer/IEventoObserver";
import { NotificacionBase } from "../../../shared/notificacion/INotificacion";
import { NotificacionService } from "../application/NotificacionService";
import { TipoNotificacion } from "../domain/contracts";

// Mapa de categoria → tipoEvento exacto que usás en preferencias
const CATEGORIA_A_TIPO_EVENTO: Partial<Record<string, TipoNotificacion>> = {
  academico: "evento-academico",
  cultural: "evento-cultural",
  deportivo: "evento-deportivo",
  otro: "evento-otro",
};

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

    // ✅ Traducir la categoría al tipoEvento que el repositorio conoce
    const tipoEvento: TipoNotificacion =
      CATEGORIA_A_TIPO_EVENTO[evento.categoria] ?? "evento-otro";

    this.notificacionService
      .notificar(notificacion.render(), this.usuarioId, tipoEvento)
      .catch((error) => {
        console.error(
          "[NotificacionEventoObserver] Error al notificar:",
          error,
        );
      });
  }

  getUsuarioId(): string {
    return this.usuarioId;
  }
}
