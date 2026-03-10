import express from "express";
import alunosRoutes from "./routes/alunosRouter.js";
import * as functions from "firebase-functions";

const router = express();
router.use(express.json());

// rotas
router.use("/alunos", alunosRoutes);


router.get("/", (req, res) => {
  res.json({ status: "API funcionando" });
});



export const app = functions.https.onRequest(router);