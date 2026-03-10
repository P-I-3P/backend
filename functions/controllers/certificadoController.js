import { CertificadoService } from '../services/certificadoService.js';

const certificadoService = new CertificadoService();

/**
 * Aluno envia certificado para revisão
 */
export async function enviarCertificado(req, res) {
  try {
    const { nomeEvento, cargaHoraria } = req.body;
    const alunoId = req.user.uid;

    if (!nomeEvento || !cargaHoraria) {
      return res.status(400).json({
        error: "nomeEvento e cargaHoraria são obrigatórios",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Arquivo PDF é obrigatório",
      });
    }

    const resultado = await certificadoService.enviarParaRevisao(
      alunoId,
      req.file.buffer,
      { nomeEvento, cargaHoraria }
    );

    return res.status(201).json({
      ok: true,
      certificado: resultado,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: e.message || "Erro ao enviar certificado",
    });
  }
}

/**
 * Listar certificados do aluno logado
 */
export async function listarMeusCertificados(req, res) {
  try {
    const alunoId = req.user.uid;

    const certificados = await certificadoService.listarCertificadosAluno(alunoId);

    return res.status(200).json({
      ok: true,
      certificados,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: e.message || "Erro ao listar certificados",
    });
  }
}

/**
 * Coordenador aprova certificado
 */
export async function aprovarCertificado(req, res) {
  try {
    const { docId } = req.params;

    if (!docId) {
      return res.status(400).json({
        error: "docId é obrigatório",
      });
    }

    const codigo = await certificadoService.aprovarCertificado(docId);

    return res.status(200).json({
      ok: true,
      codigoAutenticidade: codigo,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: e.message || "Erro ao aprovar certificado",
    });
  }
}

/**
 * Coordenador rejeita certificado
 */
export async function rejeitarCertificado(req, res) {
  try {
    const { docId } = req.params;
    const { motivo } = req.body;

    if (!docId) {
      return res.status(400).json({
        error: "docId é obrigatório",
      });
    }

    if (!motivo) {
      return res.status(400).json({
        error: "motivo é obrigatório",
      });
    }

    const resultado = await certificadoService.rejeitarCertificado(docId, motivo);

    return res.status(200).json({
      ok: true,
      resultado,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: e.message || "Erro ao rejeitar certificado",
    });
  }
}

/**
 * Listar todos os certificados pendentes (apenas coordenador)
 */
export async function listarCertificadosPendentes(req, res) {
  try {
    const certificados = await certificadoService.listarCertificadosPendentes();

    return res.status(200).json({
      ok: true,
      certificados,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: e.message || "Erro ao listar certificados pendentes",
    });
  }
}

/**
 * Validação pública de certificado (sem autenticação)
 */
export async function validarCertificadoPublicamente(req, res) {
  try {
    const { codigo } = req.params;

    if (!codigo) {
      return res.status(400).json({
        error: "código é obrigatório",
      });
    }

    const certificado = await certificadoService.validarPublicamente(codigo);

    if (!certificado) {
      return res.status(404).json({
        ok: false,
        mensagem: "Certificado não encontrado ou inválido",
      });
    }

    return res.status(200).json({
      ok: true,
      certificado,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: e.message || "Erro ao validar certificado",
    });
  }
}
