import prisma from '../../../../lib/prisma';
import { ForoContexto, ResultadoForo } from '../../domain/IForoHandler';
import { ForoHandlerBase } from './ForoHandlerBase';

export class ValidarAutenticacionForoHandler extends ForoHandlerBase {
  protected async validar(ctx: ForoContexto): Promise<ResultadoForo> {
    if (!ctx.usuarioId || ctx.usuarioId.trim() === '') {
      return { valido: false, error: 'Debes estar autenticado para participar en el foro' };
    }

    const usuario = await (prisma as any).usuario.findUnique({
      where: { id: ctx.usuarioId },
      select: { id: true },
    });

    if (!usuario) {
      return { valido: false, error: 'Usuario no encontrado' };
    }

    return { valido: true };
  }
}
