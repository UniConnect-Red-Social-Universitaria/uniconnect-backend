import prismaClient from '../../../infrastructure/database/prisma-client';
import {
  CanalNotificacion,
  CANALES_DEFAULT,
  PreferenciaCanal,
  PreferenciaCanalRepository,
  TipoNotificacion,
} from '../domain/contracts';

/**
 * Implementación del repositorio de preferencias usando Prisma + MongoDB.
 * Persiste las preferencias de canales por tipo de evento en la base de datos.
 */
export class PrismaPreferenciaRepository implements PreferenciaCanalRepository {
  async obtenerPreferencias(
    usuarioId: string,
    tipoEvento: TipoNotificacion,
  ): Promise<PreferenciaCanal> {
    try {
      console.log(`[PreferenciaRepo] Obteniendo preferencias para usuario ${usuarioId}, tipoEvento: ${tipoEvento}`);
      
      const preferencia = await prismaClient.preferenciaCanal.findUnique({
        where: {
          usuarioId_tipoEvento: {
            usuarioId,
            tipoEvento,
          },
        },
      });

      // Si no existe preferencia guardada, devolver los canales por defecto
      if (!preferencia) {
        console.log(`[PreferenciaRepo] No encontrada preferencia para ${usuarioId}/${tipoEvento}, devolviendo defaults`);
        return {
          usuarioId,
          tipoEvento,
          canalesActivos: CANALES_DEFAULT,
        };
      }

      console.log(`[PreferenciaRepo] Preferencia encontrada:`, preferencia);
      return {
        usuarioId: preferencia.usuarioId,
        tipoEvento: preferencia.tipoEvento as TipoNotificacion,
        canalesActivos: preferencia.canalesActivos as CanalNotificacion[],
      };
    } catch (error) {
      console.error(`[PreferenciaRepo] Error obtenerPreferencias:`, error);
      throw error;
    }
  }

  async actualizarPreferencias(
    usuarioId: string,
    tipoEvento: TipoNotificacion,
    canales: CanalNotificacion[],
  ): Promise<PreferenciaCanal> {
    try {
      console.log(`[PreferenciaRepo] Actualizando preferencias para usuario ${usuarioId}, tipoEvento: ${tipoEvento}, canales:`, canales);
      
      const preferencia = await prismaClient.preferenciaCanal.upsert({
        where: {
          usuarioId_tipoEvento: {
            usuarioId,
            tipoEvento,
          },
        },
        update: {
          canalesActivos: canales,
        },
        create: {
          usuarioId,
          tipoEvento,
          canalesActivos: canales,
        },
      });

      console.log(`[PreferenciaRepo] Preferencia actualizada/creada:`, preferencia);
      
      return {
        usuarioId: preferencia.usuarioId,
        tipoEvento: preferencia.tipoEvento as TipoNotificacion,
        canalesActivos: preferencia.canalesActivos as CanalNotificacion[],
      };
    } catch (error) {
      console.error(`[PreferenciaRepo] Error actualizarPreferencias:`, error);
      throw error;
    }
  }
}
