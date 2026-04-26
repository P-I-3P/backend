import express from "express";
import { notificarAdminsUpload } from "../controllers/notificacoesController.js";
import { requireAluno } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/upload-certificado", requireAluno, notificarAdminsUpload);

export default router;
