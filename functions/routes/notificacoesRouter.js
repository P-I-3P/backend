import express from "express";
import { notificarAdminsUpload } from "../controllers/notificacoesController.js";

const router = express.Router();

/**
 * Rotas para serviços de notificação do sistema.
 */

// Rota utilizada para disparar notificações Push (FCM) para os administradores
// quando um aluno realiza o envio de um novo documento
router.post("/upload-certificado", notificarAdminsUpload);

export default router;
