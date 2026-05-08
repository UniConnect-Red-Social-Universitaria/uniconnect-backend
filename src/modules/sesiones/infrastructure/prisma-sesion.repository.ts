import prisma from '../../../lib/prisma';
import {
  AlcanceModificacion,
  CrearSerieData,
  ISesionEstudioRepository,
  ModificarSesionData,
  SerieDTO,
  SesionDTO,
} from '../domain/contracts';

const DIAS_POR_FRECUENCIA: Record<string, number> = {
  DIARIA: 1,
  SEMANAL: 7,
  QUINCENAL: 14,
};

function generarFechas(inicio: Date, fin: Date, frecuencia: string): Date[] {
  const fechas: Date[] = [];
  const intervalo = DIAS_POR_FRECUENCIA[frecuencia] ?? 7;
  const actual = new Date(inicio);
  while (actual <= fin) {
    fechas.push(new Date(actual));
    actual.setDate(actual.getDate() + intervalo);
  }
  return fechas;
}

interface SesionRow {
  id: string; titulo: string; descripcion: string; lugar: string; fecha: Date;
  recordatorioMinutos: number; cancelada: boolean; modificada: boolean;
  recordatorioEnviado: boolean; serieId: string; creadorId: string; createdAt: Date;
}

function mapSesion(s: SesionRow): SesionDTO {
  return {
    id: s.id, titulo: s.titulo, descripcion: s.descripcion, lugar: s.lugar,
    fecha: s.fecha, recordatorioMinutos: s.recordatorioMinutos, cancelada: s.cancelada,
    modificada: s.modificada, recordatorioEnviado: s.recordatorioEnviado,
    serieId: s.serieId, creadorId: s.creadorId, createdAt: s.createdAt,
  };
}

export class PrismaSesionEstudioRepository implements ISesionEstudioRepository {
  async crearSerie(data: CrearSerieData): Promise<SerieDTO> {
    const fechas = generarFechas(data.fechaInicio, data.fechaFin, data.frecuencia);

    const serie = await prisma.sesionEstudioSerie.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        lugar: data.lugar,
        frecuencia: data.frecuencia,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        recordatorioMinutos: data.recordatorioMinutos,
        creadorId: data.creadorId,
        sesiones: {
          create: fechas.map(fecha => ({
            titulo: data.titulo,
            descripcion: data.descripcion,
            lugar: data.lugar,
            fecha,
            recordatorioMinutos: data.recordatorioMinutos,
            creadorId: data.creadorId,
          })),
        },
      },
      include: { sesiones: { orderBy: { fecha: 'asc' } } },
    });

    return {
      id: serie.id, titulo: serie.titulo, descripcion: serie.descripcion,
      lugar: serie.lugar, frecuencia: serie.frecuencia as SerieDTO['frecuencia'],
      fechaInicio: serie.fechaInicio, fechaFin: serie.fechaFin,
      recordatorioMinutos: serie.recordatorioMinutos, creadorId: serie.creadorId,
      sesiones: serie.sesiones.map((s: SesionRow) => mapSesion(s)), createdAt: serie.createdAt,
    };
  }

  async obtenerSesionesDeUsuario(creadorId: string): Promise<SesionDTO[]> {
    const sesiones = await prisma.sesionEstudio.findMany({
      where: { creadorId, cancelada: false },
      orderBy: { fecha: 'asc' },
    });
    return sesiones.map(mapSesion);
  }

  async obtenerSesionPorId(sesionId: string): Promise<SesionDTO | null> {
    const s = await prisma.sesionEstudio.findUnique({ where: { id: sesionId } });
    return s ? mapSesion(s) : null;
  }

  async modificarSesion(
    sesionId: string,
    alcance: AlcanceModificacion,
    data: ModificarSesionData,
  ): Promise<SesionDTO[]> {
    const sesion = await prisma.sesionEstudio.findUniqueOrThrow({ where: { id: sesionId } });

    if (alcance === 'solo_esta') {
      const actualizada = await prisma.sesionEstudio.update({
        where: { id: sesionId },
        data: { ...data, modificada: true },
      });
      return [mapSesion(actualizada)];
    }

    // esta_y_siguientes: actualizar la sesión actual y todas las futuras de la misma serie
    const afectadas = await prisma.sesionEstudio.findMany({
      where: { serieId: sesion.serieId, fecha: { gte: sesion.fecha }, cancelada: false },
    });

    const actualizadas = await Promise.all(
      afectadas.map(s =>
        prisma.sesionEstudio.update({
          where: { id: s.id },
          data: { ...data, modificada: true },
        }),
      ),
    );

    return actualizadas.map(mapSesion);
  }

  async cancelarSesion(sesionId: string, alcance: AlcanceModificacion): Promise<void> {
    const sesion = await prisma.sesionEstudio.findUniqueOrThrow({ where: { id: sesionId } });

    if (alcance === 'solo_esta') {
      await prisma.sesionEstudio.update({ where: { id: sesionId }, data: { cancelada: true } });
      return;
    }

    await prisma.sesionEstudio.updateMany({
      where: { serieId: sesion.serieId, fecha: { gte: sesion.fecha } },
      data: { cancelada: true },
    });
  }

  async marcarRecordatorioEnviado(sesionId: string): Promise<void> {
    await prisma.sesionEstudio.update({
      where: { id: sesionId },
      data: { recordatorioEnviado: true },
    });
  }

  async obtenerSesionesPendientesRecordatorio(ahora: Date): Promise<SesionDTO[]> {
    const sesiones = await prisma.sesionEstudio.findMany({
      where: { cancelada: false, recordatorioEnviado: false },
    });

    return sesiones
      .filter(s => {
        const minutos = (s.fecha.getTime() - ahora.getTime()) / 60000;
        return minutos > 0 && minutos <= s.recordatorioMinutos;
      })
      .map(mapSesion);
  }
}
