import fs from "fs/promises";

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Valida o cabeçalho "mágico" do arquivo para garantir que é um PDF legítimo.
 * 
 * @param {string} filePath - Caminho local do arquivo temporário.
 * @returns {Promise<boolean>} True se os primeiros 5 bytes forem '%PDF-'.
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
 * Verifica se o tamanho do arquivo está dentro do limite global (10MB).
 */
export async function validarTamanho(filePath) {
  const stat = await fs.stat(filePath);
  return stat.size <= MAX_BYTES;
}

/**
 * Analisa o conteúdo bruto do PDF em busca de tags que indiquem execução de scripts ou ações maliciosas.
 * 
 * @param {string} filePath - Caminho local do arquivo.
 * @returns {Promise<Object>} Status de suspeição e lista de tags encontradas.
 */
export async function analisarPdfSuspeito(filePath) {
  const raw = await fs.readFile(filePath);
  // Usamos latin1 para ler o binário como string sem corromper caracteres especiais de controle
  const text = raw.toString("latin1");

  const assinaturasSuspeitas = [
    "/JavaScript",
    "/JS",
    "/OpenAction",
    "/Launch",
    "/EmbeddedFile",
    "/RichMedia",
    "/SubmitForm",
    "/ImportData",
  ];

  const encontrados = assinaturasSuspeitas.filter((item) =>
    text.includes(item)
  );

  return {
    suspeito: encontrados.length > 0,
    encontrados,
  };
}