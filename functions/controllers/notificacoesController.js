import { admin, db } from "../config/firebase.js";

/**
<<<<<<< Updated upstream
 * Envia notificações push FCM para todos os admins quando um aluno faz upload de certificado
 * Coleta tokens FCM ativos, envia mensagem multicast e limpa tokens inválidos
 * @param {Object} req - Objeto de requisição Express (body: nomeAluno, nomeArquivo)
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object} Resultado do envio das notificações
=======
 * Envia notificações push (FCM) para todos os administradores quando um novo certificado é enviado.
 * 
 * @param {Object} req - Objeto de requisição do Express contendo nomeAluno e nomeArquivo no corpo.
 * @param {Object} res - Objeto de resposta do Express.
 * @returns {Promise<Object>} Resposta JSON indicando o sucesso e a contagem de envios.
>>>>>>> Stashed changes
 */
export async function notificarAdminsUpload(req, res) {
  try {
    const { nomeAluno, nomeArquivo } = req.body;

    if (!nomeAluno || !nomeArquivo) {
      return res.status(400).json({ error: "nomeAluno e nomeArquivo são obrigatórios" });
    }

    // Busca todos os admins
    const adminsSnap = await db
      .collection("users")
      .where("role", "==", "admin")
      .get();

    // Coleta tokens FCM ativos de todos os admins
    const tokens = [];
    adminsSnap.forEach((doc) => {
      const data = doc.data();
      if (Array.isArray(data.fcmTokens)) {
        data.fcmTokens
          .filter((t) => t.active)
          .forEach((t) => tokens.push(t.token));
      } else if (data.fcmToken) {
        tokens.push(data.fcmToken);
      }
    });

    if (tokens.length === 0) {
      return res.json({ success: true, sent: 0, message: "Nenhum admin com token FCM" });
    }

    // Remove duplicatas
    const uniqueTokens = [...new Set(tokens)];

    const message = {
      notification: {
        title: "📄 Novo certificado enviado",
        body: `${nomeAluno} enviou o arquivo "${nomeArquivo}"`,
      },
      data: {
        type: "novo_certificado",
        nomeAluno,
        nomeArquivo,
        timestamp: Date.now().toString(),
      },
    };

    // Envia a mensagem para todos os tokens coletados
    const response = await admin.messaging().sendEachForMulticast({
      tokens: uniqueTokens,
      ...message,
    });

    // Identifica tokens que não são mais válidos (expirados ou desinstalados)
    // para limpeza posterior no banco de dados.
    const invalidTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success && ["messaging/invalid-registration-token", "messaging/registration-token-not-registered"].includes(r.error?.code)) {
        invalidTokens.push(uniqueTokens[i]);
      }
    });

    // Remove os tokens inválidos do Firestore para manter a base limpa
    if (invalidTokens.length > 0) {
      const batch = db.batch();
      adminsSnap.forEach((doc) => {
        const data = doc.data();
        if (Array.isArray(data.fcmTokens)) {
          const filtered = data.fcmTokens.filter((t) => !invalidTokens.includes(t.token));
          batch.update(doc.ref, { fcmTokens: filtered });
        }
      });
      await batch.commit();
    }

    return res.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    });
  } catch (error) {
    console.error("Erro ao notificar admins:", error);
    return res.status(500).json({ error: "Erro interno ao enviar notificações" });
  }
}
