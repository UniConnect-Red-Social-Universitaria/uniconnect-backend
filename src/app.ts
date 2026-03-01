import express from 'express';
import cors from 'cors';

import usuarioRoutes from './routes/usuario.routes';
import materiaRoutes from './routes/materia.routes';
import grupoRoutes from './routes/grupo.routes';
import mensajeRoutes from './routes/mensaje.routes';
import eventoRoutes from './routes/evento.routes';
import catalogoRoutes from './routes/catalogo.routes';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/materias', materiaRoutes);
app.use('/api/grupos', grupoRoutes);
app.use('/api/mensajes', mensajeRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/catalogos', catalogoRoutes);

app.get('/', (req, res) => {
    res.json({
        mensaje: '🚀 API de UniConnect con MongoDB',
        endpoints: {
            usuarios: 'GET /api/usuarios',
            registro: 'POST /api/usuarios/registro',
            login: 'POST /api/usuarios/login',
            buscarPorMateriaGet: 'GET /api/usuarios/buscar-por-materia?materia=... o ?q=...',
            buscarPorMateriaPost: 'POST /api/usuarios/buscar-por-materia ({ materia | q | query })',
            enviarSolicitud: 'POST /api/usuarios/solicitudes',
            solicitudesRecibidas: 'GET /api/usuarios/solicitudes-recibidas',
            aceptarSolicitud: 'POST /api/usuarios/solicitudes/aceptar',
            rechazarSolicitud: 'POST /api/usuarios/solicitudes/rechazar',
            companeros: 'GET /api/usuarios/companeros',
            crearMateria: 'POST /api/materias',
            crearGrupo: 'POST /api/grupos',
            unirseGrupo: 'POST /api/grupos/:grupoId/unirse',
            agregarMiembroGrupo: 'POST /api/grupos/:grupoId/miembros',
            enviarMensaje: 'POST /api/mensajes',
            historialMensajes: 'GET /api/mensajes/:companeroId?limit=50',
            enviarMensajeGrupo: 'POST /api/mensajes/grupos',
            historialGrupo: 'GET /api/mensajes/grupos/:grupoId?limit=100',
            crearEvento: 'POST /api/eventos',
            listarEventos: 'GET /api/eventos',
            poblarCatalogos: 'POST /api/catalogos/poblar',
            listarCatalogos: 'GET /api/catalogos'
        }
    });
});
