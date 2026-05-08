import { ForoContexto, IForoHandler, ResultadoForo } from '../../domain/IForoHandler';

export abstract class ForoHandlerBase implements IForoHandler {
  private siguiente: IForoHandler | null = null;

  setSiguiente(handler: IForoHandler): IForoHandler {
    this.siguiente = handler;
    return handler;
  }

  async manejar(ctx: ForoContexto): Promise<ResultadoForo> {
    const resultado = await this.validar(ctx);
    if (!resultado.valido) return resultado;
    if (this.siguiente) return this.siguiente.manejar(ctx);
    return { valido: true };
  }

  protected abstract validar(ctx: ForoContexto): Promise<ResultadoForo>;
}
