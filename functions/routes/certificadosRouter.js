// Importações necessárias
import { Router } from "express";
import multer from "multer";
import { 
  enviarCertificado, 
  listarMeusCertificados, 
  aprovarCertificado, 
  rejeitarCertificado, 
  listarCertificadosPendentes, 
  validarCertificadoPublicamente 
} from "../controllers/certificadoController.js"; // Atenção: nome do arquivo corrigido para singular se necessário, ou ajuste conforme seu arquivo real
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";

// Criação do router para rotas de certificados
const router = Router();

<<<<<<< Updated upstream
<<<<<<< Updated upstream
// Configuração do Multer para upload em memória (necessário para Firebase Functions)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
});
=======
/**
 * Rota de processamento de certificados.
 * Acionada após o upload do arquivo para realizar scan de vírus/segurança,
 * validar cabeçalhos PDF e mover para o armazenamento definitivo.
 */
router.post("/processar", processarCertificado);
>>>>>>> Stashed changes

// Rotas do Aluno
// Upload do PDF (campo do form-data deve ser 'pdf')
router.post("/enviar", requireAuth, upload.single('pdf'), enviarCertificado);
router.get("/meus-certificados", requireAuth, listarMeusCertificados);

// Rotas do Coordenador/Admin
router.get("/pendentes", ...requireAdmin, listarCertificadosPendentes);
router.patch("/:docId/aprovar", ...requireAdmin, aprovarCertificado);
router.patch("/:docId/rejeitar", ...requireAdmin, rejeitarCertificado);

// Rota Pública (Validação por terceiros)
// Não requer autenticação
router.get("/validar/:codigo", validarCertificadoPublicamente);
=======
// Rota POST /certificados/processar - Processa e valida certificado PDF enviado (sem autenticação)
router.post("/processar", processarCertificado);
>>>>>>> Stashed changes

// Exporta o router
export default router;