import express from "express";
import alunosRoutes from "./routes/alunosRouter.js";
import * as functions from "firebase-functions";
import notificacoesRoutes from "./routes/notificacoesRouter.js";
import cursosRoutes from "./routes/cursosRouter.js";
import authRoutes from "./routes/authRouter.js";
import certificadosRoutes from "./routes/certificadosRouter.js";
import cors from "cors";
import cookieParser from "cookie-parser"; 



const router = express();

// Habilita parseamento de cookies para ler o cookie 'session'
router.use(cookieParser()); 
router.use(express.json());

// 'credentials: true' é obrigatório para permitir que o navegador envie/receba cookies em requisições CORS
router.use(cors({ origin: true, credentials: true })); 


// rotas
router.use("/auth", authRoutes); // Rotas de autenticação (Login de sessão)
router.use("/alunos", alunosRoutes);
router.use("/notificacoes", notificacoesRoutes);
router.use("/cursos", cursosRoutes);
router.use("/certificados", certificadosRoutes);




router.get("/", (req, res) => {
  res.json({ status: "API funcionando" });
});



export const app = functions.https.onRequest(router);