// roleController.js
import { auth_firebase, db } from "../config/firebase.js";

/**
<<<<<<< Updated upstream
 * Define a role customizada de um usuário no Firebase Auth e atualiza no Firestore
 * @param {Object} req - Objeto de requisição Express (body: uid, role)
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object} Confirmação da operação
=======
 * Define manualmente o papel (role) de um usuário.
 * Esta função é utilitária para promover usuários ou corrigir permissões,
 * atualizando tanto os Custom Claims do Firebase Auth quanto o perfil no Firestore.
 * 
 * @param {Object} req - Corpo contendo uid e role ("admin", "aluno", "superAdmin").
>>>>>>> Stashed changes
 */
export async function setUserRole(req, res) {
  try {
    const { uid, role } = req.body; // role: "admin" | "aluno" | "superAdmin"
    if (!uid || !["admin", "aluno", "superAdmin"].includes(role)) {
      return res.status(400).json({ error: "uid e role válidos são obrigatórios" });
    }

    await auth_firebase.setCustomUserClaims(uid, { role });
    await db.collection("users").doc(uid).set({ role }, { merge: true });

    return res.json({ ok: true, uid, role });
  } catch (e) {
    return res.status(500).json({ error: "Falha ao setar role", details: String(e) });
  }
}
