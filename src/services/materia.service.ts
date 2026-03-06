import { MateriaModel } from '../models/materia.model';
import { ServiceError } from './service-error';

export class MateriaService {
    static async crear(nombre: unknown) {
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

    static async listar() {
        return MateriaModel.listarTodas();
    }
}
