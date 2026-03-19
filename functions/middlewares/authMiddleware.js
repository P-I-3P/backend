import { auth_firebase } from "../config/firebase.js";

/**
 * Middleware de Autenticação Híbrido.
 * Suporta dois métodos de verificação:
 * 1. Bearer Token (Header): Padrão para clientes mobile/web (validade: 1 hora).
 * 2. Session Cookie: Para painéis administrativos ou sessões persistentes (validade: até 14 dias).
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
      const sessionCookie = req.cookies.session;
      // checkRevoked: true verifica se a conta foi desativada ou a sessão revogada
      decoded = await auth_firebase.verifySessionCookie(sessionCookie, true);
    } else {
      return res.status(401).json({ error: "Token ou Cookie de sessão ausente" });
    }

    req.user = {
      uid: decoded.uid,
      role: decoded.role || "aluno",
      email: decoded.email,
    };

    return next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido", details: String(e) });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Não autenticado" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Sem permissão" });
    }
    return next();
  };
}

export const requireAdmin = [requireAuth, requireRole("admin")];
export const requireAluno = [requireAuth, requireRole("aluno")];