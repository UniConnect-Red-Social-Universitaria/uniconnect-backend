import prisma from "../lib/prisma";
import type { SolicitudGrupoTipo } from '../domain/contracts';

type EstadoSolicitudGrupo = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

interface SolicitudGrupoBase {
  id: string;
  solicitanteId: string;
  grupoId: string;
  tipo: SolicitudGrupoTipo;
  estado: EstadoSolicitudGrupo;
  createdAt: Date;
  updatedAt: Date;
}

interface SolicitanteBasico {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
}

interface GrupoBasico {
  id: string;
  nombre: string;
  materia: { id: string; nombre: string };
}

function solicitudGrupoDelegate() {
  const prismaDinamico = prisma as unknown as {
    solicitudGrupo: {
      create: (args: unknown) => Promise<SolicitudGrupoBase & {
        solicitante: SolicitanteBasico;
        grupo: GrupoBasico;
      }>;
      findFirst: (args: unknown) => Promise<SolicitudGrupoBase | null>;
      findUnique: (args: unknown) => Promise<(SolicitudGrupoBase & {
        solicitante?: SolicitanteBasico;
        grupo?: GrupoBasico;
      }) | null>;
      findMany: (args: unknown) => Promise<Array<Record<string, unknown>>>;
      update: (args: unknown) => Promise<SolicitudGrupoBase & {
        solicitante?: SolicitanteBasico;
        grupo?: GrupoBasico;
      }>;
      deleteMany: (args: unknown) => Promise<{ count: number }>;
    };
  };

  return prismaDinamico.solicitudGrupo;
}

export class SolicitudGrupoModel {
  static async crear(solicitanteId: string, grupoId: string, tipo: SolicitudGrupoTipo = 'INGRESO') {
    return solicitudGrupoDelegate().create({
      data: {
        solicitanteId,
        grupoId,
        tipo,
      },
      include: {
        solicitante: {
          select: { id: true, nombre: true, apellido: true, correo: true },
        },
        grupo: {
          include: { materia: { select: { id: true, nombre: true } } },
        },
      },
    });
  }

  static async buscarPendiente(solicitanteId: string, grupoId: string, tipo: SolicitudGrupoTipo = 'INGRESO') {
    return solicitudGrupoDelegate().findFirst({
      where: {
        solicitanteId,
        grupoId,
        tipo,
        estado: "PENDIENTE",
      },
    });
  }

  static async buscarPorId(solicitudId: string) {
    return solicitudGrupoDelegate().findUnique({
      where: { id: solicitudId },
      include: {
        solicitante: {
          select: { id: true, nombre: true, apellido: true, correo: true },
        },
        grupo: {
          include: { materia: { select: { id: true, nombre: true } } },
        },
      },
    });
  }

  static async listarPorGrupo(grupoId: string) {
    const solicitudesRaw = await solicitudGrupoDelegate().findMany({
      where: {
        grupoId,
        tipo: 'INGRESO',
        estado: "PENDIENTE",
      },
      include: {
        solicitante: {
          select: { id: true, nombre: true, apellido: true, correo: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return solicitudesRaw as unknown as Array<SolicitudGrupoBase & {
      solicitante: SolicitanteBasico;
    }>;
  }

  static async listarPorUsuario(solicitanteId: string) {
    const solicitudesRaw = await solicitudGrupoDelegate().findMany({
      where: { solicitanteId, tipo: 'INVITACION' },
      include: {
        grupo: {
          include: { materia: { select: { id: true, nombre: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return solicitudesRaw as unknown as Array<SolicitudGrupoBase & {
      grupo: GrupoBasico;
    }>;
  }

  static async aprobar(solicitudId: string) {
    return solicitudGrupoDelegate().update({
      where: { id: solicitudId },
      data: { estado: "APROBADA" },
      include: {
        solicitante: {
          select: { id: true, nombre: true, apellido: true, correo: true },
        },
        grupo: {
          include: { materia: { select: { id: true, nombre: true } } },
        },
      },
    });
  }

  static async rechazar(solicitudId: string) {
    return solicitudGrupoDelegate().update({
      where: { id: solicitudId },
      data: { estado: "RECHAZADA" },
      include: {
        solicitante: {
          select: { id: true, nombre: true, apellido: true, correo: true },
        },
        grupo: {
          include: { materia: { select: { id: true, nombre: true } } },
        },
      },
    });
  }

  static async eliminarRechazada(solicitanteId: string, grupoId: string, tipo: SolicitudGrupoTipo = 'INGRESO') {
    await solicitudGrupoDelegate().deleteMany({
      where: {
        solicitanteId,
        grupoId,
        tipo,
        estado: "RECHAZADA",
      },
    });
  }
}
