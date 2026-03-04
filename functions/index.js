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
import cursosRoutes from "./routes/cursosRouter.js";
import disciplinasRoutes from "./routes/disciplinasRouter.js";


import * as functions from "firebase-functions";

const router = express();

router.use(express.json());

// rotas
router.use("/alunos", alunosRoutes);
router.use("/cursos", cursosRoutes);
router.use("/cursos/:cursoId/disciplinas", disciplinasRoutes);



router.get("/", (req, res) => {
  res.json({ status: "API funcionando" });
});



export const app = functions.https.onRequest(router);