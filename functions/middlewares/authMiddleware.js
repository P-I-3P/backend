import { auth_firebase } from "../config/firebase.js";

/**
 * Middleware para verificar autenticação via Firebase ID Token
 * Extrai o token do cabeçalho Authorization e valida com Firebase Auth
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função para passar para o próximo middleware
 * @returns {void} Chama next() se autenticado, ou retorna erro 401
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    let decoded;

    if (authHeader.startsWith("Bearer ")) {
      // Fluxo 1: Token enviado no Header (Vida útil: 1 hora)
      const token = authHeader.slice(7);
      decoded = await auth_firebase.verifyIdToken(token);
    } else if (req.cookies && req.cookies.session) {
      // Fluxo 2: Cookie de Sessão (Vida útil: até 14 dias)
      // checkRevoked: true garante que se a conta for desativada, a sessão cai
      const sessionCookie = req.cookies.session;
      decoded = await auth_firebase.verifySessionCookie(sessionCookie, true);
    } else {
      return res.status(401).json({ error: "Token ou Cookie de sessão ausente" });
    }

    req.user = {
      uid: decoded.uid,
      role: decoded.role || "aluno",
      email: decoded.email,
    };

    // Regra de Negócio: Alunos só podem acessar com e-mail institucional
    if (req.user.role === "aluno") {
      const email = req.user.email || "";
      if (!email.endsWith("@edu.pe.senac.br")) {
        return res.status(403).json({ error: "Acesso negado. Alunos devem usar e-mail institucional (@edu.pe.senac.br)" });
      }
    }

    return next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido", details: String(e) });
  }
}

/**
 * Middleware de ordem superior para verificar se o usuário tem uma das roles permitidas
 * @param {...string} allowedRoles - Roles permitidas para acessar a rota
 * @returns {Function} Middleware que verifica a role do usuário
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Não autenticado" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Sem permissão" });
    }
    return next();
  };
}

// Middleware composto para exigir autenticação e role de admin ou superAdmin
export const requireAdmin = [requireAuth, requireRole("admin", "superAdmin")];
// Middleware composto para exigir autenticação e role de superAdmin
export const requireSuperAdmin = [requireAuth, requireRole("superAdmin")];
// Middleware composto para exigir autenticação e role de aluno
export const requireAluno = [requireAuth, requireRole("aluno")];
