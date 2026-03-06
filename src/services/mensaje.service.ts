import { MensajeModel } from '../models/mensaje.model';
import { UsuarioModel } from '../models/usuario.model';
import { ContactoModel } from '../models/contacto.model';
import { GrupoModel } from '../models/grupo.model';
import { ServiceError } from './service-error';

export class MensajeService {
    static async enviarMensajeGrupo(usuarioId: string, grupoId: unknown, contenido: unknown) {
        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ServiceError(400, 'Debes enviar un grupoId válido');
        }

        if (typeof contenido !== 'string' || !contenido.trim()) {
            throw new ServiceError(400, 'Debes enviar un contenido de mensaje válido');
        }

        const pertenencia = await GrupoModel.usuarioPertenece(grupoId.trim(), usuarioId);

        if (!pertenencia.existe) {
            throw new ServiceError(404, 'El grupo no existe');
        }

        if (!pertenencia.pertenece) {
            throw new ServiceError(403, 'Solo los integrantes del grupo pueden enviar mensajes');
        }

        return MensajeModel.crearMensajeGrupo({
            contenido: contenido.trim(),
            grupoId: grupoId.trim(),
            emisorId: usuarioId
        });
    }

    static async obtenerHistorialGrupo(usuarioId: string, grupoId: unknown, limitQueryRaw: unknown) {
        const limitQuery = Number(limitQueryRaw ?? 100);
        const limit = Number.isInteger(limitQuery) && limitQuery > 0 && limitQuery <= 300
            ? limitQuery
            : 100;

        if (typeof grupoId !== 'string' || !grupoId.trim()) {
            throw new ServiceError(400, 'Debes enviar un grupoId válido');
        }

        const pertenencia = await GrupoModel.usuarioPertenece(grupoId.trim(), usuarioId);

        if (!pertenencia.existe) {
            throw new ServiceError(404, 'El grupo no existe');
        }

        if (!pertenencia.pertenece) {
            throw new ServiceError(403, 'Solo los integrantes del grupo pueden consultar el historial');
        }

        return MensajeModel.obtenerHistorialGrupo(grupoId.trim(), limit);
    }

    static async enviarMensaje(usuarioId: string, receptorId: unknown, contenido: unknown) {
        if (typeof receptorId !== 'string' || !receptorId.trim()) {
            throw new ServiceError(400, 'Debes enviar un receptorId válido');
        }

        if (typeof contenido !== 'string' || !contenido.trim()) {
            throw new ServiceError(400, 'Debes enviar un contenido de mensaje válido');
        }

        if (receptorId.trim() === usuarioId) {
            throw new ServiceError(400, 'No puedes enviarte mensajes a ti mismo');
        }

        const receptor = await UsuarioModel.buscarPorId(receptorId.trim());

        if (!receptor) {
            throw new ServiceError(404, 'El receptor no existe');
        }

        const relacion = await ContactoModel.existeRelacionEntreUsuarios(usuarioId, receptorId.trim());

        if (!relacion || relacion.estado !== 'ACEPTADA') {
            throw new ServiceError(403, 'Solo puedes chatear con compañeros agregados');
        }

        return MensajeModel.crear({
            contenido: contenido.trim(),
            emisorId: usuarioId,
            receptorId: receptorId.trim()
        });
    }

    static async obtenerHistorial(usuarioId: string, companeroId: unknown, limitQueryRaw: unknown) {
        const limitQuery = Number(limitQueryRaw ?? 50);
        const limit = Number.isInteger(limitQuery) && limitQuery > 0 && limitQuery <= 200
            ? limitQuery
            : 50;

        if (typeof companeroId !== 'string' || !companeroId.trim()) {
            throw new ServiceError(400, 'Debes enviar un companeroId válido');
        }

        if (companeroId.trim() === usuarioId) {
            throw new ServiceError(400, 'No puedes consultar conversación contigo mismo');
        }

        const companero = await UsuarioModel.buscarPorId(companeroId.trim());

        if (!companero) {
            throw new ServiceError(404, 'El compañero no existe');
        }

        const relacion = await ContactoModel.existeRelacionEntreUsuarios(usuarioId, companeroId.trim());

        if (!relacion || relacion.estado !== 'ACEPTADA') {
            throw new ServiceError(403, 'Solo puedes consultar chats con compañeros agregados');
        }

        return MensajeModel.obtenerConversacion(usuarioId, companeroId.trim(), limit);
    }
}
