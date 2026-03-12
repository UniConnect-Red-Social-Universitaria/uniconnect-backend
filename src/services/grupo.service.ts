import { MateriaModel } from '../models/materia.model';
import { GrupoModel } from '../models/grupo.model';
import { UsuarioModel } from '../models/usuario.model';
import { ServiceError } from './service-error';

type EstadoGrupo = 'ACTIVO' | 'CERRADO';

type UsuarioBasico = {
    id: string;
    nombre: string;
    apellido: string;
};

type MiembroGrupo = {
    id?: string;
    usuarioId?: string;
    usuario?: UsuarioBasico | null;
};

type GrupoConRelaciones = {
    id: string;
    nombre: string;
    creadorId: string;
    administradorId: string;
    estado: EstadoGrupo;
    createdAt: Date;
    materia?: {
        id: string;
        nombre: string;
    } | null;
    administrador?: UsuarioBasico | null;
    miembros: MiembroGrupo[];
};

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

    private static formatearMiembros(miembros: MiembroGrupo[]) {
        return miembros.map((miembro) => ({
            id: miembro.usuario?.id ?? miembro.usuarioId ?? miembro.id ?? '',
            nombre: miembro.usuario?.nombre ?? 'Usuario',
            apellido: miembro.usuario?.apellido ?? 'sin apellido'
        }));
    }

    private static formatearGrupo(grupo: GrupoConRelaciones, usuarioActualId?: string) {
        const miembros = GrupoService.formatearMiembros(grupo.miembros ?? []);
        const administrador = grupo.administrador ?? miembros.find((miembro) => miembro.id === grupo.administradorId) ?? null;

        return {
            id: grupo.id,
            nombre: grupo.nombre,
            materia: {
                id: grupo.materia?.id ?? '',
                nombre: grupo.materia?.nombre ?? 'Sin materia'
            },
            creadorId: grupo.creadorId,
            administradorId: grupo.administradorId,
            administrador: administrador
                ? {
                    id: administrador.id,
                    nombre: administrador.nombre,
                    apellido: administrador.apellido
                }
                : null,
            estado: grupo.estado,
            estaCerrado: grupo.estado === 'CERRADO',
            esAdministradorActual: typeof usuarioActualId === 'string'
                ? grupo.administradorId === usuarioActualId
                : false,
            cantidadMiembros: miembros.length,
            miembros,
            createdAt: grupo.createdAt
        };
    }

    private static async obtenerGrupoValido(grupoId: string) {
        const grupo = await GrupoModel.obtenerPorId(grupoId);

        if (!grupo) {
            throw new ServiceError(404, 'El grupo no existe');
        }

        return grupo;
    }

    private static validarGrupoActivo(grupo: { estado?: EstadoGrupo }) {
        if (grupo.estado === 'CERRADO') {
            throw new ServiceError(409, 'El grupo está cerrado');
        }
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

        const grupo = await GrupoModel.crear({
            nombre: nombre.trim(),
            materiaId: materia.id,
            creadorId: usuarioId
        });

        return GrupoService.formatearGrupo(grupo as GrupoConRelaciones, usuarioId);
    }

    static async listarMisGrupos(usuarioId: string) {
        const grupos = await GrupoModel.listarPorUsuario(usuarioId);

        return grupos.map((grupo) => GrupoService.formatearGrupo(grupo as GrupoConRelaciones, usuarioId));
    }

    static async listarGruposDisponibles(usuarioId: string) {
        const grupos = await GrupoModel.listarTodos();

        return grupos
            .filter((grupo) => grupo.estado !== 'CERRADO')
            .map((grupo) => {
            const yaPertenece = grupo.miembros.some((miembro: MiembroGrupo) => {
                const miembroId = miembro.usuario?.id ?? miembro.usuarioId;
                return miembroId === usuarioId;
            });
            const cantidadMiembros = grupo.miembros.length;
            const cuposDisponibles = Math.max(GrupoService.MAX_MIEMBROS_GRUPO - cantidadMiembros, 0);
            const grupoFormateado = GrupoService.formatearGrupo(grupo as GrupoConRelaciones, usuarioId);

            return {
                ...grupoFormateado,
                maxMiembros: GrupoService.MAX_MIEMBROS_GRUPO,
                cuposDisponibles,
                estaLleno: cantidadMiembros >= GrupoService.MAX_MIEMBROS_GRUPO,
                yaPertenece
            };
        });
    }

    static async buscarPorTexto(usuarioId: string, texto: string) {
        const grupos = await GrupoModel.buscarPorTexto(texto);

        return grupos
            .filter((grupo) => grupo.estado !== 'CERRADO')
            .map((grupo) => {
            const yaPertenece = grupo.miembros.some((miembro: MiembroGrupo) => {
                const miembroId = miembro.usuario?.id ?? miembro.usuarioId;
                return miembroId === usuarioId;
            });

            const grupoFormateado = GrupoService.formatearGrupo(grupo as GrupoConRelaciones, usuarioId);

            return {
                ...grupoFormateado,
                yaPertenece
            };
        });
    }

    static async unirseGrupo(usuarioId: string, grupoId: unknown) {
        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ServiceError(400, 'Debes enviar un grupoId válido');
        }

        const grupo = await GrupoService.obtenerGrupoValido(grupoId.trim());

        GrupoService.validarGrupoActivo(grupo as { estado?: EstadoGrupo });

        const yaPertenece = grupo.miembros.some((miembro: MiembroGrupo) => miembro.usuarioId === usuarioId);

        if (yaPertenece) {
            throw new ServiceError(409, 'Ya perteneces a este grupo');
        }

        if (grupo.miembros.length >= GrupoService.MAX_MIEMBROS_GRUPO) {
            throw new ServiceError(409, `El grupo alcanzó el máximo de ${GrupoService.MAX_MIEMBROS_GRUPO} integrantes`);
        }

        await GrupoService.validarUsuarioCursaMateriaGrupo(usuarioId, grupo.materiaId ?? '');

        const grupoActualizado = await GrupoModel.agregarMiembro(grupoId.trim(), usuarioId);

        return GrupoService.formatearGrupo(grupoActualizado as GrupoConRelaciones, usuarioId);
    }

    static async agregarMiembro(usuarioSolicitanteId: string, grupoId: unknown, usuarioId: unknown) {
        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ServiceError(400, 'Debes enviar un grupoId válido');
        }

        if (typeof usuarioId !== 'string' || !usuarioId.trim()) {
            throw new ServiceError(400, 'Debes enviar un usuarioId válido');
        }

        const grupo = await GrupoService.obtenerGrupoValido(grupoId.trim());

        if (grupo.administradorId !== usuarioSolicitanteId) {
            throw new ServiceError(403, 'Solo el administrador del grupo puede agregar miembros');
        }

        GrupoService.validarGrupoActivo(grupo as { estado?: EstadoGrupo });

        if (grupo.miembros.length >= GrupoService.MAX_MIEMBROS_GRUPO) {
            throw new ServiceError(409, `El grupo alcanzó el máximo de ${GrupoService.MAX_MIEMBROS_GRUPO} integrantes`);
        }

        if (grupo.miembros.some((miembro: MiembroGrupo) => miembro.usuarioId === usuarioId.trim())) {
            throw new ServiceError(409, 'El usuario ya pertenece a este grupo');
        }

        const usuario = await UsuarioModel.buscarPorId(usuarioId.trim());

        if (!usuario) {
            throw new ServiceError(404, 'El usuario a agregar no existe');
        }

        await GrupoService.validarUsuarioCursaMateriaGrupo(usuarioId.trim(), grupo.materiaId ?? '');

        const grupoActualizado = await GrupoModel.agregarMiembro(grupoId.trim(), usuarioId.trim());

        return GrupoService.formatearGrupo(grupoActualizado as GrupoConRelaciones, usuarioSolicitanteId);
    }

    static async cerrarGrupo(usuarioId: string, grupoId: unknown) {
        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ServiceError(400, 'Debes enviar un grupoId válido');
        }

        const grupo = await GrupoService.obtenerGrupoValido(grupoId.trim());

        if (grupo.administradorId !== usuarioId) {
            throw new ServiceError(403, 'Solo el administrador del grupo puede cerrarlo');
        }

        GrupoService.validarGrupoActivo(grupo as { estado?: EstadoGrupo });

        const grupoCerrado = await GrupoModel.cerrar(grupoId.trim());

        return GrupoService.formatearGrupo(grupoCerrado as GrupoConRelaciones, usuarioId);
    }

    static async cambiarAdministrador(usuarioId: string, grupoId: unknown, nuevoAdministradorId: unknown) {
        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ServiceError(400, 'Debes enviar un grupoId válido');
        }

        if (typeof nuevoAdministradorId !== 'string' || !nuevoAdministradorId.trim()) {
            throw new ServiceError(400, 'Debes enviar un usuarioId válido para el nuevo administrador');
        }

        const grupo = await GrupoService.obtenerGrupoValido(grupoId.trim());

        if (grupo.administradorId !== usuarioId) {
            throw new ServiceError(403, 'Solo el administrador actual puede transferir la administración');
        }

        GrupoService.validarGrupoActivo(grupo as { estado?: EstadoGrupo });

        if (grupo.administradorId === nuevoAdministradorId.trim()) {
            throw new ServiceError(409, 'Ese usuario ya es el administrador del grupo');
        }

        const nuevoAdministradorPertenece = grupo.miembros.some(
            (miembro: MiembroGrupo) => miembro.usuarioId === nuevoAdministradorId.trim()
        );

        if (!nuevoAdministradorPertenece) {
            throw new ServiceError(409, 'El nuevo administrador debe pertenecer al grupo');
        }

        const grupoActualizado = await GrupoModel.actualizarAdministrador(grupoId.trim(), nuevoAdministradorId.trim());

        return GrupoService.formatearGrupo(grupoActualizado as GrupoConRelaciones, usuarioId);
    }

    static async salirGrupo(usuarioId: string, grupoId: unknown) {
        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ServiceError(400, 'Debes enviar un grupoId válido');
        }

        const grupo = await GrupoService.obtenerGrupoValido(grupoId.trim());
        const pertenece = grupo.miembros.some((miembro: MiembroGrupo) => miembro.usuarioId === usuarioId);

        if (!pertenece) {
            throw new ServiceError(403, 'No perteneces a este grupo');
        }

        if (grupo.administradorId === usuarioId) {
            throw new ServiceError(
                409,
                'El administrador no puede salir del grupo sin transferir la administración o cerrar el grupo'
            );
        }

        const grupoActualizado = await GrupoModel.removerMiembro(grupoId.trim(), usuarioId);

        return GrupoService.formatearGrupo(grupoActualizado as GrupoConRelaciones, usuarioId);
    }

    static async removerMiembro(usuarioId: string, grupoId: unknown, miembroId: unknown) {
        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ServiceError(400, 'Debes enviar un grupoId válido');
        }

        if (typeof miembroId !== 'string' || !miembroId.trim()) {
            throw new ServiceError(400, 'Debes enviar un usuarioId válido');
        }

        const grupo = await GrupoService.obtenerGrupoValido(grupoId.trim());

        if (grupo.administradorId !== usuarioId) {
            throw new ServiceError(403, 'Solo el administrador del grupo puede remover miembros');
        }

        GrupoService.validarGrupoActivo(grupo as { estado?: EstadoGrupo });

        if (grupo.administradorId === miembroId.trim()) {
            throw new ServiceError(409, 'No puedes remover al administrador actual del grupo');
        }

        const miembroExiste = grupo.miembros.some((miembro: MiembroGrupo) => miembro.usuarioId === miembroId.trim());

        if (!miembroExiste) {
            throw new ServiceError(404, 'El usuario no pertenece a este grupo');
        }

        const grupoActualizado = await GrupoModel.removerMiembro(grupoId.trim(), miembroId.trim());

        return GrupoService.formatearGrupo(grupoActualizado as GrupoConRelaciones, usuarioId);
    }
}
