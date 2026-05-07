import admin from "firebase-admin";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Utilitários para obter o caminho do diretório atual usando módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega as variáveis de ambiente a partir do arquivo .env localizado na raiz das funções
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Carrega a conta de serviço do Google Cloud a partir de uma variável de ambiente codificada em Base64.
 * Esta abordagem é mais segura e flexível para ambientes de CI/CD e Cloud Functions do que
 * manter um arquivo JSON físico no servidor.
 * 
 * @returns {Object} O objeto da conta de serviço decodificado.
 * @throws {Error} Se a variável GOOGLE_SERVICE_ACCOUNT_B64 estiver ausente ou o JSON for inválido.
 */
function loadServiceAccountFromEnv() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error("GOOGLE_SERVICE_ACCOUNT_B64 ausente no .env");

  // Decodifica a string Base64 para UTF-8 e converte para objeto JSON
  const jsonStr = Buffer.from(b64, "base64").toString("utf8");
  const serviceAccount = JSON.parse(jsonStr);

  if (!serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error("Service account inválido");
  }

  return serviceAccount;
}

const serviceAccount = loadServiceAccountFromEnv();

// Inicializa o Admin SDK apenas se ainda não houver apps inicializados
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.APP_STORAGE_BUCKET,
  });
}

// Instância do Firestore para operações de banco de dados NoSQL
const db = admin.firestore();
// Instância do Auth para gerenciamento de usuários e tokens JWT
const auth_firebase = admin.auth();
// Instância do Cloud Storage para manipulação de arquivos (uploads/downloads)
const bucket = admin.storage().bucket();

// Exporta os serviços para serem utilizados em controladores e middlewares
export { admin, db, auth_firebase, bucket };