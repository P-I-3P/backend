// Importa o módulo fs/promises para operações assíncronas de sistema de arquivos
import fs from "fs/promises";

// Define o tamanho máximo permitido para o arquivo PDF em bytes (10 MB)
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Valida se o cabeçalho do arquivo corresponde a um PDF válido
 * Verifica se os primeiros 5 bytes são "%PDF-"
 * @param {string} filePath - Caminho absoluto do arquivo a ser validado
 * @returns {boolean} True se for um PDF válido, false caso contrário
 */
export async function validarCabecalhoPdf(filePath) {
  const file = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(5);
    await file.read(buffer, 0, 5, 0);
    return buffer.toString() === "%PDF-";
  } finally {
    await file.close();
  }
}

/**
 * Valida se o tamanho do arquivo está dentro do limite permitido
 * @param {string} filePath - Caminho absoluto do arquivo a ser validado
 * @returns {boolean} True se o tamanho for <= MAX_BYTES, false caso contrário
 */
export async function validarTamanho(filePath) {
  const stat = await fs.stat(filePath);
  return stat.size <= MAX_BYTES;
}

/**
 * Analisa o PDF em busca de assinaturas suspeitas que podem indicar malware
 * Verifica presença de JavaScript, ações automáticas, etc.
 * @param {string} filePath - Caminho absoluto do arquivo PDF a ser analisado
 * @returns {Object} Objeto com propriedades: suspeito (boolean), encontrados (array de strings)
 */
export async function analisarPdfSuspeito(filePath) {
  const raw = await fs.readFile(filePath);
  const text = raw.toString("latin1");

  const assinaturasSuspeitas = [
    "/JavaScript",  // Indica presença de JavaScript embutido
    "/JS",          // Abreviação para JavaScript
    "/OpenAction",  // Ação automática ao abrir o PDF
    "/Launch",      // Comando para executar programas externos
    "/EmbeddedFile", // Arquivos embutidos no PDF
    "/RichMedia",   // Conteúdo multimídia rico
    "/SubmitForm",  // Formulário que envia dados
    "/ImportData",  // Importação de dados externos
  ];

  const encontrados = assinaturasSuspeitas.filter((item) =>
    text.includes(item)
  );

  return {
    suspeito: encontrados.length > 0,  // Verdadeiro se encontrou alguma assinatura
    encontrados,  // Lista das assinaturas encontradas
  };
}