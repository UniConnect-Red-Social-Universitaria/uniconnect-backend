import { MateriaModel } from '../models/materia.model';
import { GrupoModel } from '../models/grupo.model';
import { UsuarioModel } from '../models/usuario.model';
import { ServiceError } from './service-error';

export class GrupoService {
    private static readonly MAX_MIEMBROS_GRUPO = 8;

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
                id: grupo.materia.id,
                nombre: grupo.materia.nombre
            },
            creadorId: grupo.creadorId,
            cantidadMiembros: grupo.miembros.length,
            miembros: grupo.miembros.map((m) => ({
                id: m.usuario.id,
                nombre: m.usuario.nombre,
                apellido: m.usuario.apellido
            })),
            createdAt: grupo.createdAt
        }));
    }

    static async listarGruposDisponibles(usuarioId: string) {
        const grupos = await GrupoModel.listarTodos();

        return grupos.map((grupo) => {
            const yaPertenece = grupo.miembros.some((miembro) => miembro.usuario.id === usuarioId);
            const cantidadMiembros = grupo.miembros.length;
            const cuposDisponibles = Math.max(GrupoService.MAX_MIEMBROS_GRUPO - cantidadMiembros, 0);

            return {
                id: grupo.id,
                nombre: grupo.nombre,
                materia: {
                    id: grupo.materia.id,
                    nombre: grupo.materia.nombre
                },
                creadorId: grupo.creadorId,
                cantidadMiembros,
                maxMiembros: GrupoService.MAX_MIEMBROS_GRUPO,
                cuposDisponibles,
                estaLleno: cantidadMiembros >= GrupoService.MAX_MIEMBROS_GRUPO,
                yaPertenece,
                miembros: grupo.miembros.map((m) => ({
                    id: m.usuario.id,
                    nombre: m.usuario.nombre,
                    apellido: m.usuario.apellido
                })),
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

        return GrupoModel.agregarMiembro(grupoId.trim(), usuarioId.trim());
    }
}
