import { db, auth_firebase } from "../config/firebase.js";
import { transporter } from "../config/nodemailer.js";

const USERS_COLLECTION = "users";
const CURSOS_COLLECTION = "cursos";

function normalizarCursoIds(body) {
  const ids = Array.isArray(body.cursoIds) ? body.cursoIds : body.cursoId ? [body.cursoId] : [];
  return [...new Set(ids.filter(Boolean))];
}

async function buscarCursosPorIds(cursoIds) {
  const cursos = [];
  for (const cursoId of cursoIds) {
    const cursoDoc = await db.collection(CURSOS_COLLECTION).doc(cursoId).get();
    if (!cursoDoc.exists) {
      const error = new Error("Curso nao encontrado.");
      error.status = 404;
      throw error;
    }
    cursos.push({ id: cursoDoc.id, ...cursoDoc.data() });
  }
  return cursos;
}

async function atualizarCursoComCoordenador(cursoId, coordenadorData) {
  await db.collection(CURSOS_COLLECTION).doc(cursoId).set(
    {
      ...coordenadorData,
      atualizadoEm: new Date().toISOString(),
    },
    { merge: true }
  );
}

function cursosResumo(cursos) {
  return cursos.map((curso) => ({
    id: curso.id,
    nome: curso.nome,
    codigo: curso.codigo,
    turno: curso.turno,
  }));
}

// GET /admins - listar admins
export async function listarAdmins(req, res) {
  try {
    const snapshot = await db.collection(USERS_COLLECTION).where("role", "==", "admin").get();
    const admins = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(admins);
  } catch (error) {
    console.error("Erro ao listar admins:", error);
    return res.status(500).json({ message: "Erro ao listar admins." });
  }
}

// POST /admins - criar admin
export async function criarAdmin(req, res) {
  let userRecord = null;
  try {
    const { nome, email } = req.body;
    const cursoIds = normalizarCursoIds(req.body);

    if (!nome || !email || cursoIds.length === 0) {
      return res.status(400).json({ message: "Campos nome, email e pelo menos um curso sao obrigatorios." });
    }

    const cursos = await buscarCursosPorIds(cursoIds);
    const cursoPrincipal = cursos[0];
    const senhaTemporaria = email.split("@")[0] + "2025!";

    userRecord = await auth_firebase.createUser({
      email,
      displayName: nome,
      password: senhaTemporaria,
    });

    await auth_firebase.setCustomUserClaims(userRecord.uid, { role: "admin" });

    await db.collection(USERS_COLLECTION).doc(userRecord.uid).set({
      nome,
      email,
      role: "admin",
      cursoId: cursoPrincipal.id,
      cursoNome: cursoPrincipal.nome,
      cursoCodigo: cursoPrincipal.codigo,
      cursoIds: cursos.map((curso) => curso.id),
      cursos: cursosResumo(cursos),
      createdAt: Date.now(),
      createdBy: req.user.uid,
    });

    await Promise.all(
      cursos.map((curso) =>
        atualizarCursoComCoordenador(curso.id, {
          coordenadorId: userRecord.uid,
          coordenadorNome: nome,
          coordenadorEmail: email,
        })
      )
    );

    try {
      await transporter.sendMail({
        from: `"SIGHC - Senac" <${process.env.USER_GMAIL}>`,
        to: email,
        subject: "Suas credenciais de acesso ao SIGHC",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #003366;">Bem-vindo ao SIGHC</h2>
            <p>Ola <strong>${nome}</strong>,</p>
            <p>Sua conta de administrador foi criada com sucesso. Use as credenciais abaixo para acessar o sistema:</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>E-mail:</strong> ${email}</p>
              <p style="margin: 4px 0;"><strong>Senha temporaria:</strong> ${senhaTemporaria}</p>
            </div>
            <p style="color: #ef4444; font-size: 14px;">Recomendamos que altere sua senha no primeiro acesso.</p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">Faculdade Senac Pernambuco</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Erro ao enviar e-mail:", emailError);
    }

    return res.status(201).json({
      uid: userRecord.uid,
      nome,
      email,
      cursoId: cursoPrincipal.id,
      cursoIds: cursos.map((curso) => curso.id),
      message: "Admin cadastrado com sucesso.",
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({ message: "Este e-mail ja esta cadastrado." });
    }

    if (userRecord?.uid) {
      try {
        await auth_firebase.deleteUser(userRecord.uid);
      } catch (rollbackError) {
        console.error("Erro ao fazer rollback de usuario criado:", rollbackError);
      }
    }

    console.error("Erro ao criar admin:", error);
    return res.status(500).json({ message: "Erro ao cadastrar admin." });
  }
}

// PUT /admins/:id - atualizar admin
export async function atualizarAdmin(req, res) {
  try {
    const { id } = req.params;
    const { nome, email } = req.body;
    const cursoIdsPayload = normalizarCursoIds(req.body);

    const docRef = db.collection(USERS_COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().role !== "admin") {
      return res.status(404).json({ message: "Admin nao encontrado." });
    }

    const adminAtual = doc.data();
    const cursoIdsAtuais = Array.isArray(adminAtual.cursoIds)
      ? adminAtual.cursoIds
      : adminAtual.cursoId
        ? [adminAtual.cursoId]
        : [];
    const cursoIdsFinais = cursoIdsPayload.length > 0 ? cursoIdsPayload : cursoIdsAtuais;

    if (cursoIdsFinais.length === 0) {
      return res.status(400).json({ message: "O coordenador deve estar vinculado a pelo menos um curso." });
    }

    const cursosFinais = await buscarCursosPorIds(cursoIdsFinais);
    const cursoPrincipal = cursosFinais[0];

    const updateData = {};
    if (nome) {
      updateData.nome = nome;
      await auth_firebase.updateUser(id, { displayName: nome });
    }
    if (email) {
      updateData.email = email;
      await auth_firebase.updateUser(id, { email });
    }

    updateData.cursoId = cursoPrincipal.id;
    updateData.cursoNome = cursoPrincipal.nome;
    updateData.cursoCodigo = cursoPrincipal.codigo;
    updateData.cursoIds = cursosFinais.map((curso) => curso.id);
    updateData.cursos = cursosResumo(cursosFinais);
    updateData.atualizadoEm = new Date().toISOString();

    await docRef.update(updateData);

    const nomeFinal = updateData.nome || adminAtual.nome;
    const emailFinal = updateData.email || adminAtual.email;
    const removidos = cursoIdsAtuais.filter((cursoId) => !updateData.cursoIds.includes(cursoId));

    await Promise.all(
      removidos.map((cursoId) =>
        atualizarCursoComCoordenador(cursoId, {
          coordenadorId: null,
          coordenadorNome: null,
          coordenadorEmail: null,
        })
      )
    );

    await Promise.all(
      cursosFinais.map((curso) =>
        atualizarCursoComCoordenador(curso.id, {
          coordenadorId: id,
          coordenadorNome: nomeFinal,
          coordenadorEmail: emailFinal,
        })
      )
    );

    return res.json({ id, ...doc.data(), ...updateData });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Erro ao atualizar admin:", error);
    return res.status(500).json({ message: "Erro ao atualizar admin." });
  }
}

// DELETE /admins/:id - deletar admin
export async function deletarAdmin(req, res) {
  try {
    const { id } = req.params;

    const docRef = db.collection(USERS_COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().role !== "admin") {
      return res.status(404).json({ message: "Admin nao encontrado." });
    }

    const adminData = doc.data();
    const cursoIds = Array.isArray(adminData.cursoIds)
      ? adminData.cursoIds
      : adminData.cursoId
        ? [adminData.cursoId]
        : [];

    await auth_firebase.deleteUser(id);
    await docRef.delete();

    await Promise.all(
      cursoIds.map((cursoId) =>
        atualizarCursoComCoordenador(cursoId, {
          coordenadorId: null,
          coordenadorNome: null,
          coordenadorEmail: null,
        })
      )
    );

    return res.json({ message: "Admin excluido com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar admin:", error);
    return res.status(500).json({ message: "Erro ao deletar admin." });
  }
}
