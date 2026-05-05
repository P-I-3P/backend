// Importações necessárias
import express from "express";
import { requireSuperAdmin } from "../middlewares/authMiddleware.js";
import { listarTurmas, buscarTurma, criarTurma, atualizarTurma, deletarTurma } from "../controllers/turmasController.js";

// Criação do router para rotas de turmas
const router = express.Router();

// Rota GET /turmas - Lista turmas, opcionalmente filtradas por curso (requer superAdmin)
router.get("/", ...requireSuperAdmin, listarTurmas);
// Rota GET /turmas/:id - Busca uma turma específica (requer superAdmin)
router.get("/:id", ...requireSuperAdmin, buscarTurma);
// Rota POST /turmas - Cria uma nova turma (requer superAdmin)
router.post("/", ...requireSuperAdmin, criarTurma);
// Rota PUT /turmas/:id - Atualiza uma turma específica (requer superAdmin)
router.put("/:id", ...requireSuperAdmin, atualizarTurma);
// Rota DELETE /turmas/:id - Deleta uma turma específica (requer superAdmin)
router.delete("/:id", ...requireSuperAdmin, deletarTurma);

// Exporta o router
export default router;
