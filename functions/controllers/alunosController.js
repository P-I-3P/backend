import { auth_firebase, db } from "../config/firebase.js";

export async function criarAluno(req, res) {
  try {
    const { nome, email, password } = req.body;

    if (!nome || !email || !password) {
      return res.status(400).json({
        error: "nome, email e password são obrigatórios",
      });
    }

    // cria usuário no Firebase Auth
    const user = await auth_firebase.createUser({
      email,
      password,
      displayName: nome,
    });

    // define role aluno
    await auth_firebase.setCustomUserClaims(user.uid, {
      role: "aluno",
    });

    // salva no firestore
    await db.collection("users").doc(user.uid).set({
      nome,
      email,
      role: "aluno",
      createdAt: Date.now(),
      createdBy: req.user.uid,
    });

    return res.status(201).json({
      ok: true,
      uid: user.uid,
      role: "aluno",
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      error: "Erro ao criar aluno",
    });
  }
}