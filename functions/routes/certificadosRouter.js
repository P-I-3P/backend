import { Router } from "express";
import { processarCertificado } from "../controllers/certificadosController.js";

const router = Router();

/**
 * Rotas relacionadas ao processamento de certificados enviados.
 */

// Rota que aciona a lógica de análise de segurança (PDF Scanner) e validação de arquivos
// Geralmente chamada após o upload bem-sucedido para o Storage temporário
router.post("/processar", processarCertificado);

export default router;