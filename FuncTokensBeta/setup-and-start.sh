#!/bin/bash

# ============================================
# Setup & Start Server Script (Linux/Mac)
# ============================================
# Este script instala todas as dependências 
# e extensões necessárias para o projeto
# ============================================

echo -e "\033[36m==========================================\033[0m"
echo -e "\033[36m  Configuração e Inicialização do Servidor\033[0m"
echo -e "\033[36m==========================================\033[0m"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "\033[31m❌ Erro: package.json não encontrado!\033[0m"
    echo "Por favor, execute este script a partir da pasta 'functions'"
    exit 1
fi

echo -e "\033[32m📦 Instalando dependências npm...\033[0m"
npm install

if [ $? -ne 0 ]; then
    echo -e "\033[31m❌ Erro ao instalar dependências npm\033[0m"
    exit 1
fi

echo -e "\033[32m✅ Dependências npm instaladas com sucesso\033[0m"
echo ""

# Verificar e instalar Firebase CLI globalmente
echo -e "\033[32m🔥 Verificando Firebase CLI...\033[0m"
firebase --version > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "\033[33m📥 Firebase CLI não encontrado. Instalando globalmente...\033[0m"
    npm install -g firebase-tools
    
    if [ $? -ne 0 ]; then
        echo -e "\033[31m❌ Erro ao instalar Firebase CLI\033[0m"
        exit 1
    fi
    echo -e "\033[32m✅ Firebase CLI instalado\033[0m"
else
    echo -e "\033[32m✅ Firebase CLI já instalado\033[0m"
fi

echo ""

# Verificar versão Node.js
echo -e "\033[32m⚙️  Verificando versão Node.js...\033[0m"
node_version=$(node -v)
echo -e "   Versão atual: $node_version"
echo -e "   Versão requerida: v24.x"

echo ""

# Verificar se Firebase está configurado
echo -e "\033[32m🔐 Verificando configuração Firebase...\033[0m"
if [ -f "../firebase.json" ]; then
    echo -e "\033[32m✅ firebase.json encontrado\033[0m"
else
    echo -e "\033[33m⚠️  firebase.json não encontrado em nível superior\033[0m"
    echo -e "   Certifique-se de que está no diretório correto"
fi

echo ""

# Listar dependências instaladas
echo -e "\033[32m📋 Dependências instaladas:\033[0m"
npm list --depth=0

echo ""
echo -e "\033[36m==========================================\033[0m"
echo -e "\033[36m  Iniciando Servidor Firebase Emulator\033[0m"
echo -e "\033[36m==========================================\033[0m"
echo ""
echo -e "\033[33m💡 Dicas:\033[0m"
echo -e "   - O emulador rodará em http://localhost:5000"
echo -e "   - Firestore Emulator: http://localhost:4000"
echo -e "   - Pressione Ctrl+C para parar o servidor"
echo ""

# Iniciar o servidor
npm run serve
