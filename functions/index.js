// Importações dos módulos necessários
import express from "express";
import alunosRoutes from "./routes/alunosRouter.js";
import * as functions from "firebase-functions";
import notificacoesRoutes from "./routes/notificacoesRouter.js";
import cursosRoutes from "./routes/cursosRouter.js";
import certificadosRoutes from "./routes/certificadosRouter.js";
import adminsRoutes from "./routes/adminsRouter.js";
import turmasRoutes from "./routes/turmasRouter.js";
import cors from "cors";

// Criação da instância do Express
const router = express();
// Middleware para parsear JSON no corpo das requisições
router.use(express.json());
// Middleware para habilitar CORS (Cross-Origin Resource Sharing)
router.use(cors());

// Configuração das rotas da API
// Rota para operações relacionadas aos alunos
router.use("/alunos", alunosRoutes);
// Rota para operações de notificações
router.use("/notificacoes", notificacoesRoutes);
// Rota para operações relacionadas aos cursos
router.use("/cursos", cursosRoutes);
// Rota para operações de processamento de certificados
router.use("/certificados", certificadosRoutes);
// Rota para operações administrativas
router.use("/admins", adminsRoutes);
// Rota para operações relacionadas às turmas
router.use("/turmas", turmasRoutes);

/**
 * Endpoint de saúde da API
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object} JSON com status da API
 */
router.get("/", (req, res) => {
  res.json({ status: "API funcionando" });
});

// Exporta a função Firebase para ser chamada via HTTPS
export const app = functions.https.onRequest(router);
