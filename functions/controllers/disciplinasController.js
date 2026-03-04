import { db } from "../config/firebase.js";

function disciplinasCol(cursoId) {
  return db.collection("cursos").doc(cursoId).collection("disciplinas");
}

async function getCursoOr404(cursoId, res) {
  console.log("[getCursoOr404] cursoId:", cursoId);

  if (!cursoId) {
    res.status(400).json({ error: "cursoId ausente" });
    return null;
  }

  const cursoRef = db.collection("cursos").doc(cursoId);
  const cursoDoc = await cursoRef.get();

  console.log("[getCursoOr404] exists:", cursoDoc.exists);

  if (!cursoDoc.exists) {
    res.status(404).json({ error: "Curso não encontrado" });
    return null;
  }

  const data = cursoDoc.data();
  console.log("[getCursoOr404] curso.semestres:", data?.semestres);

  return { ref: cursoRef, data };
}

// CREATE (admin)
export async function criarDisciplina(req, res) {
  console.log("\n[criarDisciplina] params:", req.params);
  console.log("[criarDisciplina] body:", req.body);
  console.log("[criarDisciplina] user:", req.user?.uid, req.user?.role);

  try {
    const { cursoId } = req.params;
    const { nome, codigo = null, semestre, cargaHoraria = null, obrigatoria = true, ativo = true } = req.body;

    if (!nome) return res.status(400).json({ error: "nome é obrigatório" });
    if (semestre == null) return res.status(400).json({ error: "semestre é obrigatório" });

    const curso = await getCursoOr404(cursoId, res);
    if (!curso) return;

    const semestreNum = Number(semestre);
    console.log("[criarDisciplina] semestreNum:", semestreNum);

    if (Number.isNaN(semestreNum) || semestreNum < 1) {
      return res.status(400).json({ error: "semestre deve ser número >= 1" });
    }

    const maxSem = Number(curso.data.semestres || 0);
    console.log("[criarDisciplina] maxSem:", maxSem);

    if (maxSem && semestreNum > maxSem) {
      return res.status(400).json({ error: `semestre deve ser <= ${maxSem} (semestres do curso)` });
    }

    const data = {
      nome: String(nome).trim(),
      codigo: codigo ? String(codigo).trim() : null,
      semestre: semestreNum,
      cargaHoraria: cargaHoraria === null ? null : Number(cargaHoraria),
      obrigatoria: Boolean(obrigatoria),
      ativo: Boolean(ativo),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: req.user?.uid ?? null,
      updatedBy: req.user?.uid ?? null,
    };

    console.log("[criarDisciplina] payload normalizado:", data);

    if (data.cargaHoraria !== null && Number.isNaN(data.cargaHoraria)) {
      return res.status(400).json({ error: "cargaHoraria deve ser número" });
    }

    if (data.codigo) {
      const exists = await disciplinasCol(cursoId).where("codigo", "==", data.codigo).limit(1).get();
      console.log("[criarDisciplina] codigo exists empty?:", exists.empty);
      if (!exists.empty) return res.status(409).json({ error: "codigo já existe neste curso" });
    }

    const ref = await disciplinasCol(cursoId).add(data);
    console.log("[criarDisciplina] created disciplina id:", ref.id);

    return res.status(201).json({ ok: true, id: ref.id, disciplina: data });
  } catch (e) {
    console.error("[criarDisciplina] ERROR:", e);
    return res.status(500).json({
      error: "Erro ao criar disciplina",
      details: e?.message || String(e),
    });
  }
}

// READ ALL (auth)
export async function listarDisciplinas(req, res) {
  console.log("\n[listarDisciplinas] params:", req.params);
  console.log("[listarDisciplinas] user:", req.user?.uid, req.user?.role);

  try {
    const { cursoId } = req.params;

    const curso = await getCursoOr404(cursoId, res);
    if (!curso) return;

    console.log("[listarDisciplinas] querying collection path:", `cursos/${cursoId}/disciplinas`);

    // Se suspeitar de orderBy quebrando por dados ruins, comente as linhas orderBy e deixe só .get()
    const query = disciplinasCol(cursoId).orderBy("semestre", "asc").orderBy("nome", "asc");
    const snap = await query.get();

    console.log("[listarDisciplinas] docs:", snap.size);

    // Loga amostra dos primeiros docs (pra ver se semestre/nome existem)
    snap.docs.slice(0, 3).forEach((d) => {
      const x = d.data();
      console.log("[listarDisciplinas] sample:", d.id, { semestre: x.semestre, nome: x.nome, codigo: x.codigo });
    });

    const disciplinas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ ok: true, disciplinas });
  } catch (e) {
    console.error("[listarDisciplinas] ERROR:", e);
    return res.status(500).json({
      error: "Erro ao listar disciplinas",
      details: e?.message || String(e),
    });
  }
}

// READ ONE (auth)
export async function obterDisciplina(req, res) {
  console.log("\n[obterDisciplina] params:", req.params);
  console.log("[obterDisciplina] user:", req.user?.uid, req.user?.role);

  try {
    const { cursoId, id } = req.params;

    const curso = await getCursoOr404(cursoId, res);
    if (!curso) return;

    const doc = await disciplinasCol(cursoId).doc(id).get();
    console.log("[obterDisciplina] disciplina exists:", doc.exists);

    if (!doc.exists) return res.status(404).json({ error: "Disciplina não encontrada" });

    return res.json({ ok: true, disciplina: { id: doc.id, ...doc.data() } });
  } catch (e) {
    console.error("[obterDisciplina] ERROR:", e);
    return res.status(500).json({
      error: "Erro ao obter disciplina",
      details: e?.message || String(e),
    });
  }
}

// UPDATE (admin)
export async function atualizarDisciplina(req, res) {
  console.log("\n[atualizarDisciplina] params:", req.params);
  console.log("[atualizarDisciplina] body:", req.body);
  console.log("[atualizarDisciplina] user:", req.user?.uid, req.user?.role);

  try {
    const { cursoId, id } = req.params;
    const { nome, codigo, semestre, cargaHoraria, obrigatoria, ativo } = req.body;

    const curso = await getCursoOr404(cursoId, res);
    if (!curso) return;

    const ref = disciplinasCol(cursoId).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Disciplina não encontrada" });

    const patch = {
      updatedAt: Date.now(),
      updatedBy: req.user?.uid ?? null,
    };

    if (nome !== undefined) patch.nome = String(nome).trim();
    if (codigo !== undefined) patch.codigo = codigo ? String(codigo).trim() : null;
    if (obrigatoria !== undefined) patch.obrigatoria = Boolean(obrigatoria);
    if (ativo !== undefined) patch.ativo = Boolean(ativo);

    if (cargaHoraria !== undefined) {
      patch.cargaHoraria = cargaHoraria === null ? null : Number(cargaHoraria);
      if (patch.cargaHoraria !== null && Number.isNaN(patch.cargaHoraria)) {
        return res.status(400).json({ error: "cargaHoraria deve ser número" });
      }
    }

    if (semestre !== undefined) {
      const semestreNum = Number(semestre);
      if (Number.isNaN(semestreNum) || semestreNum < 1) {
        return res.status(400).json({ error: "semestre deve ser número >= 1" });
      }
      const maxSem = Number(curso.data.semestres || 0);
      if (maxSem && semestreNum > maxSem) {
        return res.status(400).json({ error: `semestre deve ser <= ${maxSem} (semestres do curso)` });
      }
      patch.semestre = semestreNum;
    }

    if (patch.codigo !== undefined && patch.codigo) {
      const exists = await disciplinasCol(cursoId).where("codigo", "==", patch.codigo).limit(1).get();
      const conflict = exists.docs.find((d) => d.id !== id);
      if (conflict) return res.status(409).json({ error: "codigo já existe neste curso" });
    }

    console.log("[atualizarDisciplina] patch:", patch);

    await ref.update(patch);

    const updated = await ref.get();
    return res.json({ ok: true, disciplina: { id: updated.id, ...updated.data() } });
  } catch (e) {
    console.error("[atualizarDisciplina] ERROR:", e);
    return res.status(500).json({
      error: "Erro ao atualizar disciplina",
      details: e?.message || String(e),
    });
  }
}

// DELETE (admin)
export async function deletarDisciplina(req, res) {
  console.log("\n[deletarDisciplina] params:", req.params);
  console.log("[deletarDisciplina] user:", req.user?.uid, req.user?.role);

  try {
    const { cursoId, id } = req.params;

    const curso = await getCursoOr404(cursoId, res);
    if (!curso) return;

    const ref = disciplinasCol(cursoId).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Disciplina não encontrada" });

    await ref.delete();
    return res.json({ ok: true, message: "Disciplina deletada" });
  } catch (e) {
    console.error("[deletarDisciplina] ERROR:", e);
    return res.status(500).json({
      error: "Erro ao deletar disciplina",
      details: e?.message || String(e),
    });
  }
}