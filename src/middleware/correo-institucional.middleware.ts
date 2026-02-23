import { Request, Response, NextFunction } from 'express';
import { esCorreoInstitucional } from '../utils/registro.util';

export function validarCorreoInstitucional(req: Request, res: Response, next: NextFunction) {
    const correo = req.body?.correo;

    if (typeof correo !== 'string' || !correo.trim()) {
        return res.status(400).json({
            success: false,
            message: 'El correo es obligatorio'
        });
    }

    if (!esCorreoInstitucional(correo)) {
        return res.status(400).json({
            success: false,
            message: 'Solo se permiten correos institucionales'
        });
    }

    return next();
}
