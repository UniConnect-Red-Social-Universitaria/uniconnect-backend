import { NotificacionDTO } from "../../../../shared/notificacion/INotificacion";
import { logger } from "../../../../lib/logger";
import {
  INotificacionStrategy,
  ResultadoEnvio,
} from "../../domain/INotificacionStrategy";
import * as nodemailer from "nodemailer";

// Asumo que tienes una interfaz parecida a esta en tu dominio
interface IUsuarioRepository {
  obtenerEmailPorId(usuarioId: string): Promise<string | null>;
}

export class EmailInstitucionalStrategy implements INotificacionStrategy {
  readonly canal = "email";

  constructor(
    private readonly transporter: nodemailer.Transporter,
    private readonly usuarioRepository: IUsuarioRepository, // Inyectamos esto para buscar el correo
  ) {}

  // ✅ Agrega verificación explícita del resultado y no relances:
  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    try {
      // 1. Obtener el email real a partir del ID del destinatario
      const emailReal = await this.usuarioRepository.obtenerEmailPorId(
        notificacion.destinatario,
      );

      if (!emailReal) {
        return {
          // ← retorna en lugar de lanzar, el Service ya lo maneja
          canal: this.canal,
          exito: false,
          error: `Usuario ${notificacion.destinatario} no tiene email registrado`,
        };
      }

      // 2. Enviar el correo
      const info = await this.transporter.sendMail({
        from: '"UniConnect" <jackeline.rivera23296@ucaldas.edu.co>',
        to: emailReal,
        subject: "Notificación UniConnect",
        text: notificacion.mensaje,
        // html: `<b>${notificacion.mensaje}</b>` // Opcional: Puedes enviar HTML
      });

      // ← Verifica que nodemailer realmente aceptó el mensaje
      if (!info.messageId) {
        throw new Error(
          "El transporter no retornó messageId — revisar configuración SMTP",
        );
      }

      logger.info(
        `[Email] Enviado a: ${emailReal} | MessageId: ${info.messageId}`,
      );
      
      return { canal: this.canal, exito: true };
    } catch (error) {
      logger.error(
        `[Email] Falló el envío para ${notificacion.destinatario}:`,
        error,
      );
      // ← Retorna en lugar de relanzar, para que el Service lo contabilice correctamente
      return {
        canal: this.canal,
        exito: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }
}