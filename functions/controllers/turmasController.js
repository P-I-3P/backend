import { db } from "../config/firebase.js";

const COLLECTION = "turmas";

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
  return chunks;
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

// GET /turmas?cursoId=xxx
export async function listarTurmas(req, res) {
  try {
    const cursoIds = await resolverCursosPermitidos(req);

    if (cursoIds.length > 0) {
      const docs = new Map();
      for (const ids of chunk(cursoIds, 10)) {
        const snapshot = await db.collection(COLLECTION).where("cursoId", "in", ids).get();
        snapshot.docs.forEach((doc) => docs.set(doc.id, doc));
      }
      const turmas = Array.from(docs.values()).map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.json(turmas);
    }

    const query = db.collection(COLLECTION).orderBy("criadoEm", "desc");
    const snapshot = await query.get();
    const turmas = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(turmas);
  } catch (error) {
    console.error("Erro ao listar turmas:", error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Erro ao listar turmas." });
  }
}

// GET /turmas/:id
export async function buscarTurma(req, res) {
  try {
    const { id } = req.params;
    const doc = await db.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Turma nao encontrada." });
    }

    if (req.user?.role === "admin") {
      const cursoIdsPermitidos = await resolverCursosPermitidos(req);
      if (!cursoIdsPermitidos.includes(doc.data().cursoId)) {
        return res.status(403).json({ message: "Sem permissao para acessar esta turma." });
      }
    }

    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Erro ao buscar turma:", error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Erro ao buscar turma." });
  }
}

// POST /turmas
export async function criarTurma(req, res) {
  try {
    const { nome, cursoId, horario, periodoInicio, periodoFinal } = req.body;
    if (!nome || !cursoId || !horario || !periodoInicio || !periodoFinal) {
      return res.status(400).json({ message: "Campos nome, cursoId, horario, periodoInicio e periodoFinal sao obrigatorios." });
    }

    const cursoDoc = await db.collection("cursos").doc(cursoId).get();
    if (!cursoDoc.exists) {
      return res.status(404).json({ message: "Curso nao encontrado." });
    }

    if (req.user?.role === "admin") {
      const cursoIdsPermitidos = await resolverCursosPermitidos(req);
      if (!cursoIdsPermitidos.includes(cursoId)) {
        return res.status(403).json({ message: "Sem permissao para criar turma neste curso." });
      }
    }

    const cursoData = cursoDoc.data();

    const docRef = await db.collection(COLLECTION).add({
      nome,
      cursoId,
      cursoNome: cursoData.nome,
      cursoCodigo: cursoData.codigo,
      horario,
      periodoInicio,
      periodoFinal,
      criadoEm: new Date().toISOString(),
    });

    return res.status(201).json({
      id: docRef.id,
      nome,
      cursoId,
      cursoNome: cursoData.nome,
      cursoCodigo: cursoData.codigo,
      horario,
      periodoInicio,
      periodoFinal,
    });
  } catch (error) {
    console.error("Erro ao criar turma:", error);
    return res.status(500).json({ message: "Erro ao criar turma." });
  }
}

// PUT /turmas/:id
export async function atualizarTurma(req, res) {
  try {
    const { id } = req.params;
    const { nome, cursoId, horario, periodoInicio, periodoFinal } = req.body;

    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Turma nao encontrada." });
    }

    if (req.user?.role === "admin") {
      const cursoIdsPermitidos = await resolverCursosPermitidos(req);
      if (!cursoIdsPermitidos.includes(doc.data().cursoId)) {
        return res.status(403).json({ message: "Sem permissao para atualizar esta turma." });
      }
      if (cursoId && !cursoIdsPermitidos.includes(cursoId)) {
        return res.status(403).json({ message: "Sem permissao para mover turma para este curso." });
      }
    }

    const updateData = {};
    if (nome) updateData.nome = nome;
    if (horario) updateData.horario = horario;
    if (periodoInicio) updateData.periodoInicio = periodoInicio;
    if (periodoFinal) updateData.periodoFinal = periodoFinal;

    if (cursoId && cursoId !== doc.data().cursoId) {
      const cursoDoc = await db.collection("cursos").doc(cursoId).get();
      if (!cursoDoc.exists) {
        return res.status(404).json({ message: "Curso nao encontrado." });
      }
      updateData.cursoId = cursoId;
      updateData.cursoNome = cursoDoc.data().nome;
      updateData.cursoCodigo = cursoDoc.data().codigo;
    }

    updateData.atualizadoEm = new Date().toISOString();

    await docRef.update(updateData);
    return res.json({ id, ...doc.data(), ...updateData });
  } catch (error) {
    console.error("Erro ao atualizar turma:", error);
    return res.status(500).json({ message: "Erro ao atualizar turma." });
  }
}

// DELETE /turmas/:id
export async function deletarTurma(req, res) {
  try {
    const { id } = req.params;
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Turma nao encontrada." });
    }

    await docRef.delete();
    return res.json({ message: "Turma excluida com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar turma:", error);
    return res.status(500).json({ message: "Erro ao deletar turma." });
  }
}
