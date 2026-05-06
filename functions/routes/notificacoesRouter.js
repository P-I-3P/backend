// Importações necessárias
import express from "express";
import { notificarAdminsUpload } from "../controllers/notificacoesController.js";

// Criação do router para rotas de notificações
const router = express.Router();

<<<<<<< Updated upstream
// Rota POST /notificacoes/upload-certificado - Notifica admins sobre upload de certificado (sem autenticação)
=======
/**
 * Rota para serviços de mensageria e notificações push.
 * Utilizada para alertar administradores sobre novas interações de alunos
 * via Firebase Cloud Messaging (FCM).
 */
>>>>>>> Stashed changes
router.post("/upload-certificado", notificarAdminsUpload);

// Exporta o router
export default router;
