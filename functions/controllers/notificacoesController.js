import { admin, db } from "../config/firebase.js";

/**
 * Notifica administradores sobre novos uploads via Push (FCM).
 * Envia para todos os tokens ativos e limpa automaticamente tokens expirados.
 * 
 * @param {Object} req - Body com nomeAluno e nomeArquivo.
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

    // Define o payload da notificação push e os dados de contexto (data)
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

    // Envio multicast para múltiplos dispositivos simultaneamente
    const response = await admin.messaging().sendEachForMulticast({
      tokens: uniqueTokens,
      ...message,
    });

    // Manutenção de banco: identifica tokens que não são mais válidos (App desinstalado, etc)
    const invalidTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success && ["messaging/invalid-registration-token", "messaging/registration-token-not-registered"].includes(r.error?.code)) {
        invalidTokens.push(uniqueTokens[i]);
      }
    });

    if (invalidTokens.length > 0) {
      // Limpeza atômica via Batch de tokens que não existem mais ou foram desinstalados
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
