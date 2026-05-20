import prisma from '../../../lib/prisma';

export interface NotificacionRecord {
  id: string;
  usuarioId: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  referenciaId: string | null;
  leida: boolean;
  createdAt: Date;
}

export interface CreateNotificacionData {
  usuarioId: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  referenciaId?: string;
}

export class PrismaNotificacionRepository {
  async crear(data: CreateNotificacionData): Promise<NotificacionRecord> {
    return prisma.notificacion.create({
      data: {
        usuarioId: data.usuarioId,
        tipo: data.tipo,
        titulo: data.titulo,
        mensaje: data.mensaje,
        referenciaId: data.referenciaId ?? null,
      },
    }) as unknown as NotificacionRecord;
  }

  async listarPorUsuario(
    usuarioId: string,
    soloNoLeidas = false,
  ): Promise<NotificacionRecord[]> {
    const where: Record<string, unknown> = { usuarioId };
    if (soloNoLeidas) {
      where.leida = false;
    }
    return prisma.notificacion.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
    }) as unknown as NotificacionRecord[];
  }

  async marcarComoLeida(notificacionId: string): Promise<void> {
    await prisma.notificacion.update({
      where: { id: notificacionId } as any,
      data: { leida: true },
    });
  }

  async marcarTodasComoLeidas(usuarioId: string): Promise<void> {
    await prisma.notificacion.updateMany({
      where: { usuarioId, leida: false } as any,
      data: { leida: true },
    });
  }

  async contarNoLeidas(usuarioId: string): Promise<number> {
    return prisma.notificacion.count({
      where: { usuarioId, leida: false } as any,
    });
  }

  async eliminar(notificacionId: string): Promise<void> {
    await prisma.notificacion.delete({ where: { id: notificacionId } as any });
  }
}
