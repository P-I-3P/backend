import readline from "readline";
import { auth_firebase, db } from "../config/firebase.js";

// Setup da interface CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Helper para input de dados.
 */
function perguntar(pergunta) {
  return new Promise((resolve) => {
    rl.question(pergunta, (resposta) => resolve(resposta));
  });
}

/**
 * Script de alto privilégio para criar o primeiro Super Admin do sistema.
 * O Super Admin tem permissão para gerenciar Cursos, Turmas e outros Admins.
 */
async function criarSuperAdmin() {
  try {
    const nome = await perguntar("Nome do superAdmin: ");
    const email = await perguntar("Email: ");
    const senha = await perguntar("Senha: ");

    // Criação no provedor de identidade
    const user = await auth_firebase.createUser({
      email,
      password: senha,
      displayName: nome,
    });

    // Atribuição da role de maior nível do sistema
    await auth_firebase.setCustomUserClaims(user.uid, {
      role: "superAdmin",
    });

    // Registro no banco de dados para listagens e perfis
    await db.collection("users").doc(user.uid).set({
      nome,
      email,
      role: "superAdmin",
      createdAt: Date.now(),
    });

    console.log("\n✅ SuperAdmin criado com sucesso!");
    console.log("UID:", user.uid);

    rl.close();
  } catch (error) {
    console.error("\nErro:", error.message);
    rl.close();
  }
}

criarSuperAdmin();
