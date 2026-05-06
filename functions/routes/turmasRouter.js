// Importações necessárias
import express from "express";
import { requireSuperAdmin } from "../middlewares/authMiddleware.js";
import { listarTurmas, buscarTurma, criarTurma, atualizarTurma, deletarTurma } from "../controllers/turmasController.js";

// Criação do router para rotas de turmas
const router = express.Router();

<<<<<<< Updated upstream
// Rota GET /turmas - Lista turmas, opcionalmente filtradas por curso (requer superAdmin)
router.get("/", ...requireSuperAdmin, listarTurmas);
// Rota GET /turmas/:id - Busca uma turma específica (requer superAdmin)
router.get("/:id", ...requireSuperAdmin, buscarTurma);
// Rota POST /turmas - Cria uma nova turma (requer superAdmin)
router.post("/", ...requireSuperAdmin, criarTurma);
// Rota PUT /turmas/:id - Atualiza uma turma específica (requer superAdmin)
router.put("/:id", ...requireSuperAdmin, atualizarTurma);
// Rota DELETE /turmas/:id - Deleta uma turma específica (requer superAdmin)
=======
/**
 * Rotas para organização de turmas dentro dos cursos.
 * Operações restritas a Super Admins.
 */

// Lista turmas, opcionalmente filtradas por cursoId
router.get("/", ...requireSuperAdmin, listarTurmas);
// Obtém dados detalhados de uma turma específica
router.get("/:id", ...requireSuperAdmin, buscarTurma);
// Cria uma nova turma associada a um curso e período letivo
router.post("/", ...requireSuperAdmin, criarTurma);
// Edita dados da turma (horário, período, nome)
router.put("/:id", ...requireSuperAdmin, atualizarTurma);
// Exclui a turma do banco de dados
>>>>>>> Stashed changes
router.delete("/:id", ...requireSuperAdmin, deletarTurma);

// Exporta o router
export default router;
