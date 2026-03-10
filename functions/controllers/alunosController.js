import { auth_firebase, db } from "../config/firebase.js";

export async function criarAluno(req, res) {
  try {
    const { nome, email, password } = req.body;

    if (!nome || !email || !password) {
      return res.status(400).json({
        error: "nome, email e password são obrigatórios",
      });
    }

    // 1. cria no Firebase Auth
    const user = await auth_firebase.createUser({
      email,
      password,
      displayName: nome,
    });

    try {
      // 2. define role
      await auth_firebase.setCustomUserClaims(user.uid, {
        role: "aluno",
      });

      // 3. salva no Firestore
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

    } catch (firestoreError) {
      // rollback: remove do auth se falhar no firestore
      await auth_firebase.deleteUser(user.uid);

      console.error("Erro Firestore:", firestoreError);

      return res.status(500).json({
        error: "Usuário criado no Auth, mas falhou no Firestore. Rollback executado.",
      });
    }

  } catch (e) {
    console.error("Erro Auth:", e);

    return res.status(500).json({
      error: "Erro ao criar aluno",
    });
  }
}


