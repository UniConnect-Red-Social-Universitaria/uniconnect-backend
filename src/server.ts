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
            usuarios: 'GET /api/usuarios - POST /api/usuarios'
        }
    });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor en http://localhost:${PORT}`);
    console.log(`📦 Conectado a MongoDB`);
});