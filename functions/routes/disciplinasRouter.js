import express from "express";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";
import {
  criarDisciplina,
  listarDisciplinas,
  obterDisciplina,
  atualizarDisciplina,
  deletarDisciplina,
} from "../controllers/disciplinasController.js";

const router = express.Router({ mergeParams: true });

// leitura: autenticado
router.get("/", requireAuth, listarDisciplinas);
router.get("/:id", requireAuth, obterDisciplina);

// escrita: admin
router.post("/", ...requireAdmin, criarDisciplina);
router.patch("/:id", ...requireAdmin, atualizarDisciplina);
router.delete("/:id", ...requireAdmin, deletarDisciplina);

export default router;