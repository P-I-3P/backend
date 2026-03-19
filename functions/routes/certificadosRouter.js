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

const router = Router();

// Configuração do Multer para upload em memória (necessário para Firebase Functions)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
});

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

export default router;