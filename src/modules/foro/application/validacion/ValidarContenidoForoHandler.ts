import { ForoContexto, ResultadoForo } from '../../domain/IForoHandler';
import { ForoHandlerBase } from './ForoHandlerBase';

export class ValidarContenidoForoHandler extends ForoHandlerBase {
  protected async validar(ctx: ForoContexto): Promise<ResultadoForo> {
    if (!ctx.contenido || ctx.contenido.trim() === '') {
      return { valido: false, error: 'El contenido no puede estar vacío' };
    }

    if (ctx.contenido.trim().length < 10) {
      return { valido: false, error: 'El contenido debe tener al menos 10 caracteres' };
    }

    return { valido: true };
  }
}
