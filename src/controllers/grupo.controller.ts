import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { MateriaModel } from "../models/materia.model";
import { GrupoModel } from "../models/grupo.model";

export class GrupoController {
  static async crearMateria(req: Request, res: Response) {
    try {
      const { nombre } = req.body;

      if (typeof nombre !== "string" || !nombre.trim()) {
        return res.status(400).json({
          success: false,
          message: "Debes enviar un nombre de materia válido",
        });
      }

      const nombreNormalizado = nombre.trim();
      const materiaExistente =
        await MateriaModel.buscarPorNombre(nombreNormalizado);

      if (materiaExistente) {
        return res.status(409).json({
          success: false,
          message: "La materia ya existe",
        });
      }

      const materia = await MateriaModel.crear(nombreNormalizado);

      return res.status(201).json({
        success: true,
        message: "Materia creada correctamente",
        data: {
          id: materia.id,
          nombre: materia.nombre,
          createdAt: materia.createdAt,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return res.status(409).json({
          success: false,
          message: "La materia ya existe",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error al crear materia",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async crearGrupo(req: Request, res: Response) {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const usuario = req.usuario;
      const { nombre, materiaId } = req.body;
      const nombreNormalizado = nombre.trim();
      const grupoExistente =
        await GrupoModel.buscarPorNombre(nombreNormalizado);
      if (grupoExistente) {
        return res.status(409).json({
          success: false,
          message: "Ya existe un grupo con ese nombre",
        });
      }

      if (typeof nombre !== "string" || !nombre.trim()) {
        return res.status(400).json({
          success: false,
          message: "Debes enviar un nombre de grupo válido",
        });
      }

      if (typeof materiaId !== "string" || !materiaId.trim()) {
        return res.status(400).json({
          success: false,
          message: "Debes enviar un materiaId válido",
        });
      }

      const materia = await MateriaModel.buscarPorId(materiaId.trim());

      if (!materia) {
        return res.status(404).json({
          success: false,
          message: "La materia asociada no existe",
        });
      }

      // Verificar que el usuario esté cursando la materia
      if (!usuario.materiasCursando.includes(materia.nombre)) {
        return res.status(403).json({
          success: false,
          message: "No puedes crear grupos de materias que no estás cursando",
        });
      }

      // Verificar límite de 3 grupos por materia
      const count = await GrupoModel.contarGruposPorMateria(materia.id);
      if (count >= 3) {
        return res.status(409).json({
          success: false,
          message: "Ya hay 3 grupos para esta materia",
        });
      }

      const grupo = await GrupoModel.crear({
        nombre: nombre.trim(),
        materiaId: materia.id,
        creadorId: usuario.id,
      });

      return res.status(201).json({
        success: true,
        message: "Grupo creado correctamente",
        data: {
          id: grupo.id,
          nombre: grupo.nombre,
          materia: grupo.materia,
          creadorId: grupo.creadorId,
          cantidadMiembros: grupo.miembros.length,
          createdAt: grupo.createdAt,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2023"
      ) {
        return res.status(400).json({
          success: false,
          message: "materiaId tiene formato inválido",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error al crear grupo",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async listarMisGrupos(req: Request, res: Response) {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const usuario = req.usuario;
      const grupos = await GrupoModel.listarPorUsuario(usuario.id);

      const gruposFormateados = grupos.map((grupo) => ({
        id: grupo.id,
        nombre: grupo.nombre,
        materia: {
          id: grupo.materia.id,
          nombre: grupo.materia.nombre,
        },
        creadorId: grupo.creadorId,
        cantidadMiembros: grupo.miembros.length,
        miembros: grupo.miembros.map((m) => ({
          id: m.usuario.id,
          nombre: m.usuario.nombre,
          apellido: m.usuario.apellido,
        })),
        createdAt: grupo.createdAt,
      }));

      return res.json({
        success: true,
        data: gruposFormateados,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error al listar grupos",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async listarGruposDisponibles(req: Request, res: Response) {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const usuario = req.usuario;
      const grupos = await GrupoModel.listarDisponibles(
        usuario.materiasCursando,
        usuario.id,
      );

      const gruposFormateados = grupos.map((grupo) => ({
        id: grupo.id,
        nombre: grupo.nombre,
        materia: {
          id: grupo.materia.id,
          nombre: grupo.materia.nombre,
        },
        creadorId: grupo.creadorId,
        cantidadMiembros: grupo.miembros.length,
        miembros: grupo.miembros.map((m) => ({
          id: m.usuario.id,
          nombre: m.usuario.nombre,
          apellido: m.usuario.apellido,
        })),
        createdAt: grupo.createdAt,
      }));

      return res.json({
        success: true,
        data: gruposFormateados,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error al listar grupos disponibles",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async unirseAGrupo(req: Request, res: Response) {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const usuario = req.usuario;
      const { id } = req.params;

      if (!id || typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "ID de grupo inválido",
        });
      }

      const grupo = await GrupoModel.buscarPorId(id);

      if (!grupo) {
        return res.status(404).json({
          success: false,
          message: "Grupo no encontrado",
        });
      }

      // Verificar que el usuario esté cursando la materia
      if (!usuario.materiasCursando.includes(grupo.materia.nombre)) {
        return res.status(403).json({
          success: false,
          message:
            "No puedes unirte a grupos de materias que no estás cursando",
        });
      }

      // Verificar que no sea ya miembro
      const yaMiembro = grupo.miembros.some((m) => m.usuarioId === usuario.id);
      if (yaMiembro) {
        return res.status(409).json({
          success: false,
          message: "Ya eres miembro de este grupo",
        });
      }

      // Verificar límite de 3 grupos por materia
      const count = await GrupoModel.contarGruposPorMateria(grupo.materiaId);
      if (count >= 3) {
        return res.status(409).json({
          success: false,
          message: "Ya hay 3 grupos para esta materia",
        });
      }

      await GrupoModel.unirse(grupo.id, usuario.id);

      return res.status(200).json({
        success: true,
        message: "Te has unido al grupo correctamente",
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return res.status(409).json({
          success: false,
          message: "Ya eres miembro de este grupo",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error al unirte al grupo",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
