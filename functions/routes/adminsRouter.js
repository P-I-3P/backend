import express from "express";
import { requireSuperAdmin } from "../middlewares/authMiddleware.js";
import { listarAdmins, criarAdmin, atualizarAdmin, deletarAdmin } from "../controllers/adminsController.js";

const router = express.Router();

/**
 * Agrupamento de rotas para gerenciamento de administradores.
 * Protegidas para uso exclusivo do Super Admin.
 */
// Rota para listar todos os administradores cadastrados no sistema
router.get("/", ...requireSuperAdmin, listarAdmins);
// Rota para criar um novo administrador, definindo permissões e enviando e-mail de acesso
router.post("/", ...requireSuperAdmin, criarAdmin);
// Rota para atualizar os dados de perfil (nome/email) de um administrador existente
router.put("/:id", ...requireSuperAdmin, atualizarAdmin);
// Rota para remover permanentemente um administrador do Auth e do Banco de Dados
router.delete("/:id", ...requireSuperAdmin, deletarAdmin);

export default router;
