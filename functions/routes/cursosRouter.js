// Importações necessárias
import express from "express";
import { requireSuperAdmin } from "../middlewares/authMiddleware.js";
import { listarCursos, buscarCurso, criarCurso, atualizarCurso, deletarCurso } from "../controllers/cursosController.js";

// Criação do router para rotas de cursos
const router = express.Router();

// Rota GET /cursos - Lista todos os cursos (requer superAdmin)
router.get("/", ...requireSuperAdmin, listarCursos);
// Rota GET /cursos/:id - Busca um curso específico (requer superAdmin)
router.get("/:id", ...requireSuperAdmin, buscarCurso);
// Rota POST /cursos - Cria um novo curso (requer superAdmin)
router.post("/", ...requireSuperAdmin, criarCurso);
// Rota PUT /cursos/:id - Atualiza um curso específico (requer superAdmin)
router.put("/:id", ...requireSuperAdmin, atualizarCurso);
// Rota DELETE /cursos/:id - Deleta um curso específico (requer superAdmin)
router.delete("/:id", ...requireSuperAdmin, deletarCurso);

// Exporta o router
export default router;
