# 📜 Manual Detalhado - AutScript.js

## Sumário
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [SecurityService](#securityservice)
4. [Autenticação e Sessões](#autenticação-e-sessões)
4. [CertificadoService](#certificadoservice)
5. [Fluxo Completo](#fluxo-completo)
6. [Endpoints da API](#endpoints-da-api)
7. [Exemplos de Uso](#exemplos-de-uso)
8. [Tratamento de Erros](#tratamento-de-erros)
9. [Segurança](#segurança)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

**AutScript.js** é um sistema completo de gerenciamento de certificados externos com autenticação e validação. Permite que alunos façam upload de certificados em PDF, coordenadores aprovem ou rejeitem, e qualquer pessoa valide a autenticidade dos certificados através de um código único.

### Características Principais
- ✅ Upload seguro de certificados (apenas PDF)
- ✅ Hash SHA256 para prevenir duplicatas
- ✅ Codes de autenticidade únicos (FAC-XXXXXX)
- ✅ Fluxo de aprovação com coordenadores
- ✅ Validação pública sem autenticação
- ✅ Tratamento robusto de erros
- ✅ Armazenamento no Firebase Firestore

---

## 🏗️ Arquitetura

### Estrutura de Arquivos Integrados

```
functions/
├── services/
│   └── certificadoService.js       # Lógica de negócio
├── controllers/
│   └── certificadoController.js    # Handlers HTTP
├── routes/
│   └── certificadosRouter.js       # Definição de rotas
└── config/
    └── firebase.js                  # Configuração Firebase
```

### Fluxo de Dados

```
Cliente (Aluno)
    ↓
POST /certificados/enviar (com PDF)
    ↓
certificadoController.enviarCertificado()
    ↓
certificadoService.enviarParaRevisao()
    ↓
Firebase Firestore (status: 'pendente')
    ↓
Coordenador revisa
    ↓
PATCH /certificados/:docId/aprovar ou /rejeitar
    ↓
Status atualizado (aprovado/rejeitado) + Código gerado
```

---

## 🔐 SecurityService

### Responsabilidade
Utilitários de segurança para hash e geração de códigos de autenticidade.

### Método: `gerarHashArquivo(buffer)`

**Descrição:** Gera um hash SHA256 único para um arquivo PDF, servindo como digital do arquivo.

**Parâmetros:**
- `buffer` (Buffer): Conteúdo binário do arquivo PDF

**Retorno:** 
- `string`: Hash SHA256 em formato hexadecimal (64 caracteres)

**Exemplo:**
```javascript
const crypto = require('crypto');
const SecurityService = require('./services/certificadoService.js').SecurityService;

const pdfBuffer = Buffer.from([/* dados do PDF */]);
const hash = SecurityService.gerarHashArquivo(pdfBuffer);
console.log(hash); 
// Saída: "a1b2c3d4e5f6... (64 caracteres)"
```

**Casos de Uso:**
- Detectar se o mesmo PDF foi enviado anteriormente
- Criar assinatura digital do documento

---

### Método: `gerarCodigoCurto(id)`

**Descrição:** Gera um código de autenticidade curto a partir do ID do documento (Ex: FAC-A1B2C3).

**Parâmetros:**
- `id` (string): ID único do documento no Firestore

**Retorno:** 
- `string`: Código formatado "FAC-" + primeiros 6 caracteres em MAIÚSCULAS

**Exemplo:**
```javascript
const SecurityService = require('./services/certificadoService.js').SecurityService;

const docId = "abc123xyz789";
const codigo = SecurityService.gerarCodigoCurto(docId);
console.log(codigo); 
// Saída: "FAC-ABC123"
```

**Detalhe Importante:** 
O código é determinístico - o mesmo ID sempre gerará o mesmo código. Isso permite regenerar o code se necessário.

---

## 🍪 Autenticação e Sessões

O sistema suporta dois modos de autenticação para atender diferentes casos de uso.

### 1. Autenticação Padrão (ID Token)
- **Uso:** Aplicações móveis ou interações rápidas.
- **Validade:** 1 hora (fixo pelo Firebase).
- **Como usar:** Enviar o token no Header `Authorization: Bearer <token>`.
- **Restrição:** Para usuários com perfil 'aluno', o e-mail deve terminar em `@edu.pe.senac.br`.

### 2. Autenticação via Session Cookies (Longa Duração)
- **Uso:** Painéis administrativos Web onde o usuário precisa ficar logado por dias.
- **Validade:** 14 dias (máximo permitido pelo Firebase).
- **Segurança:** Cookies `HttpOnly` e `Secure`.

#### Como implementar o Login de Sessão (Frontend):

1. **Login no Firebase:** O usuário faz login no cliente (frontend) e obtém o `idToken`.
2. **Troca de Token:** O frontend envia esse `idToken` para o backend.
3. **Criação do Cookie:** O backend verifica o token e retorna um cookie de sessão.

**Exemplo de requisição (JavaScript):**

```javascript
// 1. Obter token após login
const idToken = await firebase.auth().currentUser.getIdToken();

// 2. Enviar para o backend (trocar por cookie)
// IMPORTANTE: 'credentials: include' ou 'withCredentials: true' é OBRIGATÓRIO
await fetch('http://localhost:5000/auth/session-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken }),
  credentials: 'include' 
});

// 3. A partir daqui, o navegador envia o cookie automaticamente
await fetch('http://localhost:5000/cursos', {
  method: 'GET',
  credentials: 'include'
});
```

**Endpoints Relacionados:**
- `POST /auth/session-login`: Cria a sessão de 14 dias.
- `POST /auth/session-logout` (Recomendado criar): Para limpar o cookie.

### 3. Login Super Admin (Backend Direct)
- **Uso:** Acesso de emergência ou scripts de automação.
- **Restrição:** Aceita **apenas** o email `joaovictortwrp@gmail.com`.

**Endpoint:** `POST /auth/super-admin-login`

**Body:**
```json
{
  "email": "joaovictortwrp@gmail.com",
  "password": "senha_super_Çecreta"
}
```

**Retorno:** JSON contendo `idToken` para uso imediato.

---

## 📋 CertificadoService

### Inicialização

```javascript
import { CertificadoService } from '../services/certificadoService.js';

const certificadoService = new CertificadoService();
```

O construtor automaticamente conecta à instância do Firebase Firestore.

---

### Método: `enviarParaRevisao(alunoId, pdfBuffer, dados)`

**Descrição:** Aluno envia um certificado externo para revisão. Verifica duplicata antes de salvar.

**Parâmetros:**
- `alunoId` (string): ID único do aluno (geralmente uid do Firebase Auth)
- `pdfBuffer` (Buffer): Arquivo PDF em memória
- `dados` (Object): Objeto com:
  - `nomeEvento` (string): Título/nome do evento/certificado
  - `cargaHoraria` (number): Horas/créditos do certificado

**Retorno:** 
- `Promise<Object>`: Objeto com:
  ```javascript
  {
    id: "docId123",              // ID gerado pelo Firestore
    alunoId: "aluno456",
    nomeEvento: "Workshop JavaScript",
    cargaHoraria: 20,
    hashArquivo: "a1b2c3...",
    status: "pendente",
    dataUpload: Date            // Data/hora do upload
  }
  ```

**Exemplo:**
```javascript
const pdfBuffer = req.file.buffer; // Do multer

const resultado = await certificadoService.enviarParaRevisao(
  "aluno123",
  pdfBuffer,
  {
    nomeEvento: "Certificado Python Avançado",
    cargaHoraria: 40
  }
);

console.log(resultado.id); // ID para rastreamento
```

**Possíveis Erros:**
- **"Este arquivo já foi enviado anteriormente."** 
  - Mesmo PDF foi enviado antes
  - Solução: Usar um certificado diferente ou versão revisada

**Fluxo Interno:**
1. Calcula hash SHA256 do PDF
2. Verifica no Firestore se hashArquivo já existe (duplicata)
3. Se não duplicado, cria novo documento com status "pendente"
4. Retorna documento criado com ID

---

### Método: `aprovarCertificado(docId)`

**Descrição:** Coordenador aprova um certificado e gera o código de autenticidade oficial.

**Parâmetros:**
- `docId` (string): ID do documento no Firestore

**Retorno:** 
- `Promise<string>`: Código de autenticidade gerado (Ex: "FAC-ABC123")

**Exemplo:**
```javascript
const codigo = await certificadoService.aprovarCertificado("docId456");
console.log(`Certificado aprovado com código: ${codigo}`);
// Saída: "Certificado aprovado com código: FAC-DOC456"
```

**Efeitos Colaterais:**
O documento é atualizado com:
```javascript
{
  status: "aprovado",
  codigoAutenticidade: "FAC-...",
  dataValidacao: new Date()  // Timestamp da aprovação
}
```

---

### Método: `validarPublicamente(codigo)`

**Descrição:** Qualquer pessoa (sem login) valida um certificado usando o código único. **Endpoint público.**

**Parâmetros:**
- `codigo` (string): Código de autenticidade (Ex: "FAC-ABC123")

**Retorno:** 
- `Promise<Object|null>`: 
  - Se válido e aprovado: Retorna dados do certificado
  - Se inválido ou rejeitado: Retorna `null`

**Exemplo:**
```javascript
const resultado = await certificadoService.validarPublicamente("FAC-ABC123");

if (resultado) {
  console.log(`Certificado válido`);
  console.log(`Aluno: ${resultado.alunoId}`);
  console.log(`Evento: ${resultado.nomeEvento}`);
  console.log(`Data: ${resultado.dataValidacao}`);
} else {
  console.log("Certificado inválido ou não encontrado");
}
```

**Importante:** 
Apenas certificados com `status: 'aprovado'` são retornados. Certificados `rejeitado` ou `pendente` não aparecem.

---

### Método: `rejeitarCertificado(docId, motivo)`

**Descrição:** Coordenador rejeita um certificado com motivo registrado.

**Parâmetros:**
- `docId` (string): ID do documento
- `motivo` (string): Descrição do motivo da rejeição

**Retorno:** 
- `Promise<Object>`: `{ status: 'rejeitado' }`

**Exemplo:**
```javascript
await certificadoService.rejeitarCertificado(
  "docId789",
  "PDF ilegível e data anterior ao período permitido"
);
```

**Efeitos Colaterais:**
```javascript
{
  status: "rejeitado",
  dataRejeicao: new Date(),
  motivo: "..."
}
```

---

### Método: `listarCertificadosAluno(alunoId)`

**Descrição:** Aluno visualiza todos os seus certificados (qualquer status).

**Parâmetros:**
- `alunoId` (string): ID do aluno

**Retorno:** 
- `Promise<Array>`: Array de objetos certificado
  ```javascript
  [
    {
      id: "doc1",
      alunoId: "aluno123",
      nomeEvento: "Workshop A",
      status: "aprovado",
      codigoAutenticidade: "FAC-DOC001",
      ...
    },
    {
      id: "doc2",
      alunoId: "aluno123",
      nomeEvento: "Certificado B",
      status: "pendente",
      ...
    }
  ]
  ```

**Exemplo:**
```javascript
const mesCertificados = await certificadoService.listarCertificadosAluno("aluno123");

mesCertificados.forEach(cert => {
  console.log(`${cert.nomeEvento} - ${cert.status}`);
});
```

---

### Método: `listarCertificadosPendentes()`

**Descrição:** Coordenador visualiza todos os certificados aguardando aprovação, ordenados pela data de upload (mais recentes primeiro).

**Parâmetros:** Nenhum

**Retorno:** 
- `Promise<Array>`: Array de certificados com `status: 'pendente'`

**Exemplo:**
```javascript
const pendentes = await certificadoService.listarCertificadosPendentes();

console.log(`Total pendentes: ${pendentes.length}`);

pendentes.forEach(cert => {
  console.log(`- ${cert.nomeEvento} de ${cert.alunoId}`);
});
```

---

## 🔄 Fluxo Completo

### Cenário: Diego envia certificado e é aprovado

#### Passo 1: Diego faz upload do certificado
```
POST /certificados/enviar
Header: Authorization: Bearer {token_diego}
Body: 
  - Form-data: pdf (arquivo)
  - nomeEvento: "Certificado AWS Cloud Practitioner"
  - cargaHoraria: 30

Resposta (201):
{
  "ok": true,
  "certificado": {
    "id": "cert_abc123",
    "alunoId": "diego_uid",
    "nomeEvento": "Certificado AWS Cloud Practitioner",
    "cargaHoraria": 30,
    "hashArquivo": "a1b2c3...",
    "status": "pendente",
    "dataUpload": "2026-03-10T14:30:00Z"
  }
}
```

#### Passo 2: Coordenador revisa na lista de pendentes
```
GET /certificados/pendentes
Header: Authorization: Bearer {token_coordenador}

Resposta (200):
{
  "ok": true,
  "certificados": [
    {
      "id": "cert_abc123",
      "alunoId": "diego_uid",
      "nomeEvento": "Certificado AWS Cloud Practitioner",
      "cargaHoraria": 30,
      "status": "pendente",
      "dataUpload": "2026-03-10T14:30:00Z"
    }
  ]
}
```

#### Passo 3: Coordenador aprova
```
PATCH /certificados/cert_abc123/aprovar
Header: Authorization: Bearer {token_coordenador}

Resposta (200):
{
  "ok": true,
  "codigoAutenticidade": "FAC-CERT_AB"
}
```

#### Passo 4: Diego visualiza seus certificados
```
GET /certificados/meus-certificados
Header: Authorization: Bearer {token_diego}

Resposta (200):
{
  "ok": true,
  "certificados": [
    {
      "id": "cert_abc123",
      "alunoId": "diego_uid",
      "nomeEvento": "Certificado AWS Cloud Practitioner",
      "cargaHoraria": 30,
      "status": "aprovado",
      "codigoAutenticidade": "FAC-CERT_AB",
      "dataUpload": "2026-03-10T14:30:00Z",
      "dataValidacao": "2026-03-10T15:45:00Z"
    }
  ]
}
```

#### Passo 5: Terceiros validam via código
```
GET /certificados/validar/FAC-CERT_AB
(SEM autenticação - endpoint público)

Resposta (200):
{
  "ok": true,
  "certificado": {
    "id": "cert_abc123",
    "alunoId": "diego_uid",
    "nomeEvento": "Certificado AWS Cloud Practitioner",
    "cargaHoraria": 30,
    "status": "aprovado",
    "codigoAutenticidade": "FAC-CERT_AB",
    "dataValidacao": "2026-03-10T15:45:00Z"
  }
}
```

---

## 🌐 Endpoints da API

### 1. Enviar Certificado (Aluno)
```
POST /certificados/enviar
```

**Autenticação:** ✅ Requerida (Aluno)

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Body (Form-Data):**
```
pdf: [arquivo PDF]
nomeEvento: "Nome do Certificado"
cargaHoraria: 20
```

**Sucesso (201):**
```json
{
  "ok": true,
  "certificado": {
    "id": "...",
    "alunoId": "...",
    "nomeEvento": "...",
    "status": "pendente"
  }
}
```

**Erros:**
- `400`: Campo obrigatório faltando ou arquivo não é PDF
- `500`: Erro interno (arquivo duplicado, etc)

---

### 2. Listar Meus Certificados (Aluno)
```
GET /certificados/meus-certificados
```

**Autenticação:** ✅ Requerida (Aluno)

**Sucesso (200):**
```json
{
  "ok": true,
  "certificados": [
    {
      "id": "cert1",
      "nomeEvento": "Workshop",
      "status": "aprovado",
      "codigoAutenticidade": "FAC-CERT1"
    }
  ]
}
```

---

### 3. Listar Certificados Pendentes (Admin)
```
GET /certificados/pendentes
```

**Autenticação:** ✅ Requerida (Admin/Coordenador)

**Sucesso (200):**
```json
{
  "ok": true,
  "certificados": [
    {
      "id": "cert2",
      "alunoId": "aluno123",
      "nomeEvento": "AWS Certification"
    }
  ]
}
```

---

### 4. Aprovar Certificado (Admin)
```
PATCH /certificados/{docId}/aprovar
```

**Autenticação:** ✅ Requerida (Admin/Coordenador)

**Parâmetros:**
- `docId`: ID do documento (path parameter)

**Sucesso (200):**
```json
{
  "ok": true,
  "codigoAutenticidade": "FAC-ABC123"
}
```

---

### 5. Rejeitar Certificado (Admin)
```
PATCH /certificados/{docId}/rejeitar
```

**Autenticação:** ✅ Requerida (Admin/Coordenador)

**Body:**
```json
{
  "motivo": "Documento ilegível ou expirado"
}
```

**Sucesso (200):**
```json
{
  "ok": true,
  "resultado": {
    "status": "rejeitado"
  }
}
```

---

### 6. Validar Certificado Publicamente
```
GET /certificados/validar/{codigo}
```

**Autenticação:** ❌ NÃO requerida (Público)

**Parâmetros:**
- `codigo`: Código de autenticidade (Ex: FAC-ABC123)

**Sucesso (200):**
```json
{
  "ok": true,
  "certificado": {
    "id": "...",
    "nomeEvento": "...",
    "cargaHoraria": 20,
    "dataValidacao": "2026-03-10T15:45:00Z"
  }
}
```

**Não Encontrado (404):**
```json
{
  "ok": false,
  "mensagem": "Certificado não encontrado ou inválido"
}
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Upload via cURL (Aluno)
```bash
curl -X POST http://localhost:5000/certificados/enviar \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "pdf=@certificado.pdf" \
  -F "nomeEvento=Certificado Python" \
  -F "cargaHoraria=40"
```

---

### Exemplo 2: Verificar Certificado (JavaScript Frontend)
```javascript
async function verificarCertificado(codigo) {
  const response = await fetch(
    `http://localhost:5000/certificados/validar/${codigo}`
  );
  
  const data = await response.json();
  
  if (data.ok) {
    console.log('✅ Certificado válido!');
    console.log(`Evento: ${data.certificado.nomeEvento}`);
    console.log(`Carga Horária: ${data.certificado.cargaHoraria}h`);
  } else {
    console.log('❌ Certificado inválido');
  }
}

// Uso
verificarCertificado('FAC-ABC123');
```

---

### Exemplo 3: Processar Certificados Pendentes (Node.js)
```javascript
import { CertificadoService } from './services/certificadoService.js';

const service = new CertificadoService();

async function processarPendentes() {
  const pendentes = await service.listarCertificadosPendentes();
  
  for (const cert of pendentes) {
    console.log(`Analisando: ${cert.nomeEvento}`);
    
    if (cert.cargaHoraria >= 20) {
      // Auto-aprovar certificados com 20+ horas
      await service.aprovarCertificado(cert.id);
      console.log('✅ Aprovado automaticamente');
    } else {
      // Rejeitar certificados com menos de 20 horas
      await service.rejeitarCertificado(
        cert.id,
        'Carga horária insuficiente'
      );
      console.log('❌ Rejeitado - carga horária baixa');
    }
  }
}

processarPendentes();
```

---

## ⚠️ Tratamento de Erros

### Estrutura de Erro
Todos os métodos do `CertificadoService` lançam erros com mensagens descritivas:

```javascript
try {
  await certificadoService.enviarParaRevisao(alunoId, buffer, dados);
} catch (error) {
  console.error(error.message);
  // Saída: "Erro ao enviar certificado para revisão: Este arquivo já foi enviado anteriormente."
}
```

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|--------|
| "Este arquivo já foi enviado anteriormente" | PDF duplicado | Use certificado diferente |
| "docId é obrigatório" | ID não fornecido | Verifique se docId existe |
| "Apenas arquivos PDF são permitidos" | Arquivo inválido | Envie apenas PDFs |
| "Erro ao validar certificado: ..." | Código inválido | Verifique código de autenticidade |

---

## 🔒 Segurança

### 1. Hash SHA256
- Cada PDF recebe digital única
- Detecta automaticamente duplicatas
- Previne reenvio de documentos

### 2. Códigos de Autenticidade
- Formato: `FAC-` + 6 primeiros caracteres do ID
- Único por certificado
- Função determinística (regenerável)

### 3. Autenticação
- Endpoints do aluno: Requerem autenticação + role "aluno"
- Endpoints do admin: Requerem autenticação + role "admin"
- Validação pública: Sem autenticação, mas apenas retorna certificados aprovados
- **Restrição de Domínio:** Alunos devem autenticar com e-mail `@edu.pe.senac.br`.

### 4. Restrições de Upload
- Tamanho máximo: 10MB
- Tipo: Apenas PDF
- Via multer (processado em memória)

---

## 🔧 Troubleshooting

### Problema: "Firebase não está configurado"
**Solução:** Verifique se `firebase.js` está corretamente importado e variáveis de ambiente estão definidas:
```javascript
// functions/config/firebase.js
import admin from 'firebase-admin';
export const db = admin.firestore();
export const auth_firebase = admin.auth();
```

---

### Problema: "Arquivo duplicado sempre rejeitado"
**Solução:** Os hashes são idênticos porque o PDF é o mesmo. Use um documento diferente ou versão revisada.

---

### Problema: "docId não encontrado no Firestore"
**Solução:** Certifique-se que o docId vem da resposta de `enviarParaRevisao()` ou da listagem de pendentes.

---

### Problema: "Multer: arquivo não processado"
**Solução:** Verifique:
1. Header `Content-Type: multipart/form-data`
2. Campo do formulário chamado `pdf`
3. Arquivo é realmente PDF (MIME type: application/pdf)

---

## 📊 Estrutura Firestore

### Collection: `certificados`

**Documento Exemplo:**
```javascript
{
  "id": "abc123xyz789",                    // Gerado automaticamente
  "alunoId": "firebase_uid_aluno",
  "nomeEvento": "AWS Certification",
  "cargaHoraria": 30,
  "hashArquivo": "a1b2c3d4e5f6...",       // SHA256
  "status": "aprovado",                    // pendente | aprovado | rejeitado
  "codigoAutenticidade": "FAC-ABC123",
  "dataUpload": Timestamp,
  "dataValidacao": Timestamp,              // Preenchido na aprovação
  "dataRejeicao": Timestamp,               // Preenchido na rejeição (opcional)
  "motivo": "...",                         // Preenchido na rejeição (opcional)
}
```

---

## 🚀 Próximos Passos

1. **Instalar dependências:**
   ```bash
   npm install multer
   ```

2. **Deploy no Firebase:**
   ```bash
   firebase deploy --only functions
   ```

3. **Testar endpoints via Postman/Insomnia**

4. **Integrar frontend com endpoints**

---

**Desenvolvido para Sistema de Gestão de Certificados Externos - 2026**
