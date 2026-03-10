import { MateriaModel } from '../models/materia.model';
import { GrupoModel } from '../models/grupo.model';
import { UsuarioModel } from '../models/usuario.model';
import { ServiceError } from './service-error';

export class GrupoService {
    private static readonly MAX_MIEMBROS_GRUPO = 8;
    private static readonly MAX_GRUPOS_POR_MATERIA = 3;

    private static normalizarTexto(texto: string) {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    private static async validarUsuarioCursaMateriaGrupo(usuarioId: string, materiaId: string) {
        const usuario = await UsuarioModel.buscarPorId(usuarioId);

        if (!usuario) {
            throw new ServiceError(404, 'El usuario no existe');
        }

        const materiaGrupo = await MateriaModel.buscarPorId(materiaId);

        if (!materiaGrupo) {
            throw new ServiceError(404, 'La materia asociada al grupo no existe');
        }

        const materiasUsuario = Array.isArray(usuario.materiasCursando)
            ? (usuario.materiasCursando as string[])
            : [];
        const cursaMateriaDelGrupo = materiasUsuario.some(
            (materiaUsuario) =>
                GrupoService.normalizarTexto(materiaUsuario)
                === GrupoService.normalizarTexto(materiaGrupo.nombre)
        );

        if (!cursaMateriaDelGrupo) {
            throw new ServiceError(
                403,
                `Debes cursar la materia ${materiaGrupo.nombre} para unirte a este grupo`
            );
        }
    }

    static async crearMateria(nombre: unknown) {
        if (typeof nombre !== 'string' || !nombre.trim()) {
            throw new ServiceError(400, 'Debes enviar un nombre de materia válido');
        }

        const nombreNormalizado = nombre.trim();
        const materiaExistente = await MateriaModel.buscarPorNombre(nombreNormalizado);

        if (materiaExistente) {
            throw new ServiceError(409, 'La materia ya existe');
        }

        return MateriaModel.crear(nombreNormalizado);
    }

    static async crearGrupo(usuarioId: string, nombre: unknown, materiaId: unknown) {
        if (typeof nombre !== 'string' || !nombre.trim()) {
            throw new ServiceError(400, 'Debes enviar un nombre de grupo válido');
        }

        if (typeof materiaId !== 'string' || !materiaId.trim()) {
            throw new ServiceError(400, 'Debes enviar un materiaId válido');
        }

        const materia = await MateriaModel.buscarPorId(materiaId.trim());

        if (!materia) {
            throw new ServiceError(404, 'La materia asociada no existe');
        }

        await GrupoService.validarUsuarioCursaMateriaGrupo(usuarioId, materia.id);

        const cantidadGrupos = await GrupoModel.contarGruposPorMateria(materia.id);
        if (cantidadGrupos >= GrupoService.MAX_GRUPOS_POR_MATERIA) {
            throw new ServiceError(
                409,
                `Ya hay ${GrupoService.MAX_GRUPOS_POR_MATERIA} grupos para la materia ${materia.nombre}`
            );
        }

        const grupoExistente = await GrupoModel.buscarPorNombreYMateria(nombre.trim(), materia.id);
        if (grupoExistente) {
            throw new ServiceError(
                409,
                `Ya existe un grupo con el nombre "${nombre.trim()}" en la materia ${materia.nombre}`
            );
        }

        return GrupoModel.crear({
            nombre: nombre.trim(),
            materiaId: materia.id,
            creadorId: usuarioId
        });
    }

    static async listarMisGrupos(usuarioId: string) {
        const grupos = await GrupoModel.listarPorUsuario(usuarioId);

        return grupos.map((grupo) => ({
            id: grupo.id,
            nombre: grupo.nombre,
            materia: {
                id: grupo.materia?.id ?? '',
                nombre: grupo.materia?.nombre ?? 'Sin materia'
            },
            creadorId: grupo.creadorId,
            cantidadMiembros: grupo.miembros.length,
            miembros: grupo.miembros.map((m) => ({
                id: m.usuario?.id ?? m.id,
                nombre: m.usuario?.nombre ?? 'Usuario',
                apellido: m.usuario?.apellido ?? 'sin apellido'
            })),
            createdAt: grupo.createdAt
        }));
    }

    static async listarGruposDisponibles(usuarioId: string) {
        const grupos = await GrupoModel.listarTodos();

        return grupos.map((grupo) => {
            const yaPertenece = grupo.miembros.some((miembro) => {
                const miembroId = miembro.usuario?.id ?? miembro.usuarioId;
                return miembroId === usuarioId;
            });
            const cantidadMiembros = grupo.miembros.length;
            const cuposDisponibles = Math.max(GrupoService.MAX_MIEMBROS_GRUPO - cantidadMiembros, 0);

            return {
                id: grupo.id,
                nombre: grupo.nombre,
                materia: {
                    id: grupo.materia?.id ?? '',
                    nombre: grupo.materia?.nombre ?? 'Sin materia'
                },
                creadorId: grupo.creadorId,
                cantidadMiembros,
                maxMiembros: GrupoService.MAX_MIEMBROS_GRUPO,
                cuposDisponibles,
                estaLleno: cantidadMiembros >= GrupoService.MAX_MIEMBROS_GRUPO,
                yaPertenece,
                miembros: grupo.miembros.map((m) => ({
                    id: m.usuario?.id ?? m.id,
                    nombre: m.usuario?.nombre ?? 'Usuario',
                    apellido: m.usuario?.apellido ?? 'sin apellido'
                })),
                createdAt: grupo.createdAt
            };
        });
    }

    static async buscarPorTexto(usuarioId: string, texto: string) {
        const grupos = await GrupoModel.buscarPorTexto(texto);

        return grupos.map((grupo) => {
            const yaPertenece = grupo.miembros.some((miembro) => {
                const miembroId = miembro.usuario?.id ?? miembro.usuarioId;
                return miembroId === usuarioId;
            });

            return {
                id: grupo.id,
                nombre: grupo.nombre,
                materia: {
                    id: grupo.materia?.id ?? '',
                    nombre: grupo.materia?.nombre ?? 'Sin materia'
                },
                creadorId: grupo.creadorId,
                cantidadMiembros: grupo.miembros.length,
                yaPertenece,
                createdAt: grupo.createdAt
            };
        });
    }

    static async unirseGrupo(usuarioId: string, grupoId: unknown) {
        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ServiceError(400, 'Debes enviar un grupoId válido');
        }

        const grupo = await GrupoModel.obtenerPorId(grupoId.trim());

        if (!grupo) {
            throw new ServiceError(404, 'El grupo no existe');
        }

        const yaPertenece = grupo.miembros.some((miembro) => miembro.usuarioId === usuarioId);

        if (yaPertenece) {
            throw new ServiceError(409, 'Ya perteneces a este grupo');
        }

        if (grupo.miembros.length >= GrupoService.MAX_MIEMBROS_GRUPO) {
            throw new ServiceError(409, `El grupo alcanzó el máximo de ${GrupoService.MAX_MIEMBROS_GRUPO} integrantes`);
        }

        await GrupoService.validarUsuarioCursaMateriaGrupo(usuarioId, grupo.materiaId ?? '');

        return GrupoModel.agregarMiembro(grupoId.trim(), usuarioId);
    }

    static async agregarMiembro(usuarioSolicitanteId: string, grupoId: unknown, usuarioId: unknown) {
        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ServiceError(400, 'Debes enviar un grupoId válido');
        }

        if (typeof usuarioId !== 'string' || !usuarioId.trim()) {
            throw new ServiceError(400, 'Debes enviar un usuarioId válido');
        }

        const permiso = await GrupoModel.usuarioEsCreador(grupoId.trim(), usuarioSolicitanteId);

        if (!permiso.existe) {
            throw new ServiceError(404, 'El grupo no existe');
        }

        if (!permiso.esCreador) {
            throw new ServiceError(403, 'Solo el creador del grupo puede agregar miembros');
        }

        const grupo = await GrupoModel.obtenerPorId(grupoId.trim());

        if (!grupo) {
            throw new ServiceError(404, 'El grupo no existe');
        }

        if (grupo.miembros.length >= GrupoService.MAX_MIEMBROS_GRUPO) {
            throw new ServiceError(409, `El grupo alcanzó el máximo de ${GrupoService.MAX_MIEMBROS_GRUPO} integrantes`);
        }

        const usuario = await UsuarioModel.buscarPorId(usuarioId.trim());

        if (!usuario) {
            throw new ServiceError(404, 'El usuario a agregar no existe');
        }

        await GrupoService.validarUsuarioCursaMateriaGrupo(usuarioId.trim(), grupo.materiaId ?? '');

        return GrupoModel.agregarMiembro(grupoId.trim(), usuarioId.trim());
    }
}
