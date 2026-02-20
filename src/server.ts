import 'dotenv/config';
import express from 'express';
import cors from 'cors';


import usuarioRoutes from './routes/usuario.routes';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/usuarios', usuarioRoutes);

app.get('/', (req, res) => {
    res.json({ 
        mensaje: '🚀 API de UniConnect con MongoDB',
        endpoints: {
            usuarios: 'GET /api/usuarios',
            registro: 'POST /api/usuarios/registro',
            login: 'POST /api/usuarios/login',
            buscarPorMateria: 'GET /api/usuarios/buscar-por-materia?materia=...',
            enviarSolicitud: 'POST /api/usuarios/solicitudes',
            companeros: 'GET /api/usuarios/companeros'
        }
    });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor en http://localhost:${PORT}`);
    console.log(`📦 Conectado a MongoDB`);
});