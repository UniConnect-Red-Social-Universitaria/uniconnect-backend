import prisma from '../../../lib/prisma';
import { EstadisticasPerfil, EstadisticasPerfilRepository } from '../domain/IPerfilEstudiante';

const db = prisma as unknown as {
  grupo: { count(args: { where: Record<string, unknown> }): Promise<number> };
  usuarioGrupo: { count(args: { where: Record<string, unknown> }): Promise<number> };
  mensaje: { count(args: { where: Record<string, unknown> }): Promise<number> };
  grupoMensaje: { count(args: { where: Record<string, unknown> }): Promise<number> };
};

export class PrismaEstadisticasRepository implements EstadisticasPerfilRepository {
  async obtenerEstadisticas(usuarioId: string): Promise<EstadisticasPerfil> {
    const [gruposCreados, gruposParticipa, mensajesDirectos, mensajesGrupo] = await Promise.all([
      db.grupo.count({ where: { creadorId: usuarioId } }),
      db.usuarioGrupo.count({ where: { usuarioId } }),
      db.mensaje.count({ where: { emisorId: usuarioId } }),
      db.grupoMensaje.count({ where: { emisorId: usuarioId } }),
    ]);

    return {
      gruposCreados,
      gruposParticipa,
      mensajesEnviados: mensajesDirectos + mensajesGrupo,
    };
  }
}
