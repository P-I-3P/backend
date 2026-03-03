/*
// routes.js
import express from "express";
import { requireAuth, requireAdmin, requireAluno } from "./middlewares/authMiddleware.js";
import { setUserRole } from "./controllers/roleController.js";

const router = express.Router();

// rota pública
router.get("/health", (req, res) => res.json({ ok: true }));

// qualquer usuário logado
router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));

// só admin
router.post("/admin/set-role", ...requireAdmin, setUserRole);
router.get("/admin/dashboard", ...requireAdmin, (req, res) => res.json({ ok: true }));

// só aluno
router.get("/aluno/minhas-coisas", ...requireAluno, (req, res) => res.json({ ok: true, uid: req.user.uid }));
*/
import express from "express";
import alunosRoutes from "./routes/alunosRouter.js";

const router = express();

router.use(express.json());

// rotas
router.use("/alunos", alunosRoutes);

router.get("/", (req, res) => {
  res.json({ status: "API funcionando" });
});



export const app = functions.https.onRequest(router);