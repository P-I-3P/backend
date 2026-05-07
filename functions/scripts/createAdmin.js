import readline from "readline";
import { auth_firebase, db } from "../config/firebase.js";

// Configuração da interface de leitura para interação via terminal (CLI)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Transforma a função question do readline em uma Promise para permitir o uso de async/await.
 * @param {string} pergunta - O texto que será exibido no terminal.
 * @returns {Promise<string>} A resposta digitada pelo usuário.
 */
function perguntar(pergunta) {
  return new Promise((resolve) => {
    rl.question(pergunta, (resposta) => resolve(resposta));
  });
}

/**
 * Script utilitário para criar um usuário Administrador manualmente.
 * Fluxo: Captura dados -> Cria no Auth -> Define Custom Claims -> Salva no Firestore.
 */
async function criarAdmin() {
  try {
    // Coleta de dados via terminal
    const nome = await perguntar("Nome do admin: ");
    const email = await perguntar("Email: ");
    const senha = await perguntar("Senha: ");

    // 1. Cria o registro de identidade no Firebase Authentication
    const user = await auth_firebase.createUser({
      email,
      password: senha,
      displayName: nome,
    });

    // 2. Define o papel (role) no Token JWT via Custom Claims para segurança de rotas
    await auth_firebase.setCustomUserClaims(user.uid, {
      role: "admin",
    });

    // 3. Persiste o perfil do usuário no banco de dados Firestore
    await db.collection("users").doc(user.uid).set({
      nome,
      email,
      role: "admin",
      createdAt: Date.now(),
    });

    console.log("\n✅ Admin criado com sucesso!");
    console.log("UID:", user.uid);

    rl.close();
  } catch (error) {
    console.error("\nErro:", error.message);
    rl.close();
  }
}

criarAdmin();