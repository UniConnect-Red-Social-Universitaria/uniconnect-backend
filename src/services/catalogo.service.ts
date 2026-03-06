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

export class CatalogoService {
    static async poblar() {
        const carrerasInsertadas = await CarreraModel.crearCatalogo(CARRERAS_OFICIALES);
        const materiasInsertadas = await MateriaModel.crearCatalogo(MATERIAS_BASE);

        return {
            carrerasInsertadas: carrerasInsertadas.count,
            materiasInsertadas: materiasInsertadas.count
        };
    }

    static async listar() {
        const [carreras, materias] = await Promise.all([
            CarreraModel.listarTodas(),
            MateriaModel.listarTodas()
        ]);

        return { carreras, materias };
    }
}
