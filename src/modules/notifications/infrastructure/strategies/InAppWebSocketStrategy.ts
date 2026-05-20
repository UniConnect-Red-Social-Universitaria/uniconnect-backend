import { NotificacionDTO } from '../../../../shared/notificacion/INotificacion';
import { emitirNotificacion } from '../../../../lib/socket';
import { INotificacionStrategy, ResultadoEnvio } from '../../domain/INotificacionStrategy';

export class InAppWebSocketStrategy implements INotificacionStrategy {
  readonly canal = 'in-app';

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    emitirNotificacion(notificacion.destinatario, {
      mensaje: notificacion.mensaje,
      timestamp: notificacion.timestamp,
      tipoEvento: notificacion.tipoEvento, // ← AGREGA esta línea
    });

    return { canal: this.canal, exito: true };
  }
}
