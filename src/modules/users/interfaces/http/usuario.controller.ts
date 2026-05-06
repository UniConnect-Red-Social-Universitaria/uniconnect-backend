import { Request, Response } from "express";

import { usersUseCases } from '../../../../container';
import { handleControllerError } from '../../../../shared/controller-error';

export class UsuarioController {
  static async buscarGlobal(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.buscarGlobal(req.usuario, req.query.q);

      res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        'Error al buscar usuarios y materias',
      );
    }
  }

  // Buscar estudiantes por materia (excluye al usuario autenticado y relaciones existentes)
  static async buscarPorMateria(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.buscarPorMateria(
        req.usuario,
        req.query.materia,
      );

      res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        'Error al buscar estudiantes por materia',
      );
    }
  }

  // Enviar solicitud de conexión
  static async enviarSolicitudConexion(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.enviarSolicitudConexion(
        req.usuario,
        req.body?.usuarioDestinoId,
      );

      res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        'Error al enviar solicitud de conexión',
      );
    }
  }

  // Listar compañeros agregados (solo relaciones aceptadas)
  static async listarCompaneros(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.listarCompaneros(req.usuario);

      res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      require('fs').appendFileSync('error_debug.txt', '\nERROR LISTAR COMPANEROS: ' + (error instanceof Error ? error.stack : String(error)));
      return handleControllerError(res, error, 'Error al listar compañeros');
    }
  }

  // Listar solicitudes recibidas (pendientes)
  static async listarSolicitudesRecibidas(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.listarSolicitudesRecibidas(req.usuario);

      res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(
        res,
        error,
        'Error al listar solicitudes recibidas',
      );
    }
  }

  // Aceptar solicitud de conexión
  static async aceptarSolicitud(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.aceptarSolicitud(
        req.usuario,
        req.body?.solicitudId,
      );

      res.json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al aceptar solicitud');
    }
  }

  // Rechazar solicitud de conexión
  static async rechazarSolicitud(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.rechazarSolicitud(
        req.usuario,
        req.body?.solicitudId,
      );

      res.json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al rechazar solicitud');
    }
  }

  // Registrar usuario
  static async registrar(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.registrar(req.body);

      res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al registrar usuario');
    }
  }

  // Obtener todos los usuarios
  static async obtenerTodos(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.obtenerTodos();
      res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener usuarios', false);
    }
  }

  // Logout: invalida el token actual
  static async logout(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.logout(req.token);

      return res.json({
        success: true,
        message: resultado.message,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al cerrar sesión');
    }
  }

  // Login: autenticar usuario con correo y contraseña
  static async login(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.login(
        req.body?.correo,
        req.body?.contrasena,
      );

      res.json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al iniciar sesión');
    }
  }

  // Obtener perfil del usuario autenticado (protegido)
  static async obtenerPerfil(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.obtenerPerfil(req.usuario);

      res.json({
        success: true,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener perfil');
    }
  }

  // Actualizar perfil del usuario autenticado (protegido)
  static async actualizarPerfil(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.actualizarPerfil(req.usuario, {
        carrera: req.body?.carrera,
        semestre: req.body?.semestre,
        materiasCursando: req.body?.materiasCursando,
      });

      res.json({
        success: true,
        message: resultado.message,
        data: resultado.data,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al actualizar perfil');
    }
  }
  static async obtenerPerfilPublico(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.obtenerPerfilPublico(req.params.id);
      return res.json({ success: true, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener perfil');
    }
  }

  static async obtenerPerfilEnriquecido(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.obtenerPerfilEnriquecido(req.params.id);
      return res.json({ success: true, data: resultado.data });
    } catch (error) {
      return handleControllerError(res, error, 'Error al obtener perfil enriquecido');
    }
  }

  //eliminar usuario sin importar si esta autenticado o no, se puede eliminar por id
  static async eliminarUsuario(req: Request, res: Response) {
    try {
      const resultado = await usersUseCases.eliminarUsuario(req.params.id);
      res.json({
        success: true,
        message: resultado.message,
      });
    } catch (error) {
      return handleControllerError(res, error, 'Error al eliminar usuario');
    }
  }
}