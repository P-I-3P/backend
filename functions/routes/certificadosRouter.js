import express from "express";
import multer from "multer";
import {
  enviarCertificado,
  listarMeusCertificados,
  aprovarCertificado,
  rejeitarCertificado,
  listarCertificadosPendentes,
  validarCertificadoPublicamente,
} from "../controllers/certificadoController.js";
import { requireAuth, requireAluno, requireAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Configurar multer para upload de PDF em memória
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Rotas do Aluno
router.post(
  "/enviar",
  requireAuth,
  requireAluno,
  upload.single('pdf'),
  enviarCertificado
);

router.get(
  "/meus-certificados",
  requireAuth,
  requireAluno,
  listarMeusCertificados
);

// Rotas do Coordenador/Admin
router.get(
  "/pendentes",
  requireAuth,
  requireAdmin,
  listarCertificadosPendentes
);

router.patch(
  "/:docId/aprovar",
  requireAuth,
  requireAdmin,
  aprovarCertificado
);

router.patch(
  "/:docId/rejeitar",
  requireAuth,
  requireAdmin,
  rejeitarCertificado
);

// Rota pública (sem autenticação)
router.get(
  "/validar/:codigo",
  validarCertificadoPublicamente
);

export default router;
