import { NotificacionDTO } from '../../../../shared/notificacion/INotificacion';
import { logger } from '../../../../lib/logger';
import { INotificacionStrategy, ResultadoEnvio } from '../../domain/INotificacionStrategy';

export class EmailInstitucionalStrategy implements INotificacionStrategy {
  readonly canal = 'email';

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    logger.info(
      `[Email] Para: ${notificacion.destinatario} | Asunto: Notificación UniConnect | ${notificacion.mensaje}`,
    );

    return { canal: this.canal, exito: true };
  }
}
