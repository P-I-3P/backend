// Importações necessárias
import express from "express";
import { notificarAdminsUpload } from "../controllers/notificacoesController.js";

// Criação do router para rotas de notificações
const router = express.Router();

// Rota POST /notificacoes/upload-certificado - Notifica admins sobre upload de certificado (sem autenticação)
router.post("/upload-certificado", notificarAdminsUpload);

// Exporta o router
export default router;
