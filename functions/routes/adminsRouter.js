// Importações necessárias
import express from "express";
import { requireSuperAdmin } from "../middlewares/authMiddleware.js";
import { listarAdmins, criarAdmin, atualizarAdmin, deletarAdmin } from "../controllers/adminsController.js";

// Criação do router para rotas de admins
const router = express.Router();

// Rota GET /admins - Lista todos os admins (requer superAdmin)
router.get("/", ...requireSuperAdmin, listarAdmins);
// Rota POST /admins - Cria um novo admin (requer superAdmin)
router.post("/", ...requireSuperAdmin, criarAdmin);
// Rota PUT /admins/:id - Atualiza um admin específico (requer superAdmin)
router.put("/:id", ...requireSuperAdmin, atualizarAdmin);
// Rota DELETE /admins/:id - Deleta um admin específico (requer superAdmin)
router.delete("/:id", ...requireSuperAdmin, deletarAdmin);

// Exporta o router
export default router;
