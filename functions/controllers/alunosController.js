import { db, auth_firebase } from "../config/firebase.js";
import { transporter } from "../config/nodemailer.js";

function normalizarCursoIds(body) {
  const ids = Array.isArray(body.cursoIds) ? body.cursoIds : body.cursoId ? [body.cursoId] : [];
  return [...new Set(ids.filter(Boolean))];
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
  return chunks;
}

async function buscarCursosPorIds(cursoIds) {
  const cursos = [];
  for (const cursoId of cursoIds) {
    const cursoDoc = await db.collection("cursos").doc(cursoId).get();
    if (!cursoDoc.exists) {
      const error = new Error("Curso nao encontrado.");
      error.statusCode = 404;
      throw error;
    }
    cursos.push({ id: cursoDoc.id, ...cursoDoc.data() });
  }
  return cursos;
}

function cursosResumo(cursos) {
  return cursos.map((curso) => ({
    id: curso.id,
    nome: curso.nome,
    codigo: curso.codigo,
    turno: curso.turno,
  }));
}

async function resolverCursosPermitidos(req) {
  if (req.user?.role === "superAdmin") {
    return req.query.cursoId ? [req.query.cursoId] : [];
  }

  const userDoc = await db.collection("users").doc(req.user.uid).get();
  if (!userDoc.exists) {
    const error = new Error("Usuario nao encontrado.");
    error.statusCode = 404;
    throw error;
  }

  const userData = userDoc.data();
  const cursoIds = Array.isArray(userData.cursoIds)
    ? userData.cursoIds
    : userData.cursoId
      ? [userData.cursoId]
      : [];

  if (cursoIds.length === 0) {
    const error = new Error("Admin sem curso vinculado.");
    error.statusCode = 403;
    throw error;
  }

  if (req.query.cursoId && !cursoIds.includes(req.query.cursoId)) {
    const error = new Error("Sem permissao para acessar este curso.");
    error.statusCode = 403;
    throw error;
  }

  return req.query.cursoId ? [req.query.cursoId] : cursoIds;
}

async function listarAlunosPorCursos(cursoIds) {
  const docs = new Map();

  for (const ids of chunk(cursoIds, 10)) {
    const arraySnap = await db
      .collection("users")
      .where("role", "==", "aluno")
      .where("cursoIds", "array-contains-any", ids)
      .get();
    arraySnap.docs.forEach((doc) => docs.set(doc.id, doc));

    const legacySnap = await db
      .collection("users")
      .where("role", "==", "aluno")
      .where("cursoId", "in", ids)
      .get();
    legacySnap.docs.forEach((doc) => docs.set(doc.id, doc));
  }

  return Array.from(docs.values()).map((doc) => ({ id: doc.id, ...doc.data() }));
}

// GET /alunos
export async function listarAlunos(req, res) {
  try {
    const cursoIds = await resolverCursosPermitidos(req);

    if (cursoIds.length === 0) {
      const snapshot = await db.collection("users").where("role", "==", "aluno").get();
      const alunos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.json(alunos);
    }

    const alunos = await listarAlunosPorCursos(cursoIds);
    return res.json(alunos);
  } catch (error) {
    console.error("Erro ao listar alunos:", error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Erro ao listar alunos." });
  }
}

async function buscarTurma(turmaId) {
  if (!turmaId) return null;
  const turmaDoc = await db.collection("turmas").doc(turmaId).get();
  if (!turmaDoc.exists) {
    const error = new Error("Turma nao encontrada.");
    error.statusCode = 404;
    throw error;
  }
  return { id: turmaDoc.id, ...turmaDoc.data() };
}

async function enviarEmailBoasVindas(nome, email, senhaTemporaria) {
  await transporter.sendMail({
    from: `"Horas Complementares - Senac" <${process.env.USER_GMAIL}>`,
    to: email,
    subject: "Bem-vindo ao Sistema de Horas Complementares - Senac",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a5f;">Ola, ${nome}!</h2>
        <p>Sua conta foi criada com sucesso. Use as credenciais abaixo para acessar o sistema pela primeira vez.</p>
        <div style="background: #f1f5f9; border-left: 4px solid #1e3a5f; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p><strong>E-mail:</strong> ${email}</p>
          <p><strong>Senha temporaria:</strong> ${senhaTemporaria}</p>
        </div>
        <p>Redefina sua senha no primeiro acesso para garantir a seguranca da sua conta.</p>
      </div>
    `,
  });
}

