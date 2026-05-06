// Importações necessárias
import express from "express";
import { listarAlunos, criarAluno } from "../controllers/alunosController.js";
import { requireSuperAdmin } from "../middlewares/authMiddleware.js";

// Criação do router para rotas de alunos
const router = express.Router();

<<<<<<< Updated upstream
// Rota GET /alunos - Lista alunos, opcionalmente filtrados por curso (requer superAdmin)
router.get("/", ...requireSuperAdmin, listarAlunos);
// Rota POST /alunos - Cria um novo aluno (requer superAdmin)
=======
/**
 * Rotas para gerenciamento de alunos.
 * Restrito ao uso por Super Admins para controle de acesso acadêmico.
 */

// Lista alunos, permitindo filtrar por curso via query parameter (?cursoId=...)
router.get("/", ...requireSuperAdmin, listarAlunos);
// Cadastra um aluno, vincula ao curso/turma e envia credenciais por e-mail
>>>>>>> Stashed changes
router.post("/", ...requireSuperAdmin, criarAluno);

// Exporta o router
export default router;
