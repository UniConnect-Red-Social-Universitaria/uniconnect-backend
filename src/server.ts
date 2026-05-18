import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { inicializarSocket } from './lib/socket';
import { logger } from './lib/logger';
import { pollAutoCloseScheduler, recordatorioScheduler } from './container';

const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);
inicializarSocket(httpServer);

httpServer.listen(PORT, () => {
    logger.info(`Servidor en http://localhost:${PORT}`);
    logger.debug('Conectado a base de datos');
    logger.info('Chat en tiempo real activo con Socket.IO');
    recordatorioScheduler.iniciar();
    pollAutoCloseScheduler.iniciar();
});