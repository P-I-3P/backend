import { db } from "../config/firebase.js";

const COLLECTION = "turmas";

/**
 * Lista todas as turmas, opcionalmente filtradas por curso
 * Ordena por data de criação decrescente
 * @param {Object} req - Objeto de requisição Express (query: cursoId opcional)
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object[]} Lista de turmas com id e dados
 */
export async function listarTurmas(req, res) {
  try {
    const { cursoId } = req.query;
    let query = db.collection(COLLECTION).orderBy("criadoEm", "desc");
    if (cursoId) {
      query = db.collection(COLLECTION).where("cursoId", "==", cursoId).orderBy("criadoEm", "desc");
    }
    const snapshot = await query.get();
    const turmas = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(turmas);
  } catch (error) {
    console.error("Erro ao listar turmas:", error);
    return res.status(500).json({ message: "Erro ao listar turmas." });
  }
}

/**
 * Busca uma turma específica pelo ID
 * @param {Object} req - Objeto de requisição Express (params: id)
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object} Dados da turma encontrada
 */
export async function buscarTurma(req, res) {
  try {
    const { id } = req.params;
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Turma não encontrada." });
    }
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Erro ao buscar turma:", error);
    return res.status(500).json({ message: "Erro ao buscar turma." });
  }
}

/**
 * Cria uma nova turma no sistema
 * Valida campos obrigatórios e existência do curso
 * @param {Object} req - Objeto de requisição Express (body: nome, cursoId, horario, periodoInicio, periodoFinal)
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object} Dados da turma criada
 */
export async function criarTurma(req, res) {
  try {
    const { nome, cursoId, horario, periodoInicio, periodoFinal } = req.body;
    if (!nome || !cursoId || !horario || !periodoInicio || !periodoFinal) {
      return res.status(400).json({ message: "Campos nome, cursoId, horario, periodoInicio e periodoFinal são obrigatórios." });
    }

    // Verifica se o curso existe
    const cursoDoc = await db.collection("cursos").doc(cursoId).get();
    if (!cursoDoc.exists) {
      return res.status(404).json({ message: "Curso não encontrado." });
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

/**
 * Atualiza os dados de uma turma existente
 * Permite alterar curso, validando se existe
 * @param {Object} req - Objeto de requisição Express (params: id, body: campos opcionais)
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object} Dados atualizados da turma
 */
export async function atualizarTurma(req, res) {
  try {
    const { id } = req.params;
    const { nome, cursoId, horario, periodoInicio, periodoFinal } = req.body;

    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Turma não encontrada." });
    }

    const updateData = {};
    if (nome) updateData.nome = nome;
    if (horario) updateData.horario = horario;
    if (periodoInicio) updateData.periodoInicio = periodoInicio;
    if (periodoFinal) updateData.periodoFinal = periodoFinal;

    if (cursoId && cursoId !== doc.data().cursoId) {
      const cursoDoc = await db.collection("cursos").doc(cursoId).get();
      if (!cursoDoc.exists) {
        return res.status(404).json({ message: "Curso não encontrado." });
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

/**
 * Deleta uma turma do sistema
 * @param {Object} req - Objeto de requisição Express (params: id)
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object} Mensagem de confirmação
 */
export async function deletarTurma(req, res) {
  try {
    const { id } = req.params;
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Turma não encontrada." });
    }

    await docRef.delete();
    return res.json({ message: "Turma excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar turma:", error);
    return res.status(500).json({ message: "Erro ao deletar turma." });
  }
}
