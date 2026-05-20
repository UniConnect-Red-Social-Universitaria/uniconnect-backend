import prisma from '../../../lib/prisma';
import {
  CanalNotificacion,
  CANALES_DEFAULT,
  PreferenciaCanal,
  PreferenciaCanalRepository,
} from '../domain/contracts';

export class PrismaPreferenciaRepository implements PreferenciaCanalRepository {
  async obtenerPreferencias(usuarioId: string, tipoEvento: string): Promise<PreferenciaCanal> {
    const db = prisma as unknown as {
      preferenciaCanal: {
        findUnique: (args: unknown) => Promise<{ usuarioId: string; tipoEvento: string; canalesActivos: string[] } | null>;
      };
    };

    const preferencia = await db.preferenciaCanal.findUnique({
      where: { usuarioId_tipoEvento: { usuarioId, tipoEvento } } as unknown,
    });

    if (!preferencia) {
      return { usuarioId, tipoEvento, canalesActivos: [...CANALES_DEFAULT] };
    }

    return {
      usuarioId: preferencia.usuarioId,
      tipoEvento: preferencia.tipoEvento,
      canalesActivos: preferencia.canalesActivos as CanalNotificacion[],
    };
  }

  async actualizarPreferencias(
    usuarioId: string,
    tipoEvento: string,
    canales: CanalNotificacion[],
  ): Promise<PreferenciaCanal> {
    const db = prisma as unknown as {
      preferenciaCanal: {
        upsert: (args: unknown) => Promise<{ usuarioId: string; tipoEvento: string; canalesActivos: string[] }>;
      };
    };

    const preferencia = await db.preferenciaCanal.upsert({
      where: { usuarioId_tipoEvento: { usuarioId, tipoEvento } } as unknown,
      update: { canalesActivos: canales },
      create: { usuarioId, tipoEvento, canalesActivos: canales },
    } as unknown);

    return {
      usuarioId: preferencia.usuarioId,
      tipoEvento: preferencia.tipoEvento,
      canalesActivos: preferencia.canalesActivos as CanalNotificacion[],
    };
  }
}
