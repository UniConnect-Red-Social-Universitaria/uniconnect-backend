import prisma from '../../../../lib/prisma';
import { ForoContexto, ResultadoForo } from '../../domain/IForoHandler';
import { ForoHandlerBase } from './ForoHandlerBase';

export class ValidarMatriculaForoHandler extends ForoHandlerBase {
  protected async validar(ctx: ForoContexto): Promise<ResultadoForo> {
    const materia = await prisma.materia.findUnique({
      where: { id: ctx.materiaId },
      select: { nombre: true },
    });

    if (!materia) {
      return { valido: false, error: 'La asignatura no existe' };
    }

    const usuario = await (prisma as any).usuario.findUnique({
      where: { id: ctx.usuarioId },
      select: { materiasCursando: true },
    });

    if (!usuario || !(usuario.materiasCursando as string[]).includes(materia.nombre)) {
      return {
        valido: false,
        error: 'No tienes matrícula activa en esta asignatura',
      };
    }

    return { valido: true };
  }
}
