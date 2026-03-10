# ============================================
# Setup & Start Server Script
# ============================================
# Este script instala todas as dependências 
# e extensões necessárias para o projeto
# ============================================

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Configuração e Inicialização do Servidor" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: package.json não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, execute este script a partir da pasta 'functions'" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Instalando dependências npm..." -ForegroundColor Green
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências npm" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependências npm instaladas com sucesso" -ForegroundColor Green
Write-Host ""

# Verificar e instalar Firebase CLI globalmente
Write-Host "🔥 Verificando Firebase CLI..." -ForegroundColor Green
firebase --version > $null 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "📥 Firebase CLI não encontrado. Instalando globalmente..." -ForegroundColor Yellow
    npm install -g firebase-tools
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar Firebase CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Firebase CLI instalado" -ForegroundColor Green
} else {
    Write-Host "✅ Firebase CLI já instalado" -ForegroundColor Green
}

Write-Host ""

# Verificar e instalar Node.js versão correta
Write-Host "⚙️  Verificando versão Node.js..." -ForegroundColor Green
$nodeVersion = node -v
Write-Host "   Versão atual: $nodeVersion" -ForegroundColor Cyan
Write-Host "   Versão requerida: v24.x" -ForegroundColor Cyan

Write-Host ""

# Verificar se Firebase está configurado
Write-Host "🔐 Verificando configuração Firebase..." -ForegroundColor Green
if (Test-Path "../firebase.json") {
    Write-Host "✅ firebase.json encontrado" -ForegroundColor Green
} else {
    Write-Host "⚠️  firebase.json não encontrado em nível superior" -ForegroundColor Yellow
    Write-Host "   Certifique-se de que está no diretório correto" -ForegroundColor Yellow
}

Write-Host ""

# Listar dependências instaladas
Write-Host "📋 Dependências instaladas:" -ForegroundColor Green
npm list --depth=0

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Servidor Firebase Emulator" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Dicas:" -ForegroundColor Yellow
Write-Host "   - O emulador rodará em http://localhost:5000" -ForegroundColor Cyan
Write-Host "   - Firestore Emulator: http://localhost:4000" -ForegroundColor Cyan
Write-Host "   - Pressione Ctrl+C para parar o servidor" -ForegroundColor Cyan
Write-Host ""

# Iniciar o servidor
npm run serve
