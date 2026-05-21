import prisma from '../../../lib/prisma';
import { ForoPreguntaDTO, ForoRespuestaDTO, IForoRepository } from '../domain/IForoHandler';

const db = prisma as any;

export class PrismaForoRepository implements IForoRepository {
  async crearPregunta(data: {
    titulo: string;
    contenido: string;
    autorId: string;
    materiaId: string;
  }): Promise<ForoPreguntaDTO> {
    const pregunta = await db.foroPregunta.create({
      data,
      include: { autor: { select: { nombre: true, apellido: true } } },
    });
    return this.mapPregunta(pregunta);
  }

  async crearRespuesta(data: {
    contenido: string;
    autorId: string;
    preguntaId: string;
    materiaId: string;
  }): Promise<ForoRespuestaDTO> {
    const respuesta = await db.foroRespuesta.create({
      data: { contenido: data.contenido, autorId: data.autorId, preguntaId: data.preguntaId },
      include: { autor: { select: { nombre: true, apellido: true } } },
    });
    return this.mapRespuesta(respuesta);
  }

  async registrarVoto(
    usuarioId: string,
    respuestaId: string,
    valor: 1 | -1,
  ): Promise<ForoRespuestaDTO> {
    const votoExistente = await db.foroVoto.findUnique({
      where: { usuarioId_respuestaId: { usuarioId, respuestaId } },
    });

    let diferencia: number = valor;
    if (votoExistente) {
      if (votoExistente.valor === valor) {
        const respuestaActual = await db.foroRespuesta.findUnique({
          where: { id: respuestaId },
          include: { autor: { select: { nombre: true, apellido: true } } },
        });
        if (!respuestaActual) {
          throw new Error('Respuesta no encontrada');
        }

        return this.mapRespuesta(respuestaActual);
      } else {
        await db.foroVoto.update({
          where: { usuarioId_respuestaId: { usuarioId, respuestaId } },
          data: { valor },
        });
        diferencia = valor * 2;
      }
    } else {
      await db.foroVoto.create({ data: { usuarioId, respuestaId, valor } });
    }

    const respuesta = await db.foroRespuesta.update({
      where: { id: respuestaId },
      data: { puntuacion: { increment: diferencia } },
      include: { autor: { select: { nombre: true, apellido: true } } },
    });

    return this.mapRespuesta(respuesta);
  }

  async obtenerPreguntasPorMateria(materiaId: string): Promise<ForoPreguntaDTO[]> {
    const preguntas = await db.foroPregunta.findMany({
      where: { materiaId },
      include: { autor: { select: { nombre: true, apellido: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return preguntas.map(this.mapPregunta);
  }

  async obtenerRespuestasPorPregunta(preguntaId: string, usuarioId?: string): Promise<ForoRespuestaDTO[]> {
    const respuestas: any[] = await db.foroRespuesta.findMany({
      where: { preguntaId },
      include: { autor: { select: { nombre: true, apellido: true } } },
      orderBy: { puntuacion: 'desc' },
    });

    let votosUsuario: Record<string, 1 | -1> = {};
    if (usuarioId && respuestas.length > 0) {
      const votos: Array<{ respuestaId: string; valor: 1 | -1 }> = await db.foroVoto.findMany({
        where: {
          usuarioId,
          respuestaId: { in: respuestas.map((respuesta) => respuesta.id) },
        },
        select: { respuestaId: true, valor: true },
      });

      votosUsuario = votos.reduce((acumulado: Record<string, 1 | -1>, voto) => {
        acumulado[voto.respuestaId] = voto.valor as 1 | -1;
        return acumulado;
      }, {});
    }

    return respuestas.map((respuesta) => this.mapRespuesta(respuesta, votosUsuario[respuesta.id]));
  }

  async cerrarPregunta(preguntaId: string): Promise<ForoPreguntaDTO> {
    const pregunta = await db.foroPregunta.update({
      where: { id: preguntaId },
      data: { cerrada: true },
      include: { autor: { select: { nombre: true, apellido: true } } },
    });
    return this.mapPregunta(pregunta);
  }

  async obtenerPreguntaPorId(preguntaId: string): Promise<ForoPreguntaDTO | null> {
    const pregunta = await db.foroPregunta.findUnique({
      where: { id: preguntaId },
      include: { autor: { select: { nombre: true, apellido: true } } },
    });
    if (!pregunta) return null;
    return this.mapPregunta(pregunta);
  }

  private mapPregunta(p: any): ForoPreguntaDTO {
    return {
      id: p.id,
      titulo: p.titulo,
      contenido: p.contenido,
      cerrada: p.cerrada ?? false,
      autorId: p.autorId,
      autorNombre: `${p.autor.nombre} ${p.autor.apellido}`,
      materiaId: p.materiaId,
      createdAt: p.createdAt,
    };
  }

  private mapRespuesta(r: any, miVoto?: 1 | -1): ForoRespuestaDTO {
    return {
      id: r.id,
      contenido: r.contenido,
      autorId: r.autorId,
      autorNombre: `${r.autor.nombre} ${r.autor.apellido}`,
      preguntaId: r.preguntaId,
      puntuacion: r.puntuacion,
      miVoto,
      createdAt: r.createdAt,
    };
  }
}
