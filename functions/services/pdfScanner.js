// Importa o módulo fs/promises para operações assíncronas de sistema de arquivos
import fs from "fs/promises";

// Define o tamanho máximo permitido para o arquivo PDF em bytes (10 MB)
const MAX_BYTES = 10 * 1024 * 1024;

/**
<<<<<<< Updated upstream
 * Valida se o cabeçalho do arquivo corresponde a um PDF válido
 * Verifica se os primeiros 5 bytes são "%PDF-"
 * @param {string} filePath - Caminho absoluto do arquivo a ser validado
 * @returns {boolean} True se for um PDF válido, false caso contrário
=======
 * Verifica se os primeiros bytes do arquivo correspondem à assinatura mágica de um PDF (%PDF-).
 * 
 * @param {string} filePath - Caminho local do arquivo.
 * @returns {Promise<boolean>} True se o cabeçalho for válido.
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
 * Valida se o tamanho do arquivo está dentro do limite permitido
 * @param {string} filePath - Caminho absoluto do arquivo a ser validado
 * @returns {boolean} True se o tamanho for <= MAX_BYTES, false caso contrário
=======
 * Verifica se o tamanho do arquivo está dentro do limite permitido.
 * 
 * @param {string} filePath - Caminho local do arquivo.
 * @returns {Promise<boolean>} True se o tamanho for aceitável.
>>>>>>> Stashed changes
 */
export async function validarTamanho(filePath) {
  const stat = await fs.stat(filePath);
  return stat.size <= MAX_BYTES;
}

/**
<<<<<<< Updated upstream
 * Analisa o PDF em busca de assinaturas suspeitas que podem indicar malware
 * Verifica presença de JavaScript, ações automáticas, etc.
 * @param {string} filePath - Caminho absoluto do arquivo PDF a ser analisado
 * @returns {Object} Objeto com propriedades: suspeito (boolean), encontrados (array de strings)
=======
 * Analisa o conteúdo bruto do PDF em busca de palavras-chave que indiquem scripts ou ações automáticas.
 * 
 * @param {string} filePath - Caminho local do arquivo.
 * @returns {Promise<Object>} Objeto contendo o status de suspeito e a lista de itens encontrados.
>>>>>>> Stashed changes
 */
export async function analisarPdfSuspeito(filePath) {
  const raw = await fs.readFile(filePath);
  const text = raw.toString("latin1"); // Uso de latin1 para garantir leitura de bytes binários como string

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

  // Filtra as tags suspeitas encontradas no corpo do arquivo
  const encontrados = assinaturasSuspeitas.filter((item) =>
    text.includes(item)
  );

  return {
    suspeito: encontrados.length > 0,  // Verdadeiro se encontrou alguma assinatura
    encontrados,  // Lista das assinaturas encontradas
  };
}