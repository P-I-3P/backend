import os from "os";
import path from "path";
import fs from "fs/promises";
import { bucket, db } from "../config/firebase.js";
import {
  validarCabecalhoPdf,
  validarTamanho,
  analisarPdfSuspeito,
} from "../services/pdfScanner.js";

/**
<<<<<<< Updated upstream
 * Processa um certificado PDF enviado por um aluno
 * Realiza validações de segurança (tamanho, cabeçalho, estruturas suspeitas)
 * Move arquivo aprovado para pasta final ou registra como suspeito
 * @param {Object} req - Objeto de requisição Express (body: uid, storagePath, nomeArquivo)
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object} Resultado do processamento
=======
 * Processa o upload de um certificado, realizando validações de segurança e movendo o arquivo
 * da pasta temporária para a pasta final no Storage.
 * 
 * @param {Object} req - Requisição contendo uid, storagePath (caminho temp) e nomeArquivo.
 * @param {Object} res - Resposta da API.
 * @returns {Promise<Object>} Status do processamento.
>>>>>>> Stashed changes
 */
export async function processarCertificado(req, res) {
  const { uid, storagePath, nomeArquivo } = req.body;

  if (!uid || !storagePath || !nomeArquivo) {
    return res.status(400).json({
      error: "uid, storagePath e nomeArquivo são obrigatórios",
    });
  }

  let tempFilePath = null;

  try {
    const fileName = path.basename(storagePath);
    tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${fileName}`);

    // Faz o download do arquivo do Firebase Storage para o diretório temporário local
    await bucket.file(storagePath).download({
      destination: tempFilePath,
    });

    // 1. Validação de Tamanho
    const tamanhoOk = await validarTamanho(tempFilePath);
    if (!tamanhoOk) {
      await bucket.file(storagePath).delete({ ignoreNotFound: true });

      await db.collection("uploads_suspeitos").add({
        uid,
        nomeArquivo,
        storagePath,
        motivo: "Arquivo acima do limite permitido",
        createdAt: Date.now(),
      });

      return res.status(400).json({
        error: "Arquivo acima do limite permitido",
      });
    }

    // 2. Validação de Cabeçalho (Verifica se é realmente um PDF)
    const cabecalhoOk = await validarCabecalhoPdf(tempFilePath);
    if (!cabecalhoOk) {
      await bucket.file(storagePath).delete({ ignoreNotFound: true });

      await db.collection("uploads_suspeitos").add({
        uid,
        nomeArquivo,
        storagePath,
        motivo: "Arquivo não é um PDF válido",
        createdAt: Date.now(),
      });

      return res.status(400).json({
        error: "Arquivo inválido",
      });
    }

    // 3. Análise de Segurança (Busca por scripts ou ações maliciosas)
    const analise = await analisarPdfSuspeito(tempFilePath);
    if (analise.suspeito) {
      await bucket.file(storagePath).delete({ ignoreNotFound: true });

      await db.collection("uploads_suspeitos").add({
        uid,
        nomeArquivo,
        storagePath,
        motivo: `Estruturas suspeitas: ${analise.encontrados.join(", ")}`,
        createdAt: Date.now(),
      });

      return res.status(400).json({
        error: "PDF rejeitado por segurança",
        encontrados: analise.encontrados,
      });
    }

    // Se aprovado, move o arquivo para o local definitivo
    const finalPath = storagePath.replace("certificados_temp/", "certificados/");
    await bucket.file(storagePath).move(finalPath);

    // Registra o certificado no banco de dados Firestore
    await db.collection("certificados_horas_complementares").add({
      uid,
      nomeArquivo,
      storagePath: finalPath,
      status: "pendente",
      analiseSeguranca: "aprovado",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return res.json({
      ok: true,
      message: "Arquivo analisado e aprovado",
      finalPath,
    });
  } catch (error) {
    console.error("Erro ao processar certificado:", error);
    return res.status(500).json({
      error: "Erro ao analisar certificado",
    });
  } finally {
    // Limpeza: Remove o arquivo temporário do servidor após o processamento
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch {}
    }
  }
}