import prisma from '../../../lib/prisma';
import {
  AlcanceModificacion,
  AsistenteDTO,
  CrearSerieData,
  EstadoAsistencia,
  FrecuenciaRecurrencia,
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
  recordatorioEnviado: boolean; serieId: string; creadorId: string; grupoId: string | null; createdAt: Date;
}

interface AsistenteRow {
  id: string; sesionId: string; usuarioId: string; estado: string; createdAt: Date; updatedAt: Date;
}

function mapSesion(s: SesionRow, asistentes?: AsistenteDTO[]): SesionDTO {
  return {
    id: s.id, titulo: s.titulo, descripcion: s.descripcion, lugar: s.lugar,
    fecha: s.fecha, recordatorioMinutos: s.recordatorioMinutos, cancelada: s.cancelada,
    modificada: s.modificada, recordatorioEnviado: s.recordatorioEnviado,
    serieId: s.serieId, creadorId: s.creadorId, grupoId: s.grupoId,
    asistentes: asistentes ?? [],
    createdAt: s.createdAt,
  };
}

function mapAsistente(a: AsistenteRow): AsistenteDTO {
  return {
    id: a.id, sesionId: a.sesionId, usuarioId: a.usuarioId,
    estado: a.estado as EstadoAsistencia,
    createdAt: a.createdAt, updatedAt: a.updatedAt,
  };
}

export class PrismaSesionEstudioRepository implements ISesionEstudioRepository {
  async crearSerie(data: CrearSerieData): Promise<SerieDTO> {
    const fechas = generarFechas(data.fechaInicio, data.fechaFin, data.frecuencia);

    const createData: Record<string, unknown> = {
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
    };

    if (data.grupoId) {
      createData.grupoId = data.grupoId;
    }

    const serie = await prisma.sesionEstudioSerie.create({
      data: createData as any,
      include: { sesiones: { orderBy: { fecha: 'asc' } } },
    });

    const sesionesDTO = serie.sesiones.map((s: any) => {
      const row: SesionRow = { ...s, grupoId: s.grupoId ?? null };
      return mapSesion(row);
    });

    // Si la serie tiene grupo, crear asistentes en PENDIENTE para todos los miembros
    if (data.grupoId) {
      const miembros = await this.obtenerMiembrosGrupo(data.grupoId);
      for (const sesion of sesionesDTO) {
        await this.crearAsistentesBatch(
          sesion.id,
          miembros.map(m => m.id),
        );
      }
      // Recargar con asistentes
      const serieCompleta = await prisma.sesionEstudioSerie.findUnique({
        where: { id: serie.id },
        include: {
          sesiones: {
            orderBy: { fecha: 'asc' },
            include: { asistentes: true },
          },
        },
      });
      if (serieCompleta) {
        return {
          id: serieCompleta.id, titulo: serieCompleta.titulo, descripcion: serieCompleta.descripcion,
          lugar: serieCompleta.lugar, frecuencia: serieCompleta.frecuencia as SerieDTO['frecuencia'],
          fechaInicio: serieCompleta.fechaInicio, fechaFin: serieCompleta.fechaFin,
          recordatorioMinutos: serieCompleta.recordatorioMinutos, creadorId: serieCompleta.creadorId,
          grupoId: serieCompleta.grupoId,
          sesiones: serieCompleta.sesiones.map((s: any) => {
            const row: SesionRow = { ...s, grupoId: s.grupoId ?? null };
            return mapSesion(row, (s.asistentes || []).map((a: any) => mapAsistente(a)));
          }),
          createdAt: serieCompleta.createdAt,
        };
      }
    }

    return {
      id: serie.id, titulo: serie.titulo, descripcion: serie.descripcion,
      lugar: serie.lugar, frecuencia: serie.frecuencia as SerieDTO['frecuencia'],
      fechaInicio: serie.fechaInicio, fechaFin: serie.fechaFin,
      recordatorioMinutos: serie.recordatorioMinutos, creadorId: serie.creadorId,
      grupoId: data.grupoId,
      sesiones: sesionesDTO, createdAt: serie.createdAt,
    };
  }

  async obtenerSesionesDeUsuario(creadorId: string): Promise<SesionDTO[]> {
    const sesiones = await prisma.sesionEstudio.findMany({
      where: { creadorId, cancelada: false },
      orderBy: { fecha: 'asc' },
    });
    return sesiones.map((s: any) => {
      const row: SesionRow = { ...s, grupoId: s.grupoId ?? null };
      return mapSesion(row);
    });
  }

  async obtenerSesionPorId(sesionId: string): Promise<SesionDTO | null> {
    const s = await prisma.sesionEstudio.findUnique({
      where: { id: sesionId },
      include: { asistentes: true },
    }) as any;
    if (!s) return null;
    const row: SesionRow = { ...s, grupoId: s.grupoId ?? null };
    return mapSesion(row, (s.asistentes || []).map((a: any) => mapAsistente(a)));
  }

  async modificarSesion(
    sesionId: string,
    alcance: AlcanceModificacion,
    data: ModificarSesionData,
  ): Promise<SesionDTO[]> {
    const sesion = await prisma.sesionEstudio.findUniqueOrThrow({ where: { id: sesionId } }) as any;

    if (alcance === 'solo_esta') {
      const actualizada = await prisma.sesionEstudio.update({
        where: { id: sesionId },
        data: { ...data, modificada: true },
      }) as any;
      const row: SesionRow = { ...actualizada, grupoId: actualizada.grupoId ?? null };
      return [mapSesion(row)];
    }

    const afectadas = await prisma.sesionEstudio.findMany({
      where: { serieId: sesion.serieId, fecha: { gte: sesion.fecha }, cancelada: false },
    }) as any[];

    const actualizadas = await Promise.all(
      afectadas.map(s =>
        prisma.sesionEstudio.update({
          where: { id: s.id },
          data: { ...data, modificada: true },
        }),
      ),
    );

    return (actualizadas as any[]).map((s: any) => {
      const row: SesionRow = { ...s, grupoId: s.grupoId ?? null };
      return mapSesion(row);
    });
  }

  async cancelarSesion(sesionId: string, alcance: AlcanceModificacion): Promise<void> {
    const sesion = await prisma.sesionEstudio.findUniqueOrThrow({ where: { id: sesionId } }) as any;

    if (alcance === 'solo_esta') {
      await prisma.sesionEstudio.update({ where: { id: sesionId }, data: { cancelada: true } });
      return;
    }

    await prisma.sesionEstudio.updateMany({
      where: { serieId: sesion.serieId, fecha: { gte: sesion.fecha } },
      data: { cancelada: true },
    });
  }

  async cancelarSesionesPorIds(sesionIds: string[], creadorId: string): Promise<number> {
    const result = await prisma.sesionEstudio.updateMany({
      where: { id: { in: sesionIds }, creadorId },
      data: { cancelada: true },
    });
    return result.count;
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
    }) as any[];

    return sesiones
      .filter(s => {
        const minutos = (s.fecha.getTime() - ahora.getTime()) / 60000;
        return minutos > 0 && minutos <= s.recordatorioMinutos;
      })
      .map((s: any) => {
        const row: SesionRow = { ...s, grupoId: s.grupoId ?? null };
        return mapSesion(row);
      });
  }

  // ── Asistentes ──

  async crearAsistentesBatch(sesionId: string, usuarioIds: string[]): Promise<AsistenteDTO[]> {
    const creados = await Promise.all(
      usuarioIds.map(usuarioId =>
        prisma.sesionAsistente.create({
          data: { sesionId, usuarioId },
        }).catch(() => null),
      ),
    );
    return creados.filter(Boolean).map((a: any) => mapAsistente(a));
  }

  async obtenerAsistentes(sesionId: string): Promise<AsistenteDTO[]> {
    const asistentes = await prisma.sesionAsistente.findMany({
      where: { sesionId },
    }) as any[];
    return asistentes.map(mapAsistente);
  }

  async actualizarEstadoAsistencia(
    sesionId: string, usuarioId: string, estado: EstadoAsistencia,
  ): Promise<AsistenteDTO> {
    const asistente = await prisma.sesionAsistente.upsert({
      where: { sesionId_usuarioId: { sesionId, usuarioId } },
      update: { estado },
      create: { sesionId, usuarioId, estado },
    }) as any;
    return mapAsistente(asistente);
  }

  // ── Calendario ──

  async obtenerSesionesDeGrupo(grupoId: string): Promise<SesionDTO[]> {
    const sesiones = await prisma.sesionEstudio.findMany({
      where: { serie: { grupoId }, cancelada: false },
      orderBy: { fecha: 'asc' },
      include: { asistentes: true },
    }) as any[];
    return sesiones.map((s: any) => {
      const row: SesionRow = { ...s, grupoId: s.grupoId ?? null };
      return mapSesion(row, (s.asistentes || []).map((a: any) => mapAsistente(a)));
    });
  }

  async obtenerSesionesDeUsuarioComoAsistenteOcreador(usuarioId: string): Promise<SesionDTO[]> {
    const comoAsistente = await prisma.sesionAsistente.findMany({
      where: { usuarioId },
      include: {
        sesion: {
          include: { asistentes: true },
        },
      },
    }) as any[];

    const comoCreador = await prisma.sesionEstudio.findMany({
      where: { creadorId: usuarioId, cancelada: false },
      include: { asistentes: true },
    }) as any[];

    const mapa = new Map<string, SesionDTO>();
    for (const a of comoAsistente) {
      const s = a.sesion;
      const row: SesionRow = { ...s, grupoId: s.grupoId ?? null };
      mapa.set(s.id, mapSesion(row, (s.asistentes || []).map((a2: any) => mapAsistente(a2))));
    }
    for (const s of comoCreador) {
      if (!mapa.has(s.id)) {
        const row: SesionRow = { ...s, grupoId: s.grupoId ?? null };
        mapa.set(s.id, mapSesion(row, (s.asistentes || []).map((a2: any) => mapAsistente(a2))));
      }
    }

    return Array.from(mapa.values()).sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  }

  async obtenerMiembrosGrupo(grupoId: string): Promise<{ id: string; nombre: string; apellido: string }[]> {
    const grupo = await prisma.grupo.findUnique({
      where: { id: grupoId },
      include: {
        miembros: {
          include: { usuario: { select: { id: true, nombre: true, apellido: true } } },
        },
      },
    }) as any;
    if (!grupo) return [];
    return grupo.miembros.map((m: any) => ({
      id: m.usuario.id,
      nombre: m.usuario.nombre,
      apellido: m.usuario.apellido,
    }));
  }

  async obtenerFrecuenciaSerie(serieId: string): Promise<FrecuenciaRecurrencia | null> {
    const serie = await prisma.sesionEstudioSerie.findUnique({
      where: { id: serieId },
      select: { frecuencia: true },
    }) as any;
    return serie ? (serie.frecuencia as FrecuenciaRecurrencia) : null;
  }

  async obtenerGrupoNombre(grupoId: string): Promise<string | null> {
    const grupo = await prisma.grupo.findUnique({
      where: { id: grupoId },
      select: { nombre: true },
    }) as any;
    return grupo ? grupo.nombre : null;
  }
}
