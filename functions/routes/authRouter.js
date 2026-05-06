import express from "express";
import { loginAdmin, loginAluno, loginSuperAdmin } from "../controllers/authController.js";

const router = express.Router();

router.post("/login/admin", loginAdmin);
router.post("/login/super-admin", loginSuperAdmin);
router.post("/login/aluno", loginAluno);

export default router;
