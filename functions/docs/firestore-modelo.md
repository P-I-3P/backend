# Modelo do Firestore - SIGHC

Este modelo foi inferido a partir do backend em `functions/controllers`.
Nao foram encontradas subcolecoes no codigo atual.

## Visao geral

```text
Firestore
├── users/{uid}
├── cursos/{cursoId}
├── turmas/{turmaId}
├── certificados_horas_complementares/{certificadoId}
└── uploads_suspeitos/{uploadSuspeitoId}
```

## Relacionamentos principais

```text
users.cursoId              -> cursos/{cursoId}
users.cursoIds[]           -> cursos/{cursoId}
users.cursos[].id          -> cursos/{cursoId}

turmas.cursoId             -> cursos/{cursoId}

certificados_horas_complementares.uid
                            -> users/{uid}
certificados_horas_complementares.cursoId
                            -> cursos/{cursoId}

cursos.coordenadorId       -> users/{uid} com role "admin"
```

## Colecao: users

Documento: `users/{uid}`

O ID do documento e o `uid` do Firebase Authentication.
A mesma colecao guarda alunos, admins e superAdmins, diferenciados pelo campo `role`.

### Usuario admin/coordenador

```js
{
  nome: "Nome do coordenador",              // string
  email: "coordenador@email.com",           // string
  role: "admin",                            // "admin"

  cursoId: "cursoIdPrincipal",              // string, legado/principal
  cursoNome: "Nome do curso",               // string
  cursoCodigo: "12345",                     // string

  cursoIds: ["cursoId1", "cursoId2"],       // array<string>
  cursos: [
    {
      id: "cursoId1",                       // string
      nome: "Nome do curso",                // string
      codigo: "12345",                      // string
      turno: "Noite"                        // string
    }
  ],

  fcmToken: "token-fcm-legado",             // string, opcional/legado
  fcmTokens: [                              // array<object>, opcional
    {
      token: "token-fcm",
      active: true
    }
  ],

  createdAt: 1710000000000,                 // number timestamp em ms
  createdBy: "uidSuperAdmin",               // string
  atualizadoEm: "2026-05-04T12:00:00.000Z"  // string ISO, opcional
}
```

### Usuario aluno

O backend lista alunos por `role == "aluno"` e por vinculo com curso via `cursoIds` ou `cursoId`.
No arquivo atual, a rota `POST /alunos` importa `criarAluno`, mas essa funcao nao esta exportada em `alunosController.js`; por isso os campos abaixo sao os campos esperados pelas consultas e integracoes existentes.

```js
{
  nome: "Nome do aluno",                    // string
  email: "aluno@email.com",                 // string
  role: "aluno",                            // "aluno"

  cursoId: "cursoIdPrincipal",              // string, legado/principal
  cursoNome: "Nome do curso",               // string
  cursoCodigo: "12345",                     // string

  cursoIds: ["cursoId1"],                   // array<string>
  cursos: [
    {
      id: "cursoId1",
      nome: "Nome do curso",
      codigo: "12345",
      turno: "Noite"
    }
  ],

  turmaId: "turmaId",                       // string, opcional
  turmaNome: "Turma 2026.1",                // string, opcional

  createdAt: 1710000000000,                 // number timestamp em ms, opcional
  createdBy: "uidSuperAdmin",               // string, opcional
  atualizadoEm: "2026-05-04T12:00:00.000Z"  // string ISO, opcional
}
```

### Usuario superAdmin

```js
{
  role: "superAdmin",                       // "superAdmin"
  nome: "Nome do usuario",                  // string, opcional
  email: "usuario@email.com"                // string, opcional
}
```

## Colecao: cursos

Documento: `cursos/{cursoId}`

O ID e gerado automaticamente pelo Firestore ao criar curso.

```js
{
  nome: "Analise e Desenvolvimento de Sistemas", // string
  codigo: "12345",                               // string numerica unica
  turno: "Noite",                                // string
  cargaHorariaComplementar: 100,                 // number

  coordenadorId: "uidAdmin",                     // string ou null
  coordenadorNome: "Nome do coordenador",        // string ou null
  coordenadorEmail: "coord@email.com",           // string ou null

  regrasAtividades: [                            // array<object>, opcional
    {
      categoriaId: "categoria-id",
      categoriaNome: "Categoria",
      limiteHoras: 20
    }
  ],

  criadoEm: "2026-05-04T12:00:00.000Z",          // string ISO
  atualizadoEm: "2026-05-04T12:00:00.000Z"       // string ISO, opcional
}
```

## Colecao: turmas

Documento: `turmas/{turmaId}`

O ID e gerado automaticamente pelo Firestore ao criar turma.

```js
{
  nome: "ADS 2026.1",                            // string

  cursoId: "cursoId",                            // string
  cursoNome: "Nome do curso",                    // string
  cursoCodigo: "12345",                          // string

  horario: "19:00 as 22:00",                     // string
  periodoInicio: "2026-02-01",                   // string/data recebida no body
  periodoFinal: "2026-12-15",                    // string/data recebida no body

  criadoEm: "2026-05-04T12:00:00.000Z",          // string ISO
  atualizadoEm: "2026-05-04T12:00:00.000Z"       // string ISO, opcional
}
```

## Colecao: certificados_horas_complementares

Documento: `certificados_horas_complementares/{certificadoId}`

O ID e gerado automaticamente pelo Firestore apos validacao do PDF.
O arquivo final fica no Firebase Storage em `certificados/...`.

```js
{
  uid: "uidAluno",                               // string
  nomeAluno: "Nome do aluno",                    // string
  emailAluno: "aluno@email.com",                 // string

  nomeArquivo: "certificado.pdf",                // string
  storagePath: "certificados/arquivo.pdf",       // string
  contentType: "application/pdf",                // string

  categoriaId: "categoriaId",                    // string ou null
  categoriaNome: "Nome da categoria",            // string ou null

  cursoId: "cursoId",                            // string ou null
  cursoNome: "Nome do curso",                    // string ou null
  cursoCodigo: "12345",                          // string ou null

  status: "pendente",                            // "pendente" | "aprovado" | "rejeitado"
  role: "aluno",                                 // string

  observacaoAluno: "Texto enviado pelo aluno",   // string
  horasInformadas: null,                         // number ou null
  horasAprovadas: null,                          // number ou null

  observacaoAdmin: null,                         // string ou null
  motivoRejeicao: null,                          // string ou null
  nomeAdmin: null,                               // string ou null
  analisadoPor: null,                            // uid admin ou null
  dataAnalise: null,                             // timestamp/data ou null

  analiseSeguranca: "aprovado",                  // string
  createdAt: 1710000000000,                      // number timestamp em ms
  updatedAt: 1710000000000                       // number timestamp em ms
}
```

## Colecao: uploads_suspeitos

Documento: `uploads_suspeitos/{uploadSuspeitoId}`

Criado quando um PDF enviado e rejeitado por tamanho, cabecalho invalido ou estruturas suspeitas.
O arquivo temporario e removido do Storage.

```js
{
  uid: "uidAluno",                               // string
  nomeArquivo: "arquivo.pdf",                    // string
  storagePath: "certificados_temp/arquivo.pdf",  // string
  motivo: "Arquivo acima do limite permitido",   // string
  createdAt: 1710000000000                       // number timestamp em ms
}
```

## Consultas usadas pelo backend

```js
// cursos
cursos.orderBy("criadoEm", "desc")
cursos.where("codigo", "==", codigo).limit(1)

// turmas
turmas.orderBy("criadoEm", "desc")
turmas.where("cursoId", "in", cursoIds)

// users
users.where("role", "==", "admin")
users.where("role", "==", "aluno")
users.where("role", "==", "aluno").where("cursoIds", "array-contains-any", cursoIds)
users.where("role", "==", "aluno").where("cursoId", "in", cursoIds)
```

## Observacoes

- Campos de data estao misturados entre `Date.now()` em milissegundos e string ISO (`new Date().toISOString()`).
- `cursoId` e mantido como campo principal/legado, enquanto `cursoIds` permite multiplos cursos.
- `cursos` dentro de `users` e um resumo desnormalizado para evitar buscas extras.
- `cursoNome` e `cursoCodigo` em `turmas` e certificados tambem sao dados desnormalizados.
- Nao ha subcolecoes detectadas no backend atual.
- A rota `POST /alunos` referencia `criarAluno`, mas essa funcao nao aparece implementada/exportada no controller atual.
