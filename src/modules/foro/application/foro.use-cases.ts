import { ApplicationError } from '../../../shared/application-error';
import { UsuarioAutenticado } from '../../../middleware/autenticacion.middleware';
import { ForoPreguntaDTO, ForoRespuestaDTO, IForoRepository } from '../domain/IForoHandler';
import { crearCadenaForo } from './validacion/ForoChainFactory';

function crearErrorForo(mensaje: string): ApplicationError {
  if (mensaje === 'Debes estar autenticado para participar en el foro') {
    return new ApplicationError(401, mensaje);
  }

  if (mensaje === 'Usuario no encontrado' || mensaje === 'La asignatura no existe') {
    return new ApplicationError(404, mensaje);
  }

  if (mensaje === 'No tienes matrícula activa en esta asignatura') {
    return new ApplicationError(403, mensaje);
  }

  return new ApplicationError(400, mensaje);
}

export class ForoUseCases {
  constructor(private readonly foroRepository: IForoRepository) { }

  async publicarPregunta(
    usuario: UsuarioAutenticado | undefined,
    materiaId: unknown,
    titulo: unknown,
    contenido: unknown,
  ): Promise<{ data: ForoPreguntaDTO }> {
    if (!usuario) throw new ApplicationError(401, 'Debes estar autenticado');
    if (typeof materiaId !== 'string' || !materiaId.trim()) throw new ApplicationError(400, 'materiaId inválido');
    if (typeof titulo !== 'string' || titulo.trim().length < 5) {
      throw new ApplicationError(400, 'El título debe tener al menos 5 caracteres');
    }
    if (typeof contenido !== 'string') throw new ApplicationError(400, 'Contenido inválido');

    const cadena = crearCadenaForo();
    const resultado = await cadena.manejar({ usuarioId: usuario.id, materiaId, contenido });
    if (!resultado.valido) throw crearErrorForo(resultado.error ?? 'No se pudo publicar la pregunta');

    const pregunta = await this.foroRepository.crearPregunta({
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      autorId: usuario.id,
      materiaId,
    });

    return { data: pregunta };
  }

  async publicarRespuesta(
    usuario: UsuarioAutenticado | undefined,
    materiaId: unknown,
    preguntaId: unknown,
    contenido: unknown,
  ): Promise<{ data: ForoRespuestaDTO }> {
    if (!usuario) throw new ApplicationError(401, 'Debes estar autenticado');
    if (typeof materiaId !== 'string' || !materiaId.trim()) throw new ApplicationError(400, 'materiaId inválido');
    if (typeof preguntaId !== 'string' || !preguntaId.trim()) throw new ApplicationError(400, 'preguntaId inválido');
    if (typeof contenido !== 'string') throw new ApplicationError(400, 'Contenido inválido');

    const cadena = crearCadenaForo();
    const resultado = await cadena.manejar({ usuarioId: usuario.id, materiaId, contenido, preguntaId });
    if (!resultado.valido) throw crearErrorForo(resultado.error ?? 'No se pudo publicar la respuesta');

    const respuesta = await this.foroRepository.crearRespuesta({
      contenido: contenido.trim(),
      autorId: usuario.id,
      preguntaId,
      materiaId,
    });

    return { data: respuesta };
  }

  async votarRespuesta(
    usuario: UsuarioAutenticado | undefined,
    respuestaId: unknown,
    valor: unknown,
  ): Promise<{ data: ForoRespuestaDTO }> {
    if (!usuario) throw new ApplicationError(401, 'Debes estar autenticado');
    if (typeof respuestaId !== 'string' || !respuestaId.trim()) throw new ApplicationError(400, 'respuestaId inválido');
    if (valor !== 1 && valor !== -1) throw new ApplicationError(400, 'El valor del voto debe ser 1 o -1');

    const respuesta = await this.foroRepository.registrarVoto(usuario.id, respuestaId, valor);
    return { data: respuesta };
  }

  async obtenerForo(materiaId: unknown): Promise<{ data: ForoPreguntaDTO[] }> {
    if (typeof materiaId !== 'string' || !materiaId.trim()) throw new ApplicationError(400, 'materiaId inválido');
    const preguntas = await this.foroRepository.obtenerPreguntasPorMateria(materiaId);
    return { data: preguntas };
  }

  async obtenerRespuestas(preguntaId: unknown): Promise<{ data: ForoRespuestaDTO[] }> {
    if (typeof preguntaId !== 'string' || !preguntaId.trim()) throw new ApplicationError(400, 'preguntaId inválido');
    const respuestas = await this.foroRepository.obtenerRespuestasPorPregunta(preguntaId);
    return { data: respuestas };
  }
}
