import express from "express";
import { requireSuperAdmin } from "../middlewares/authMiddleware.js";
import { listarCursos, buscarCurso, criarCurso, atualizarCurso, deletarCurso } from "../controllers/cursosController.js";

const router = express.Router();

/**
 * Rotas para gerenciamento de cursos.
 * Acesso restrito a Super Administradores.
 */
// Retorna a lista de todos os cursos oferecidos pela instituição
router.get("/", ...requireSuperAdmin, listarCursos);
// Busca as informações detalhadas de um curso através do seu ID único
router.get("/:id", ...requireSuperAdmin, buscarCurso);
// Cria um novo curso no catálogo do sistema
router.post("/", ...requireSuperAdmin, criarCurso);
// Atualiza informações de um curso (ex: carga horária ou nome)
router.put("/:id", ...requireSuperAdmin, atualizarCurso);
// Remove um curso do sistema (Cuidado: pode afetar turmas vinculadas)
router.delete("/:id", ...requireSuperAdmin, deletarCurso);

export default router;
