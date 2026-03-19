import express from "express";
import { loginSession, loginSuperAdmin } from "../controllers/authController.js";

const router = express.Router();

// Rota para criar o cookie de sessão (troca ID Token por Session Cookie)
// Endpoint: POST /auth/session-login
router.post("/session-login", loginSession);

// Rota exclusiva para login do Super Admin (Retorna Token ID)
// Endpoint: POST /auth/super-admin-login
// Restrição: Aceita apenas o email configurado como SUPER_ADMIN
router.post("/super-admin-login", loginSuperAdmin);

export default router;