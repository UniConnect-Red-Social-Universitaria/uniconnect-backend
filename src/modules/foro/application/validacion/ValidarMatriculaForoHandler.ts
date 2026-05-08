import prisma from '../../../../lib/prisma';
import { ForoContexto, ResultadoForo } from '../../domain/IForoHandler';
import { ForoHandlerBase } from './ForoHandlerBase';

export class ValidarMatriculaForoHandler extends ForoHandlerBase {
  protected async validar(ctx: ForoContexto): Promise<ResultadoForo> {
    // Verifica que el usuario pertenezca a un grupo de la materia
    const membresia = await (prisma as any).usuarioGrupo.findFirst({
      where: {
        usuarioId: ctx.usuarioId,
        grupo: { materiaId: ctx.materiaId },
      },
      select: { id: true },
    });

    if (!membresia) {
      return {
        valido: false,
        error: 'No tienes matrícula activa en esta asignatura',
      };
    }

    return { valido: true };
  }
}
