import { NotificacionDTO } from '../../../../shared/notificacion/INotificacion';
import { logger } from '../../../../lib/logger';
import { INotificacionStrategy, ResultadoEnvio } from '../../domain/INotificacionStrategy';

/**
 * Canal adicional que demuestra el principio Open/Closed:
 * se agrega sin modificar NotificacionService ni las estrategias existentes.
 */
export class ResumenDiarioStrategy implements INotificacionStrategy {
  readonly canal = 'resumen-diario';

  private cola: Array<NotificacionDTO & { encola: Date }> = [];

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    this.cola.push({ ...notificacion, encola: new Date() });
    logger.info(
      `[ResumenDiario] Notificación encolada para ${notificacion.destinatario} (${this.cola.length} pendientes)`,
    );

    return { canal: this.canal, exito: true };
  }

  flushResumen(): void {
    if (this.cola.length === 0) return;
    logger.info(`[ResumenDiario] Enviando resumen con ${this.cola.length} notificaciones`);
    this.cola = [];
  }
}
