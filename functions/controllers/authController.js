import { auth_firebase } from "../config/firebase.js";

/**
 * Controller para gerenciamento de sessões de longa duração.
 * 
 * Objetivo: Permitir que administradores permaneçam logados por até 14 dias,
 * contornando o limite padrão de 1 hora dos ID Tokens do Firebase.
 */
export async function loginSession(req, res) {
  // O cliente (frontend) envia o ID Token de 1 hora que acabou de receber do login
  const { idToken } = req.body;

  // LIMITE DO FIREBASE: O máximo permitido é 14 dias (em milissegundos).
 
  const expiresIn = 60 * 60 * 24 * 14 * 1000; 

  try {
    // Cria o cookie de sessão usando o SDK Admin do Firebase
    const sessionCookie = await auth_firebase.createSessionCookie(idToken, { expiresIn });

    // Configurações do cookie para o navegador
    const options = { 
      maxAge: expiresIn, 
      httpOnly: true, // Impede acesso via JS no cliente (segurança contra XSS)
      secure: process.env.NODE_ENV === 'production' // Apenas HTTPS em produção
    };

    // Define o cookie 'session' na resposta
    res.cookie('session', sessionCookie, options);
    res.json({ status: 'success', message: 'Sessão de administrador iniciada (validade: 14 dias)' });
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    res.status(401).json({ error: "Falha na autenticação ou token inválido" });
  }
}

/**
 * Login exclusivo para Super Admin via Backend.
 * 
 * Permite obter um token Bearer passando email e senha diretamente.
 * RESTRIÇÃO: Aceita apenas um email específico para segurança.
 */
export async function loginSuperAdmin(req, res) {
  const { email, password } = req.body;
  const apiKey = process.env.FIREBASE_API_KEY;

  // CONFIGURAÇÃO DE SEGURANÇA:
  // Define o único e-mail autorizado a usar esta rota.
  // Em produção, mova isso para process.env.SUPER_ADMIN_EMAIL
  const SUPER_ADMIN_EMAIL = "joaovictortwrp@gmail.com"; // E-mail do Super Admin atualizado.

  // 1. Verificação de Segurança "Apenas Ele"
  if (email !== SUPER_ADMIN_EMAIL) {
    return res.status(403).json({ 
      error: "Acesso Negado", 
      message: "Esta rota é restrita exclusivamente ao Super Admin." 
    });
  }

  if (!apiKey) {
    return res.status(500).json({ error: "Configuração de servidor inválida (API Key ausente)" });
  }

  try {
    // 2. Chamada à API REST do Firebase para autenticação com senha
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Erro de autenticação no Firebase");
    }

    // 3. Retorna o Token ID (para usar no Header Authorization)
    res.json({
      status: 'success',
      message: 'Super Admin autenticado',
      idToken: data.idToken,      // Use este token nas requisições Bearer
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      email: data.email
    });

  } catch (error) {
    console.error("Erro login Super Admin:", error.message);
    res.status(401).json({ error: "Credenciais inválidas ou erro interno" });
  }
}