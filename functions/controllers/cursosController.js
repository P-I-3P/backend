import { db } from "../config/firebase.js";

const COLLECTION = "cursos";

/**
 * Retorna todos os cursos cadastrados ordenados por data de criação.
 * @returns {Promise<Object>} Lista de cursos.
 */
export async function listarCursos(req, res) {
  try {
    // Busca todos os documentos da coleção, ordenando pelos mais recentes primeiro
    const snapshot = await db.collection(COLLECTION).orderBy("criadoEm", "desc").get();
    // Mapeia os documentos para incluir o ID do Firestore no objeto de retorno
    const cursos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(cursos);
  } catch (error) {
    console.error("Erro ao listar cursos:", error);
    return res.status(500).json({ message: "Erro ao listar cursos." });
  }
}

/**
 * Busca detalhes de um único curso pelo seu ID.
 * @param {Object} req - Parâmetro 'id' na URL.
 */
export async function buscarCurso(req, res) {
  try {
    const { id } = req.params;
    // Busca o documento específico pelo ID (chave primária)
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Curso não encontrado." });
    }
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Erro ao buscar curso:", error);
    return res.status(500).json({ message: "Erro ao buscar curso." });
  }
}

/**
 * Cria um novo curso.
 * Valida se o código do curso é único antes de salvar.
 * @param {Object} req - Body com nome, codigo, turno e carga horária.
 */
export async function criarCurso(req, res) {
  try {
    const { nome, codigo, turno, cargaHorariaComplementar } = req.body;
    if (!nome || !codigo || !turno || !cargaHorariaComplementar) {
      return res.status(400).json({ message: "Campos nome, codigo, turno e cargaHorariaComplementar são obrigatórios." });
    }

    // Regra de negócio: O código do curso deve ser único no sistema
    const existing = await db.collection(COLLECTION).where("codigo", "==", codigo).get();
    if (!existing.empty) {
      return res.status(409).json({ message: "Já existe um curso com este código." });
    }

    // Adiciona o novo curso com metadados de auditoria (criadoEm)
    const docRef = await db.collection(COLLECTION).add({
      nome,
      codigo,
      turno,
      cargaHorariaComplementar: Number(cargaHorariaComplementar),
      criadoEm: new Date().toISOString(),
    });

    return res.status(201).json({ id: docRef.id, nome, codigo, turno, cargaHorariaComplementar: Number(cargaHorariaComplementar) });
  } catch (error) {
    console.error("Erro ao criar curso:", error);
    return res.status(500).json({ message: "Erro ao criar curso." });
  }
}

/**
 * Atualiza dados de um curso existente.
 * @param {Object} req - ID na URL e campos para atualizar no body.
 */
export async function atualizarCurso(req, res) {
  try {
    const { id } = req.params;
    const { nome, codigo, turno, cargaHorariaComplementar } = req.body;

    // Obtém referência do documento para verificar existência antes de atualizar
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Curso não encontrado." });
    }

    // Constrói objeto de atualização dinamicamente apenas com campos fornecidos
    const updateData = {};
    if (nome) updateData.nome = nome;
    if (codigo) updateData.codigo = codigo;
    if (turno) updateData.turno = turno;
    if (cargaHorariaComplementar) updateData.cargaHorariaComplementar = Number(cargaHorariaComplementar);
    updateData.atualizadoEm = new Date().toISOString();

    // Executa a atualização parcial no Firestore
    await docRef.update(updateData);
    return res.json({ id, ...doc.data(), ...updateData });
  } catch (error) {
    console.error("Erro ao atualizar curso:", error);
    return res.status(500).json({ message: "Erro ao atualizar curso." });
  }
}

/**
 * Exclui um curso do Firestore.
 * @param {Object} req - ID do curso.
 */
export async function deletarCurso(req, res) {
  try {
    const { id } = req.params;
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Curso não encontrado." });
    }

    await docRef.delete();
    return res.json({ message: "Curso excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar curso:", error);
    return res.status(500).json({ message: "Erro ao deletar curso." });
  }
}
