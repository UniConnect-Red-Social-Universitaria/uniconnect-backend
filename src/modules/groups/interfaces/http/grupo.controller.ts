import { Request, Response } from 'express';

import { groupUseCases, materiaUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class GrupoController {
  static async buscar(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.buscarPorTexto(req.usuario, req.query.q);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al buscar grupos');
    }
  }

  static async crearMateria(req: Request, res: Response) {
    try {
      const resultado = await materiaUseCases.crear(req.body?.nombre);

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al crear materia');
    }
  }

  static async crearGrupo(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.crearGrupo(req.usuario, {
        nombre: req.body?.nombre,
        materiaId: req.body?.materiaId,
      });

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al crear grupo');
    }
  }

  static async listarMisGrupos(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.listarMisGrupos(req.usuario);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar grupos');
    }
  }

  static async listarGruposDisponibles(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.listarGruposDisponibles(req.usuario);

      return res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar grupos disponibles');
    }
  }

  static async solicitarIngreso(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.solicitarIngreso(req.usuario, req.params.id);

      return res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al solicitar ingreso al grupo');
    }
  }

  static async listarSolicitudesGrupo(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.listarSolicitudesGrupo(req.usuario, req.params.id);
      return res.json({ success: true, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar solicitudes del grupo');
    }
  }

  static async listarMisSolicitudes(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.listarMisSolicitudes(req.usuario);
      return res.json({ success: true, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar mis solicitudes');
    }
  }

  static async aprobarSolicitud(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.aprobarSolicitud(
        req.usuario,
        req.params.id,
        req.params.solicitudId,
      );
      return res.json({ success: true, message: resultado.message });
    } catch (error) {
      return handleControllerError(res, error, 'Error al aprobar solicitud');
    }
  }

  static async rechazarSolicitud(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.rechazarSolicitud(
        req.usuario,
        req.params.id,
        req.params.solicitudId,
      );
      return res.json({ success: true, message: resultado.message });
    } catch (error) {
      return handleControllerError(res, error, 'Error al rechazar solicitud');
    }
  }

  static async subirArchivo(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.subirArchivo(
        req.usuario,
        req.params.id,
        req.file,
        req.body?.nombre,
      );
      return res.status(201).json({ success: true, message: resultado.message, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al subir el archivo');
    }
  }

  static async listarArchivos(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.listarArchivos(req.usuario, req.params.id);
      return res.json({ success: true, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al listar archivos');
    }
  }

  static async descargarArchivo(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.obtenerRutaArchivo(
        req.usuario,
        req.params.id,
        req.params.archivoId,
      );
      return res.json({ success: true, data: { url: resultado.data.ruta, nombre: resultado.data.nombre } });
    } catch (error) {
      return handleControllerError(res, error, 'Error al descargar el archivo');
    }
  }

  static async cederAdministracion(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.cederAdministracion(
        req.usuario,
        req.params.id,
        req.body?.nuevoAdminId,
      );
      return res.json({ success: true, message: resultado.message });
    } catch (error) {
      return handleControllerError(res, error, 'Error al ceder la administración');
    }
  }

  static async agregarMiembro(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.agregarMiembro(
        req.usuario,
        req.params.id,
        req.body?.usuarioId,
      );

      return res.status(201).json({ success: true, message: resultado.message });
    } catch (error) {
      return handleControllerError(res, error, 'Error al agregar miembro');
    }
  }

  static async abandonarGrupo(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.abandonarGrupo(req.usuario, req.params.id);
      return res.json({ success: true, message: resultado.message, grupoEliminado: resultado.grupoEliminado });
    } catch (error) {
      return handleControllerError(res, error, 'Error al abandonar el grupo');
    }
  }

  static async obtenerMiembrosGrupo(req: Request, res: Response) {
    try {
      const resultado = await groupUseCases.obtenerMiembrosGrupo(req.usuario, req.params.id);
      return res.json({ success: true, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener miembros del grupo');
    }
  }
}
