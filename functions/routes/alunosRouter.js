// Importações necessárias
import express from "express";
import { listarAlunos, criarAluno } from "../controllers/alunosController.js";
import { requireSuperAdmin } from "../middlewares/authMiddleware.js";

// Criação do router para rotas de alunos
const router = express.Router();

// Rota GET /alunos - Lista alunos, opcionalmente filtrados por curso (requer superAdmin)
router.get("/", ...requireSuperAdmin, listarAlunos);
// Rota POST /alunos - Cria um novo aluno (requer superAdmin)
router.post("/", ...requireSuperAdmin, criarAluno);

// Exporta o router
export default router;
