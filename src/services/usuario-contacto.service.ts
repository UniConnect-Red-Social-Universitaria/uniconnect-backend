import { ContactoModel } from '../models/contacto.model';
import { UsuarioModel } from '../models/usuario.model';

export class UsuarioContactoServiceError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.name = 'UsuarioContactoServiceError';
        this.statusCode = statusCode;
    }
}

export class UsuarioContactoService {
    static async buscarPorMateria(usuarioId: string, materia: string) {
        return UsuarioModel.buscarPorMateriaExcluyendo(materia, usuarioId, []);
    }

    static async enviarSolicitudConexion(usuarioOrigenId: string, usuarioDestinoId: string) {
        if (usuarioDestinoId === usuarioOrigenId) {
            throw new UsuarioContactoServiceError(400, 'No puedes enviarte solicitud a ti mismo');
        }

        const usuarioDestino = await UsuarioModel.buscarPorId(usuarioDestinoId);

        if (!usuarioDestino) {
            throw new UsuarioContactoServiceError(404, 'Usuario destino inexistente');
        }

        const relacionExistente = await ContactoModel.existeRelacionEntreUsuarios(usuarioOrigenId, usuarioDestinoId);

        if (relacionExistente) {
            if (relacionExistente.estado === 'ACEPTADA') {
                throw new UsuarioContactoServiceError(409, 'Este compañero ya está agregado');
            }

            throw new UsuarioContactoServiceError(409, 'Ya existe una solicitud de conexión entre estos usuarios');
        }

        return ContactoModel.crearSolicitud(usuarioOrigenId, usuarioDestinoId);
    }

    static async listarCompaneros(usuarioId: string) {
        return ContactoModel.listarCompanerosAceptados(usuarioId);
    }

    static async listarSolicitudesRecibidas(usuarioId: string) {
        return ContactoModel.listarSolicitudesRecibidas(usuarioId);
    }

    static async aceptarSolicitud(solicitudId: string, usuarioId: string) {
        try {
            return await ContactoModel.aceptarSolicitud(solicitudId, usuarioId);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'Solicitud no encontrada') {
                    throw new UsuarioContactoServiceError(404, error.message);
                }

                if (
                    error.message === 'No tienes permiso para aceptar esta solicitud' ||
                    error.message === 'La solicitud ya fue procesada'
                ) {
                    throw new UsuarioContactoServiceError(403, error.message);
                }
            }

            throw error;
        }
    }

    static async rechazarSolicitud(solicitudId: string, usuarioId: string) {
        try {
            return await ContactoModel.rechazarSolicitud(solicitudId, usuarioId);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'Solicitud no encontrada') {
                    throw new UsuarioContactoServiceError(404, error.message);
                }

                if (
                    error.message === 'No tienes permiso para rechazar esta solicitud' ||
                    error.message === 'La solicitud ya fue procesada'
                ) {
                    throw new UsuarioContactoServiceError(403, error.message);
                }
            }

            throw error;
        }
    }
}
