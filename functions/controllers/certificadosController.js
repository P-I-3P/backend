import os from "os";
import path from "path";
import fs from "fs/promises";
import { bucket, db } from "../config/firebase.js";
import {
  validarCabecalhoPdf,
  validarTamanho,
  analisarPdfSuspeito,
} from "../services/pdfScanner.js";

export async function processarCertificado(req, res) {
  const {
    uid,
    storagePath,
    nomeArquivo,
    categoriaId,
    categoriaNome,
    cursoId,
    cursoNome,
    cursoCodigo,
    nomeAluno,
    emailAluno,
    observacaoAluno,
  } = req.body;

  if (!uid || !storagePath || !nomeArquivo) {
    return res.status(400).json({
      error: "uid, storagePath e nomeArquivo são obrigatórios",
    });
  }

  let tempFilePath = null;

  try {
    const fileName = path.basename(storagePath);
    tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${fileName}`);

    // baixa do Storage
    await bucket.file(storagePath).download({
      destination: tempFilePath,
    });

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

    // move para pasta final
    const finalPath = storagePath.replace("certificados_temp/", "certificados/");
    await bucket.file(storagePath).move(finalPath);

    let alunoData = {};
    if (!nomeAluno || !emailAluno) {
      const alunoDoc = await db.collection("users").doc(uid).get();
      alunoData = alunoDoc.exists ? alunoDoc.data() : {};
    }

    const certificadoRef = await db.collection("certificados_horas_complementares").add({
      uid,
      nomeAluno: nomeAluno || alunoData.nome || "",
      emailAluno: emailAluno || alunoData.email || "",
      nomeArquivo,
      storagePath: finalPath,
      categoriaId: categoriaId || null,
      categoriaNome: categoriaNome || null,
      cursoId: cursoId || null,
      cursoNome: cursoNome || null,
      cursoCodigo: cursoCodigo || null,
      status: "pendente",
      role: "aluno",
      contentType: "application/pdf",
      observacaoAluno: observacaoAluno || "",
      horasInformadas: null,
      horasAprovadas: null,
      observacaoAdmin: null,
      motivoRejeicao: null,
      nomeAdmin: null,
      analisadoPor: null,
      dataAnalise: null,
      analiseSeguranca: "aprovado",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return res.json({
      ok: true,
      message: "Arquivo analisado e aprovado",
      finalPath,
      certificadoId: certificadoRef.id,
    });
  } catch (error) {
    console.error("Erro ao processar certificado:", error);
    return res.status(500).json({
      error: "Erro ao analisar certificado",
    });
  } finally {
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch {}
    }
  }
}
