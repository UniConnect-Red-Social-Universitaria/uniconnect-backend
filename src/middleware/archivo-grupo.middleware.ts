import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { NextFunction, Request, Response } from 'express';

const LIMITE_PDF_BYTES = 10 * 1024 * 1024;
const directorioSubidas = path.resolve(process.cwd(), 'uploads', 'grupos');

if (!fs.existsSync(directorioSubidas)) {
    fs.mkdirSync(directorioSubidas, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, directorioSubidas);
    },
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname) || '.pdf';
        const nombreSeguro = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension.toLowerCase()}`;
        cb(null, nombreSeguro);
    }
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const esPdf = file.mimetype === 'application/pdf' && extension === '.pdf';

    if (!esPdf) {
        cb(new Error('Solo se permiten archivos PDF'));
        return;
    }

    cb(null, true);
};

export const uploadArchivoGrupo = multer({
    storage,
    limits: {
        fileSize: LIMITE_PDF_BYTES
    },
    fileFilter
});

export const limiteArchivoGrupoBytes = LIMITE_PDF_BYTES;

export function procesarUploadArchivoGrupo(req: Request, res: Response, next: NextFunction) {
    uploadArchivoGrupo.single('archivo')(req, res, (error: unknown) => {
        if (!error) {
            next();
            return;
        }

        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
                success: false,
                message: `El PDF excede el límite de ${Math.floor(LIMITE_PDF_BYTES / (1024 * 1024))}MB`
            });
            return;
        }

        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
            return;
        }

        res.status(400).json({
            success: false,
            message: 'No se pudo procesar el archivo'
        });
    });
}
