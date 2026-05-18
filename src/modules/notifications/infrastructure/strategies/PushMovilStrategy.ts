import { NotificacionDTO } from '../../../../shared/notificacion/INotificacion';
import { logger } from '../../../../lib/logger';
import { INotificacionStrategy, ResultadoEnvio } from '../../domain/INotificacionStrategy';

export class PushMovilStrategy implements INotificacionStrategy {
  readonly canal = 'push';

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    logger.info(
      `[Push] Dispositivo: ${notificacion.destinatario} | ${notificacion.mensaje}`,
    );

    return { canal: this.canal, exito: true };
  }
}
