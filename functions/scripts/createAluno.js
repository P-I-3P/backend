import readline from "readline";
import { auth_firebase, db } from "../config/firebase.js";

// Interface para captura de inputs no console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Auxiliar para capturar entrada de texto de forma assíncrona.
 */
function perguntar(pergunta) {
  return new Promise((resolve) => {
    rl.question(pergunta, (resposta) => resolve(resposta));
  });
}

/**
 * Script utilitário para criação manual de Alunos.
 * Inclui lógica de rollback (estorno) para manter a integridade entre Auth e Firestore.
 */
async function criarAluno() {
  try {
    const nome = await perguntar("Nome do aluno: ");
    const email = await perguntar("Email: ");
    const senha = await perguntar("Senha: ");

    // 1. Tenta criar o usuário no Firebase Auth
    const user = await auth_firebase.createUser({
      email,
      password: senha,
      displayName: nome,
    });

    try {
      // 2. Define o papel de 'aluno' no token de acesso
      await auth_firebase.setCustomUserClaims(user.uid, {
        role: "aluno",
      });

      // 3. Tenta salvar o documento do perfil no Firestore
      await db.collection("users").doc(user.uid).set({
        nome,
        email,
        role: "aluno",
        createdAt: Date.now(),
      });

      console.log("\n✅ Aluno criado com sucesso!");
      console.log("UID:", user.uid);

    } catch (firestoreError) {
      // Lógica de Integridade: Se o banco de dados falhar, removemos o usuário do Auth
      await auth_firebase.deleteUser(user.uid);

      console.error("\nErro Firestore:", firestoreError.message);
    }

    rl.close();

  } catch (error) {
    console.error("\nErro Auth:", error.message);
    rl.close();
  }
}

criarAluno();