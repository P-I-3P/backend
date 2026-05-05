# Pitch do Projeto SIGHC

## Sistema Integrado de Gestão de Horas Complementares

O **SIGHC** é um sistema web em formato PWA desenvolvido para facilitar o envio, acompanhamento e validação de certificados de horas complementares dos alunos da Faculdade Senac.

A proposta do projeto é substituir processos manuais e descentralizados por uma plataforma digital, organizada e acessível, permitindo que alunos acompanhem suas horas complementares e que administradores validem certificados com mais agilidade e controle.

---

## 5. Requisitos: Levantamento Inicial

Durante o levantamento inicial, foi identificada a necessidade de criar uma solução que atendesse tanto os alunos quanto a equipe administrativa responsável pela validação das horas complementares.

As principais necessidades levantadas foram:

- Permitir que alunos enviem certificados de atividades complementares.
- Aceitar arquivos em formato PDF para análise.
- Possibilitar o acompanhamento do status dos certificados enviados.
- Facilitar a aprovação ou rejeição dos certificados pelos administradores.
- Registrar a carga horária validada em cada certificado aprovado.
- Organizar alunos por curso e turma.
- Permitir o cadastro e gerenciamento de cursos, turmas e alunos.
- Disponibilizar notificações para informar alterações no status dos certificados.
- Oferecer uma aplicação acessível pelo navegador e instalável no celular por meio de PWA.
- Garantir controle de acesso de acordo com o perfil do usuário.

O levantamento mostrou que o sistema precisava ser simples para o aluno, eficiente para o administrador e seguro para a instituição.

---

## 6. Requisitos Priorizados

Os requisitos foram priorizados considerando o impacto direto no funcionamento do sistema e na solução do problema principal: a gestão das horas complementares.

### Prioridade Alta

- Login seguro para alunos, administradores e superadministradores.
- Cadastro e gerenciamento de alunos.
- Cadastro e gerenciamento de cursos.
- Cadastro e gerenciamento de turmas.
- Upload de certificados pelos alunos.
- Visualização dos certificados enviados.
- Aprovação ou rejeição de certificados pelos administradores.
- Registro da quantidade de horas aprovadas.
- Exibição do progresso de horas complementares do aluno.
- Controle de permissões para impedir acesso indevido às áreas administrativas.

### Prioridade Média

- Histórico de certificados enviados.
- Notificações sobre alteração de status.
- Recuperação de senha.
- Fluxo de primeiro acesso para definição de senha.
- Painel administrativo com informações resumidas.
- Filtros e buscas para facilitar a análise dos certificados.

### Prioridade Baixa

- Relatórios avançados.
- Melhorias visuais futuras na interface.
- Exportação de dados.
- Expansão para novas regras acadêmicas.
- Personalização mais detalhada por curso.

Essa priorização permitiu focar primeiro nas funcionalidades essenciais para entregar valor real aos usuários.

---

## 7. Regras de Negócio

As regras de negócio definem como o sistema deve funcionar de acordo com as necessidades acadêmicas e administrativas.

- Cada aluno deve estar vinculado a um curso e a uma turma.
- O aluno precisa estar autenticado para acessar o sistema e enviar certificados.
- Os certificados devem ser enviados preferencialmente em formato PDF.
- Todo certificado enviado deve iniciar com o status **pendente**.
- Apenas administradores podem aprovar ou rejeitar certificados.
- Ao aprovar um certificado, o administrador deve informar a quantidade de horas válidas.
- Certificados rejeitados devem conter uma justificativa ou observação.
- As horas aprovadas são somadas ao progresso total do aluno.
- O aluno pode acompanhar o status de cada certificado enviado.
- Os status principais são: **pendente**, **aprovado** e **rejeitado**.
- Usuários sem permissão não podem acessar áreas administrativas.
- Administradores podem gerenciar alunos, cursos, turmas e certificados.
- Superadministradores podem gerenciar administradores e acompanhar o sistema de forma mais ampla.
- O sistema pode enviar notificações quando houver mudança no status de um certificado.

Essas regras ajudam a manter o processo padronizado, transparente e confiável.

---

## 8. Histórias de Usuário / Casos de Uso

As histórias de usuário descrevem as funcionalidades do ponto de vista de quem utiliza o sistema.

### Histórias de Usuário

- Como aluno, quero acessar o sistema com meu e-mail e senha para enviar meus certificados.
- Como aluno, quero enviar um certificado em PDF para solicitar a validação das minhas horas complementares.
- Como aluno, quero acompanhar o status dos meus certificados para saber se foram aprovados, rejeitados ou se ainda estão pendentes.
- Como aluno, quero visualizar meu progresso de horas complementares para saber quanto já cumpri e quanto ainda falta.
- Como aluno, quero receber notificações quando houver atualização no status dos meus certificados.
- Como administrador, quero visualizar os certificados enviados pelos alunos para analisá-los.
- Como administrador, quero aprovar certificados e atribuir a quantidade de horas válidas.
- Como administrador, quero rejeitar certificados com uma justificativa para orientar o aluno.
- Como administrador, quero cadastrar alunos, cursos e turmas para manter as informações organizadas.
- Como superadministrador, quero gerenciar administradores para controlar quem pode validar certificados.

### Casos de Uso Principais

- Realizar login no sistema.
- Realizar primeiro acesso e definir senha.
- Recuperar senha.
- Enviar certificado.
- Consultar histórico de certificados.
- Acompanhar progresso de horas complementares.
- Visualizar certificados pendentes.
- Aprovar certificado.
- Rejeitar certificado.
- Cadastrar aluno.
- Cadastrar curso.
- Cadastrar turma.
- Gerenciar administradores.
- Enviar notificações sobre alterações de status.

---

## Encerramento do Pitch

O **SIGHC** centraliza a gestão de horas complementares em uma plataforma digital, reduzindo o trabalho manual, melhorando a comunicação entre alunos e administração e aumentando a transparência do processo.

Com o sistema, o aluno tem mais autonomia para acompanhar sua evolução acadêmica, enquanto a instituição ganha mais controle, organização e eficiência na validação dos certificados.

Em resumo, o SIGHC entrega uma solução prática, moderna e alinhada às necessidades acadêmicas da Faculdade Senac.
