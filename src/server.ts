import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';


import usuarioRoutes from './routes/usuario.routes';
import materiaRoutes from './routes/materia.routes';
import grupoRoutes from './routes/grupo.routes';
import mensajeRoutes from './routes/mensaje.routes';
import { inicializarSocket } from './lib/socket';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/materias', materiaRoutes);
app.use('/api/grupos', grupoRoutes);
app.use('/api/mensajes', mensajeRoutes);

app.get('/', (req, res) => {
    res.json({ 
        mensaje: '🚀 API de UniConnect con MongoDB',
        endpoints: {
            usuarios: 'GET /api/usuarios',
            registro: 'POST /api/usuarios/registro',
            login: 'POST /api/usuarios/login',
            buscarPorMateria: 'GET /api/usuarios/buscar-por-materia?materia=...',
            enviarSolicitud: 'POST /api/usuarios/solicitudes',
            companeros: 'GET /api/usuarios/companeros',
            crearMateria: 'POST /api/materias',
            crearGrupo: 'POST /api/grupos',
            enviarMensaje: 'POST /api/mensajes'
        }
    });
});

const httpServer = http.createServer(app);
inicializarSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`✅ Servidor en http://localhost:${PORT}`);
    console.log(`📦 Conectado a MongoDB`);
    console.log('⚡ Chat en tiempo real activo con Socket.IO');
});