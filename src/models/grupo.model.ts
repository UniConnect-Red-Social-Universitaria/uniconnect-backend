import prisma from "../lib/prisma";

function grupoDelegate() {
  const prismaDinamico = prisma as unknown as {
    grupo: {
      create: (args: unknown) => Promise<{
        id: string;
        nombre: string;
        materiaId: string;
        creadorId: string;
        administradorId: string;
        createdAt: Date;
        materia: { id: string; nombre: string };
        miembros: Array<{ id: string }>;
      }>;
      findMany: (args: unknown) => Promise<
        Array<{
          id: string;
          nombre: string;
          materiaId: string;
          creadorId: string;
          administradorId: string;
          createdAt: Date;
          materia: { id: string; nombre: string };
          miembros: Array<{
            id: string;
            usuarioId: string;
            usuario: {
              id: string;
              nombre: string;
              apellido: string;
            };
          }>;
        }>
      >;
      findUnique: (args: unknown) => Promise<{
        id: string;
        nombre: string;
        materiaId: string;
        creadorId: string;
        administradorId: string;
        createdAt: Date;
        materia: { id: string; nombre: string };
        miembros: Array<{
          id: string;
          usuarioId: string;
        }>;
      } | null>;
    };
  };

  return prismaDinamico.grupo;
}

export class GrupoModel {
  private static normalizarTexto(texto: string) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  static async crear(data: {
    nombre: string;
    materiaId: string;
    creadorId: string;
  }) {
    return grupoDelegate().create({
      data: {
        nombre: data.nombre,
        materiaId: data.materiaId,
        creadorId: data.creadorId,
        administradorId: data.creadorId,
        miembros: {
          create: {
            usuarioId: data.creadorId,
          },
        },
      },
      include: {
        materia: true,
        miembros: true,
      },
    });
  }

  static async listarPorUsuario(usuarioId: string) {
    return grupoDelegate().findMany({
      where: {
        miembros: {
          some: {
            usuarioId,
          },
        },
      },
      include: {
        materia: true,
        miembros: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async listarDisponibles(
    materiasCursando: string[],
    usuarioId: string,
  ) {
    const gruposBrutos = await prisma.grupo.findMany({
      where: {
        materia: {
          nombre: { in: materiasCursando },
        },
        miembros: {
          none: {
            usuarioId,
          },
        },
      },
      include: {
        materia: true,
        miembros: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const usuarioIds = [
      ...new Set(
        gruposBrutos.flatMap((g) => g.miembros.map((m) => m.usuarioId)),
      ),
    ];

    const usuariosValidos = await prisma.usuario.findMany({
      where: { id: { in: usuarioIds } },
      select: {
        id: true,
        nombre: true,
        apellido: true,
      },
    });

    const usuariosMap = new Map(usuariosValidos.map((u) => [u.id, u]));

    const gruposFiltrados = gruposBrutos
      .filter((grupo) => {
        return grupo.miembros.every((m) => usuariosMap.has(m.usuarioId));
      })
      .map((grupo) => {
        return {
          ...grupo,
          miembros: grupo.miembros.map((m) => ({
            ...m,
            usuario: usuariosMap.get(m.usuarioId)!,
          })),
        };
      });

    return gruposFiltrados as any;
  }

  static async buscarPorId(id: string) {
    return grupoDelegate().findUnique({
      where: { id },
      include: {
        materia: true,
        miembros: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
              },
            },
          },
        },
      },
    });
  }

  static async buscarPorTexto(texto: string) {
    const busquedaNormalizada = GrupoModel.normalizarTexto(texto);

    const grupos = await prisma.grupo.findMany({
      select: {
        id: true,
        nombre: true,
        materiaId: true,
        creadorId: true,
        administradorId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const materiaIds = Array.from(new Set(grupos.map((grupo) => grupo.materiaId)));
    const materias = await prisma.materia.findMany({
      where: {
        id: { in: materiaIds },
      },
      select: {
        id: true,
        nombre: true,
      },
    });

    const materiasPorId = new Map(materias.map((materia) => [materia.id, materia]));

    const gruposNormalizados = grupos
      .map((grupo) => {
        const materia = materiasPorId.get(grupo.materiaId);

        if (!materia) {
          return null;
        }

        return {
          id: grupo.id,
          nombre: grupo.nombre,
          materiaId: grupo.materiaId,
          creadorId: grupo.creadorId,
          administradorId: grupo.administradorId,
          createdAt: grupo.createdAt,
          materia,
          miembros: [],
        };
      })
      .filter(
        (
          grupo,
        ): grupo is {
          id: string;
          nombre: string;
          materiaId: string;
          creadorId: string;
          administradorId: string;
          createdAt: Date;
          materia: { id: string; nombre: string };
          miembros: [];
        } => !!grupo,
      );

    return gruposNormalizados.filter((grupo) => {

      const nombreGrupo = GrupoModel.normalizarTexto(grupo.nombre ?? '');
      const nombreMateria = GrupoModel.normalizarTexto(grupo.materia?.nombre ?? '');

      return (
        nombreGrupo.includes(busquedaNormalizada) ||
        nombreMateria.includes(busquedaNormalizada)
      );
    });
  }

  static async contarGruposPorMateria(materiaId: string) {
    return prisma.grupo.count({
      where: { materiaId },
    });
  }

  static async unirse(grupoId: string, usuarioId: string) {
    return prisma.usuarioGrupo.create({
      data: {
        grupoId,
        usuarioId,
      },
    });
  }
  static async buscarPorNombre(nombre: string) {
    return prisma.grupo.findFirst({
      where: { nombre },
    });
  }

  static async actualizarAdministrador(grupoId: string, nuevoAdminId: string) {
    return prisma.grupo.update({
      where: { id: grupoId },
      data: { administradorId: nuevoAdminId },
    });
  }

  static async abandonarGrupo(grupoId: string, usuarioId: string) {
    return prisma.usuarioGrupo.deleteMany({
      where: {
        grupoId,
        usuarioId,
      },
    });
  }

  static async obtenerMiembrosDelGrupo(grupoId: string) {
    return prisma.usuarioGrupo.findMany({
      where: { grupoId },
      select: {
        usuarioId: true,
      },
    });
  }
}
