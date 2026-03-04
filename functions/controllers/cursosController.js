import { db } from "../config/firebase.js";

const col = db.collection("cursos");

// CREATE (admin)
export async function criarCurso(req, res) {
  try {
    const {
      nome,
      codigo = null,
      periodo = null,
      cargaHoraria = null,
      ativo = true,
      tipo, // "tecnologo" | "bacharel"
    } = req.body;

    if (!nome) return res.status(400).json({ error: "nome é obrigatório" });
    if (!tipo) return res.status(400).json({ error: "tipo é obrigatório (tecnologo ou bacharel)" });

    const tipoNorm = String(tipo).toLowerCase().trim();
    if (!["tecnologo", "bacharel"].includes(tipoNorm)) {
      return res.status(400).json({ error: "tipo inválido: use tecnologo ou bacharel" });
    }

    const semestres = tipoNorm === "tecnologo" ? 5 : 10;

    const data = {
      nome: String(nome).trim(),
      codigo: codigo ? String(codigo).trim() : null,
      periodo: periodo ? String(periodo).trim() : null,
      cargaHoraria: cargaHoraria === null ? null : Number(cargaHoraria),
      tipo: tipoNorm,
      semestres,
      ativo: Boolean(ativo),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: req.user.uid,
      updatedBy: req.user.uid,
    };

    if (data.cargaHoraria !== null && Number.isNaN(data.cargaHoraria)) {
      return res.status(400).json({ error: "cargaHoraria deve ser número" });
    }

    // opcional: codigo único
    if (data.codigo) {
      const exists = await col.where("codigo", "==", data.codigo).limit(1).get();
      if (!exists.empty) return res.status(409).json({ error: "codigo já existe" });
    }

    const ref = await col.add(data);
    return res.status(201).json({ ok: true, id: ref.id, curso: data });
  } catch (e) {
    return res.status(500).json({ error: "Erro ao criar curso", details: String(e) });
  }
}

// READ ALL (auth)
export async function listarCursos(req, res) {
  try {
    const snap = await col.orderBy("nome", "asc").get();
    const cursos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ ok: true, cursos });
  } catch (e) {
    return res.status(500).json({ error: "Erro ao listar cursos", details: String(e) });
  }
}

// READ ONE (auth)
export async function obterCurso(req, res) {
  try {
    const { id } = req.params;

    const doc = await col.doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Curso não encontrado" });

    return res.json({ ok: true, curso: { id: doc.id, ...doc.data() } });
  } catch (e) {
    return res.status(500).json({ error: "Erro ao obter curso", details: String(e) });
  }
}

// UPDATE (admin)
export async function atualizarCurso(req, res) {
  try {
    const { id } = req.params;
    const { nome, codigo, periodo, cargaHoraria, ativo, tipo } = req.body;

    const ref = db.collection("cursos").doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Curso não encontrado" });
    }

    const patch = {
      updatedAt: Date.now(),
      updatedBy: req.user.uid,
    };

    if (nome !== undefined) patch.nome = String(nome).trim();
    if (codigo !== undefined) patch.codigo = codigo ? String(codigo).trim() : null;
    if (periodo !== undefined) patch.periodo = periodo ? String(periodo).trim() : null;
    if (ativo !== undefined) patch.ativo = Boolean(ativo);

    if (cargaHoraria !== undefined) {
      patch.cargaHoraria = cargaHoraria === null ? null : Number(cargaHoraria);
      if (patch.cargaHoraria !== null && Number.isNaN(patch.cargaHoraria)) {
        return res.status(400).json({ error: "cargaHoraria deve ser número" });
      }
    }

    // Atualiza tipo e recalcula semestres
    if (tipo !== undefined) {
      const tipoNorm = String(tipo).toLowerCase().trim();

      if (!["tecnologo", "bacharel"].includes(tipoNorm)) {
        return res.status(400).json({
          error: "tipo inválido: use tecnologo ou bacharel",
        });
      }

      patch.tipo = tipoNorm;
      patch.semestres = tipoNorm === "tecnologo" ? 5 : 10;
    }

    await ref.update(patch);

    const updated = await ref.get();

    return res.json({
      ok: true,
      curso: { id: updated.id, ...updated.data() },
    });
  } catch (e) {
    return res.status(500).json({
      error: "Erro ao atualizar curso",
      details: String(e),
    });
  }
}

// DELETE (admin)
export async function deletarCurso(req, res) {
  try {
    const { id } = req.params;

    const ref = col.doc(id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Curso não encontrado" });

    await ref.delete();
    return res.json({ ok: true, message: "Curso deletado" });
  } catch (e) {
    return res.status(500).json({ error: "Erro ao deletar curso", details: String(e) });
  }
}