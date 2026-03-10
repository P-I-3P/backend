# 🚀 Setup & Start Scripts

## 📝 Descrição

Estes scripts automatizam a instalação de todas as dependências e iniciam o servidor Firebase emulador.

## 📂 Arquivos

### 1. **setup-and-start.ps1** (Windows - PowerShell)
Script PowerShell para Windows com todos os recursos de cores e verificações.

**Como usar:**
```powershell
# Abra PowerShell na pasta FuncTokensBeta e execute:
.\setup-and-start.ps1

# Se receber erro de permissão, execute:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup-and-start.ps1
```

### 2. **setup-and-start.sh** (Linux/Mac)
Script Bash para sistemas Unix/Linux/Mac.

**Como usar:**
```bash
# Dê permissão de execução
chmod +x setup-and-start.sh

# Execute o script
./setup-and-start.sh
```

### 3. **setup-and-start.bat** (Windows - Batch)
Script Batch para Windows (alternativa ao PowerShell).

**Como usar:**
```bash
# Simplesmente clique duas vezes no arquivo ou execute:
setup-and-start.bat
```

---

## ✨ O que o script faz

1. ✅ Verifica se está no diretório correto
2. ✅ Instala todas as dependências npm (`npm install`)
3. ✅ Instala Firebase CLI globalmente (se necessário)
4. ✅ Verifica versão Node.js
5. ✅ Verifica configuração Firebase
6. ✅ Lista dependências instaladas
7. ✅ Inicia o servidor Firebase emulador

---

## 🔧 Requisitos

- **Node.js v24.x** (verifica automaticamente)
- **npm** (incluso no Node.js)
- **Firebase CLI** (instala automaticamente se necessário)
- **internet** (para baixar dependências)

---

## 🌐 Endpoints Disponíveis Após Iniciar

- **API Principal:** http://localhost:5000
- **Firestore Emulator UI:** http://localhost:4000
- **Authentication Emulator:** http://localhost:9099
- **Functions Logs:** Mostrados no terminal

---

## ⚙️ Variáveis de Ambiente

Certifique-se de ter um arquivo `.env` na pasta `functions/` com:

```env
FIREBASE_PROJECT_ID=seu_projeto
FIREBASE_API_KEY=sua_chave
```

---

## 🛑 Para Parar o Servidor

Pressione **Ctrl + C** no terminal/PowerShell

---

## 🐛 Troubleshooting

### PowerShell: "Não é permitido executar scripts"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### npm: "Comando não encontrado"
- Reinstale Node.js de https://nodejs.org

### Firebase CLI: "Comando não encontrado"
```bash
npm install -g firebase-tools
```

### Porta 5000 já em uso
```bash
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000
```

---

**Desenvolvido para PI 3 - Backend - 2026**
