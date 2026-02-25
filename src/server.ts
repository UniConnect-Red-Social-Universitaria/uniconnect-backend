import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { inicializarSocket } from './lib/socket';

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
inicializarSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`✅ Servidor en http://localhost:${PORT}`);
    console.log(`📦 Conectado a MongoDB`);
    console.log('⚡ Chat en tiempo real activo con Socket.IO');
});