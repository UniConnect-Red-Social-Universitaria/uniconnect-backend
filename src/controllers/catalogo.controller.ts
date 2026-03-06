import { Request, Response } from 'express';
import { CarreraModel } from '../models/carrera.model';
import { MateriaModel } from '../models/materia.model';

const CARRERAS_OFICIALES = [
    'Ingeniería de Sistemas y Computación',
    'Ingeniería Industrial',
    'Ingeniería Civil',
    'Arquitectura',
    'Derecho',
    'Administración de Empresas',
    'Medicina',
    'Enfermería',
    'Licenciatura en Matemáticas',
    'Licenciatura en Lenguas Modernas'
];

const MATERIAS_BASE = [
    'Cálculo I',
    'Programación I',
    'Estructuras de Datos',
    'Base de Datos',
    'Física I',
    'Probabilidad y Estadística',
    'Economía General',
    'Inglés I',
    'Álgebra Lineal',
    'Química General'
];

export class CatalogoController {
    static async poblar(req: Request, res: Response) {
        try {
            const carrerasInsertadas = await CarreraModel.crearCatalogo(CARRERAS_OFICIALES);
            const materiasInsertadas = await MateriaModel.crearCatalogo(MATERIAS_BASE);

            return res.status(201).json({
                success: true,
                message: 'Catálogo oficial cargado',
                data: {
                    carrerasInsertadas: carrerasInsertadas.count,
                    materiasInsertadas: materiasInsertadas.count
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al poblar catálogos',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    static async listar(req: Request, res: Response) {
        try {
            const [carreras, materias] = await Promise.all([
                CarreraModel.listarTodas(),
                MateriaModel.listarTodas()
            ]);

            return res.status(200).json({
                success: true,
                data: {
                    carreras,
                    materias
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al listar catálogos',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
