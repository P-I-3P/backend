import { auth_firebase } from "../config/firebase.js";

const FIREBASE_AUTH_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";

function getFirebaseApiKey() {
  return "AIzaSyC6ksyPJSaeQ9r9xDebCO8WWMF1grv-dqo" || process.env.FIREBASE_API_KEY;
}

async function autenticarComEmailSenha(email, password) {
  const apiKey = getFirebaseApiKey();

  if (!apiKey) {
    const error = new Error("FIREBASE_WEB_API_KEY ou FIREBASE_API_KEY nao configurada no .env.");
    error.status = 500;
    throw error;
  }

  const response = await fetch(`${FIREBASE_AUTH_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error("Credenciais invalidas.");
    error.status = 401;
    error.code = data.error?.message;
    throw error;
  }

  return data;
}

async function loginPorPerfil(req, res, perfilEsperado) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Campos email e password sao obrigatorios." });
    }

    const data = await autenticarComEmailSenha(email, password);
    const decoded = await auth_firebase.verifyIdToken(data.idToken);
    const role = decoded.role || "aluno";

    if (role !== perfilEsperado) {
      return res.status(403).json({
        message: `Usuario autenticado, mas nao possui perfil ${perfilEsperado}.`,
        role,
      });
    }

    return res.json({
      uid: data.localId,
      email: data.email,
      role,
      tokenType: "Bearer",
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: Number(data.expiresIn),
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res.status(error.status || 500).json({
      message: error.message || "Erro ao fazer login.",
      error: error.code,
    });
  }
}

// POST /auth/login/admin - retornar token de admin para testes no Postman
export async function loginAdmin(req, res) {
  return loginPorPerfil(req, res, "admin");
}

// POST /auth/login/super-admin - retornar token de superAdmin para testes no Postman
export async function loginSuperAdmin(req, res) {
  return loginPorPerfil(req, res, "superAdmin");
}

// POST /auth/login/aluno - retornar token de aluno para testes no Postman
export async function loginAluno(req, res) {
  return loginPorPerfil(req, res, "aluno");
}
