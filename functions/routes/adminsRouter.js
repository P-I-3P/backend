// Importações necessárias
import express from "express";
import { requireSuperAdmin } from "../middlewares/authMiddleware.js";
import { listarAdmins, criarAdmin, atualizarAdmin, deletarAdmin } from "../controllers/adminsController.js";

// Criação do router para rotas de admins
const router = express.Router();

<<<<<<< Updated upstream
// Rota GET /admins - Lista todos os admins (requer superAdmin)
router.get("/", ...requireSuperAdmin, listarAdmins);
// Rota POST /admins - Cria um novo admin (requer superAdmin)
router.post("/", ...requireSuperAdmin, criarAdmin);
// Rota PUT /admins/:id - Atualiza um admin específico (requer superAdmin)
router.put("/:id", ...requireSuperAdmin, atualizarAdmin);
// Rota DELETE /admins/:id - Deleta um admin específico (requer superAdmin)
=======
/**
 * Rotas para gerenciamento de administradores.
 * Todas as operações aqui exigem privilégios de Super Admin.
 */

// Lista todos os usuários com papel (role) "admin"
router.get("/", ...requireSuperAdmin, listarAdmins);
// Cria um novo admin, gera senha temporária e envia e-mail de boas-vindas
router.post("/", ...requireSuperAdmin, criarAdmin);
// Atualiza dados (nome/e-mail) de um admin existente
router.put("/:id", ...requireSuperAdmin, atualizarAdmin);
// Remove o admin do Firestore e do Firebase Auth
>>>>>>> Stashed changes
router.delete("/:id", ...requireSuperAdmin, deletarAdmin);

// Exporta o router
export default router;
