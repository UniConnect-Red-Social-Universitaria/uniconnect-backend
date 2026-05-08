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
      // Si el voto es igual al anterior, lo elimina (toggle)
      if (votoExistente.valor === valor) {
        await db.foroVoto.delete({
          where: { usuarioId_respuestaId: { usuarioId, respuestaId } },
        });
        diferencia = -valor;
      } else {
        // Si cambia el sentido, cuenta doble
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

  async obtenerRespuestasPorPregunta(preguntaId: string): Promise<ForoRespuestaDTO[]> {
    const respuestas = await db.foroRespuesta.findMany({
      where: { preguntaId },
      include: { autor: { select: { nombre: true, apellido: true } } },
      orderBy: { puntuacion: 'desc' },
    });
    return respuestas.map(this.mapRespuesta);
  }

  private mapPregunta(p: any): ForoPreguntaDTO {
    return {
      id: p.id,
      titulo: p.titulo,
      contenido: p.contenido,
      autorId: p.autorId,
      autorNombre: `${p.autor.nombre} ${p.autor.apellido}`,
      materiaId: p.materiaId,
      createdAt: p.createdAt,
    };
  }

  private mapRespuesta(r: any): ForoRespuestaDTO {
    return {
      id: r.id,
      contenido: r.contenido,
      autorId: r.autorId,
      autorNombre: `${r.autor.nombre} ${r.autor.apellido}`,
      preguntaId: r.preguntaId,
      puntuacion: r.puntuacion,
      createdAt: r.createdAt,
    };
  }
}
