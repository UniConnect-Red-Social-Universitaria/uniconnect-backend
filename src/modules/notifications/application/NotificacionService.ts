import { NotificacionDTO } from '../../../shared/notificacion/INotificacion';
import { INotificacionStrategy, ResultadoEnvio } from '../domain/INotificacionStrategy';
import { CanalNotificacion, TipoNotificacion, PreferenciaCanalRepository } from '../domain/contracts';

export class NotificacionService {
  constructor(
    private readonly estrategias: INotificacionStrategy[],
    private readonly preferenciaRepository: PreferenciaCanalRepository,
  ) {}

  /**
   * Envía una notificación a través de los canales que el usuario
   * haya configurado para ese tipo de evento.
   *
   * @param notificacion  DTO con mensaje, destinatario y timestamp
   * @param usuarioId     ID del usuario receptor (para consultar preferencias)
   * @param tipoEvento    Tipo de evento que origina la notificación (inyectado antes de enviar)
   */
  async notificar(
    notificacion: NotificacionDTO,
    usuarioId: string,
    tipoEvento: TipoNotificacion,
  ): Promise<ResultadoEnvio[]> {
    const preferencias = await this.preferenciaRepository.obtenerPreferencias(usuarioId, tipoEvento);
    const resultados: ResultadoEnvio[] = [];

    // ✅ Inyecta tipoEvento en la notificación antes de enviar:
    const notificacionConTipo = { ...notificacion, tipoEvento };

    for (const estrategia of this.estrategias) {
      if (!preferencias.canalesActivos.includes(estrategia.canal as CanalNotificacion)) {
        continue;
      }
      try {
        // Usa la notificación con el tipo inyectado
        const resultado = await estrategia.enviar(notificacionConTipo); 
        resultados.push(resultado);
      } catch (error) {
        resultados.push({
          canal: estrategia.canal,
          exito: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return resultados;
  }
}