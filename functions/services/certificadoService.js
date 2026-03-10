import { createHash } from 'crypto';
import { db } from '../config/firebase.js';

// --- UTILITÁRIOS DE SEGURANÇA ---
class SecurityService {
  /** Gera a digital única do arquivo binário */
  static gerarHashArquivo(buffer) {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /** Gera um código curto para o certificado validado (Ex: FAC-A1B2) */
  static gerarCodigoCurto(id) {
    return `FAC-${id.substring(0, 6).toUpperCase()}`;
  }
}

// --- CLASSE PRINCIPAL DE SERVIÇO ---
export class CertificadoService {
  constructor() {
    this.db = db;
  }

  /**
   * PASSO A: O Aluno envia o certificado para revisão
   */
  async enviarParaRevisao(alunoId, pdfBuffer, dados) {
    try {
      const hashDigitada = SecurityService.gerarHashArquivo(pdfBuffer);

      // Verificação de duplicidade no Firestore
      const duplicado = await this.db.collection('certificados')
        .where('hashArquivo', '==', hashDigitada)
        .get();

      if (!duplicado.empty) {
        throw new Error("Este arquivo já foi enviado anteriormente.");
      }

      const novoDoc = {
        alunoId,
        nomeEvento: dados.nomeEvento,
        cargaHoraria: dados.cargaHoraria,
        hashArquivo: hashDigitada,
        status: 'pendente',
        dataUpload: new Date(),
      };

      const docRef = await this.db.collection('certificados').add(novoDoc);
      
      return {
        id: docRef.id,
        ...novoDoc,
      };
    } catch (error) {
      throw new Error(`Erro ao enviar certificado para revisão: ${error.message}`);
    }
  }

  /**
   * PASSO B: O Coordenador aprova e gera o selo da faculdade
   */
  async aprovarCertificado(docId) {
    try {
      const codigo = SecurityService.gerarCodigoCurto(docId);
      
      await this.db.collection('certificados').doc(docId).update({
        status: 'aprovado',
        codigoAutenticidade: codigo,
        dataValidacao: new Date(),
      });

      return codigo;
    } catch (error) {
      throw new Error(`Erro ao aprovar certificado: ${error.message}`);
    }
  }

  /**
   * PASSO C: Alguém externo consulta se o certificado é real
   */
  async validarPublicamente(codigo) {
    try {
      const snapshot = await this.db.collection('certificados')
        .where('codigoAutenticidade', '==', codigo)
        .where('status', '==', 'aprovado')
        .get();

      if (snapshot.empty) return null;

      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      };
    } catch (error) {
      throw new Error(`Erro ao validar certificado: ${error.message}`);
    }
  }

  /**
   * PASSO D: Rejeitar um certificado
   */
  async rejeitarCertificado(docId, motivo) {
    try {
      await this.db.collection('certificados').doc(docId).update({
        status: 'rejeitado',
        dataRejeicao: new Date(),
        motivo,
      });

      return { status: 'rejeitado' };
    } catch (error) {
      throw new Error(`Erro ao rejeitar certificado: ${error.message}`);
    }
  }

  /**
   * Listar certificados de um aluno
   */
  async listarCertificadosAluno(alunoId) {
    try {
      const snapshot = await this.db.collection('certificados')
        .where('alunoId', '==', alunoId)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw new Error(`Erro ao listar certificados: ${error.message}`);
    }
  }

  /**
   * Listar todos os certificados pendentes (para coordenador)
   */
  async listarCertificadosPendentes() {
    try {
      const snapshot = await this.db.collection('certificados')
        .where('status', '==', 'pendente')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw new Error(`Erro ao listar certificados pendentes: ${error.message}`);
    }
  }
}

export { SecurityService };
