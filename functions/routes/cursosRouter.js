import express from "express";
import { listarCursos, buscarCurso, criarCurso, atualizarCurso, deletarCurso } from "../controllers/cursosController.js";

const router = express.Router();

router.get("/", listarCursos);
router.get("/:id", buscarCurso);
router.post("/", criarCurso);
router.put("/:id", atualizarCurso);
router.delete("/:id", deletarCurso);

export default router;
