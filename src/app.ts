import express from "express";
import cors from "cors";
import path from "path";

import usuarioRoutes from "./modules/users/interfaces/http/usuario.routes";
import materiaRoutes from "./modules/materias/interfaces/http/materia.routes";
import grupoRoutes from "./modules/groups/interfaces/http/grupo.routes";
import mensajeRoutes from "./modules/messages/interfaces/http/mensaje.routes";
import eventoRoutes from "./modules/events/interfaces/http/evento.routes";
import catalogoRoutes from "./modules/catalog/interfaces/http/catalogo.routes";

import { version } from "../package.json";

export const app = express();

const uploadsDir = path.resolve(process.cwd(), "uploads");

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.use("/api/usuarios", usuarioRoutes);
app.use("/api/materias", materiaRoutes);
app.use("/api/grupos", grupoRoutes);
app.use("/api/mensajes", mensajeRoutes);
app.use("/api/eventos", eventoRoutes);
app.use("/api/catalogos", catalogoRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    version: version || "1.0.0",
  });
});

app.get("/", (req, res) => {
  res.json({
    mensaje: "🚀 API de UniConnect con MongoDB",
    endpoints: {
      usuarios: "GET /api/usuarios",
      registro: "POST /api/usuarios/registro",
      login: "POST /api/usuarios/login",
      buscarPorMateria: "GET /api/usuarios/buscar-por-materia?materia=...",
      enviarSolicitud: "POST /api/usuarios/solicitudes",
      companeros: "GET /api/usuarios/companeros",
      crearMateria: "POST /api/materias",
      crearGrupo: "POST /api/grupos",
      enviarMensaje: "POST /api/mensajes",
      historialMensajes: "GET /api/mensajes/:companeroId?limit=50",
      crearEvento: "POST /api/eventos",
      listarEventos: "GET /api/eventos",
      poblarCatalogos: "POST /api/catalogos/poblar",
      listarCatalogos: "GET /api/catalogos",
    },
  });
});
