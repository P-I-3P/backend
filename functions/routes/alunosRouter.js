import express from "express";
import { listarAlunos, criarAluno } from "../controllers/alunosController.js";
import { requireSuperAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * Rotas para gerenciamento de alunos.
 * Permite listagem e criação de perfis acadêmicos por Super Admins.
 */
// Rota para listar alunos (aceita 'cursoId' como query parameter para filtragem)
router.get("/", ...requireSuperAdmin, listarAlunos);
// Rota para cadastrar um novo aluno, vinculando-o a um curso e turma específicos
router.post("/", ...requireSuperAdmin, criarAluno);

export default router;
