import admin from "firebase-admin";
import dotenv from "dotenv";
import { GoogleAuth } from "google-auth-library";
import { google } from "googleapis";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// carrega functions/.env
dotenv.config({ path: join(__dirname, "..", ".env") });

function loadServiceAccountFromEnv() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error("GOOGLE_SERVICE_ACCOUNT_B64 ausente no .env");

  const jsonStr = Buffer.from(b64, "base64").toString("utf8");
  const serviceAccount = JSON.parse(jsonStr);

  // validações mínimas
  if (!serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error("Service account inválido (sem private_key/client_email)");
  }

  return serviceAccount;
}

const serviceAccount = loadServiceAccountFromEnv();

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Erro ao inicializar o Firebase Admin:", error);
    throw new Error("Falha na inicialização do Firebase Admin SDK");
  }
}

const db = admin.firestore();
const auth_firebase = admin.auth();


/*
const auth = new GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

const sheets = google.sheets({ version: "v4", auth });
const drive = google.drive({ version: "v3", auth });

*/

export { admin, db, auth_firebase };