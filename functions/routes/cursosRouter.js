import express from "express";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";
import {
  criarCurso,
  listarCursos,
  obterCurso,
  atualizarCurso,
  deletarCurso,
} from "../controllers/cursosController.js";

const router = express.Router();

// leitura: qualquer autenticado
router.get("/", requireAuth, listarCursos);
router.get("/:id", requireAuth, obterCurso);

// escrita: só admin
router.post("/criar", ...requireAdmin, criarCurso);
router.patch("/editar:id", ...requireAdmin, atualizarCurso);
router.delete("/delete:id", ...requireAdmin, deletarCurso);

export default router;