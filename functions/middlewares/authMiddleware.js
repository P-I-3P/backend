import { auth_firebase } from "../config/firebase.js";

/**
<<<<<<< Updated upstream
 * Middleware para verificar autenticação via Firebase ID Token
 * Extrai o token do cabeçalho Authorization e valida com Firebase Auth
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função para passar para o próximo middleware
 * @returns {void} Chama next() se autenticado, ou retorna erro 401
=======
 * Middleware para validar o token de autenticação (JWT) enviado pelo Firebase.
 * Extrai o token do header 'Authorization', verifica sua validade e anexa os dados do usuário à requisição.
 * 
 * @param {Object} req - Objeto de requisição do Express.
 * @param {Object} res - Objeto de resposta do Express.
 * @param {Function} next - Função para passar o controle para o próximo middleware.
>>>>>>> Stashed changes
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    let decoded;

<<<<<<< Updated upstream
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
=======
    if (!token) return res.status(401).json({ error: "Token ausente" });

    // Verifica o token usando o Firebase Admin SDK
    const decoded = await auth_firebase.verifyIdToken(token);
>>>>>>> Stashed changes

    // Preenche req.user com as informações decodificadas do token (incluindo Custom Claims)
    req.user = {
      uid: decoded.uid,
      role: decoded.role || "aluno", // Fallback para "aluno" caso a role não esteja definida
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
    return res.status(401).json({ error: "Token inválido ou expirado", details: String(e) });
  }
}

/**
<<<<<<< Updated upstream
 * Middleware de ordem superior para verificar se o usuário tem uma das roles permitidas
 * @param {...string} allowedRoles - Roles permitidas para acessar a rota
 * @returns {Function} Middleware que verifica a role do usuário
=======
 * Middleware de autorização baseado em papéis (RBAC).
 * Verifica se a role do usuário (definida no requireAuth) está presente na lista de permissões.
 * 
 * @param {...string} allowedRoles - Papéis permitidos para acessar a rota.
>>>>>>> Stashed changes
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
