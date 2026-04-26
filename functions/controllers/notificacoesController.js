import { admin, db } from "../config/firebase.js";

function getAdminCursoIds(data) {
  if (Array.isArray(data.cursoIds)) return data.cursoIds.filter(Boolean);
  return data.cursoId ? [data.cursoId] : [];
}

function addTokensFromAdmin(doc, tokensByAdminId) {
  const data = doc.data();
  const tokens = [];

  if (Array.isArray(data.fcmTokens)) {
    data.fcmTokens
      .filter((t) => t?.active && t?.token)
      .forEach((t) => tokens.push(t.token));
  } else if (data.fcmToken) {
    tokens.push(data.fcmToken);
  }

  if (tokens.length > 0) {
    tokensByAdminId.set(doc.id, {
      ref: doc.ref,
      fcmTokens: data.fcmTokens,
      tokens,
    });
  }
}

async function buscarCoordenadoresParaCurso(cursoId) {
  const adminsSnap = await db
    .collection("users")
    .where("role", "==", "admin")
    .get();

  const admins = adminsSnap.docs;
  if (!cursoId) return admins;

  const coordenadoresDoCurso = admins.filter((doc) => getAdminCursoIds(doc.data()).includes(cursoId));
  if (coordenadoresDoCurso.length > 0) {
    return coordenadoresDoCurso;
  }

  return admins;
}

export async function notificarAdminsUpload(req, res) {
  try {
    const { nomeAluno, nomeArquivo, certificadoId, cursoId, cursoNome, categoriaNome } = req.body;

    if (!nomeAluno || !nomeArquivo) {
      return res.status(400).json({ error: "nomeAluno e nomeArquivo sao obrigatorios" });
    }

    const admins = await buscarCoordenadoresParaCurso(cursoId);
    const tokensByAdminId = new Map();
    admins.forEach((doc) => addTokensFromAdmin(doc, tokensByAdminId));

    const tokens = [...tokensByAdminId.values()].flatMap((adminData) => adminData.tokens);

    if (tokens.length === 0) {
      return res.json({ success: true, sent: 0, message: "Nenhum coordenador com token FCM" });
    }

    const uniqueTokens = [...new Set(tokens)];
    const cursoTexto = cursoNome ? ` em ${cursoNome}` : "";
    const categoriaTexto = categoriaNome ? `Categoria: ${categoriaNome}` : "";
    const url = certificadoId
      ? `https://sighc.com.br/admin?certificadoId=${encodeURIComponent(certificadoId)}`
      : "https://sighc.com.br/admin";

    const message = {
      notification: {
        title: "Novo certificado enviado",
        body: `${nomeAluno} enviou "${nomeArquivo}"${cursoTexto}`,
      },
      webpush: {
        fcmOptions: {
          link: url,
        },
      },
      data: {
        type: "novo_certificado",
        nomeAluno,
        nomeArquivo,
        certificadoId: certificadoId || "",
        cursoId: cursoId || "",
        cursoNome: cursoNome || "",
        categoriaNome: categoriaNome || "",
        body: categoriaTexto,
        url,
        timestamp: Date.now().toString(),
      },
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens: uniqueTokens,
      ...message,
    });

    const invalidTokens = [];
    response.responses.forEach((r, i) => {
      if (
        !r.success &&
        ["messaging/invalid-registration-token", "messaging/registration-token-not-registered"].includes(r.error?.code)
      ) {
        invalidTokens.push(uniqueTokens[i]);
      }
    });

    if (invalidTokens.length > 0) {
      const batch = db.batch();
      tokensByAdminId.forEach((adminData) => {
        if (Array.isArray(adminData.fcmTokens)) {
          const filtered = adminData.fcmTokens.filter((t) => !invalidTokens.includes(t.token));
          batch.update(adminData.ref, { fcmTokens: filtered });
        }
      });
      await batch.commit();
    }

    return res.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      targetedAdmins: admins.length,
    });
  } catch (error) {
    console.error("Erro ao notificar admins:", error);
    return res.status(500).json({ error: "Erro interno ao enviar notificacoes" });
  }
}
