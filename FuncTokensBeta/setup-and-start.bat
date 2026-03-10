@echo off
REM ============================================
REM Setup & Start Server Script (Batch)
REM ============================================
REM Este script instala todas as dependencias 
REM e extensoes necessarias para o projeto
REM ============================================

color 0B
cls

echo.
echo ===========================================
echo   Configuração e Inicialização do Servidor
echo ===========================================
echo.

REM Verificar se estamos no diretório functions
cd ..
if not exist "functions" (
    echo Erro: Pasta 'functions' não encontrada!
    echo Execute este script a partir da pasta FuncTokensBeta
    pause
    exit /b 1
)

cd functions

if not exist "package.json" (
    echo Erro: package.json não encontrado!
    echo Por favor, execute este script a partir da pasta 'functions'
    pause
    exit /b 1
)

echo [*] Instalando dependências npm...
call npm install

if errorlevel 1 (
    color 0C
    echo Erro ao instalar dependências npm
    pause
    exit /b 1
)

color 0A
echo Dependências npm instaladas com sucesso
echo.

REM Verificar Firebase CLI
echo [*] Verificando Firebase CLI...
firebase --version >nul 2>&1

if errorlevel 1 (
    color 0E
    echo Firebase CLI não encontrado. Instalando globalmente...
    call npm install -g firebase-tools
    
    if errorlevel 1 (
        color 0C
        echo Erro ao instalar Firebase CLI
        pause
        exit /b 1
    )
    color 0A
    echo Firebase CLI instalado
) else (
    color 0A
    echo Firebase CLI já instalado
)

echo.

REM Verificar Node.js
echo [*] Verificando versão Node.js...
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo    Versão atual: %NODE_VERSION%
echo    Versão requerida: v24.x

echo.

REM Verificar firebase.json
echo [*] Verificando configuração Firebase...
if exist "..\firebase.json" (
    color 0A
    echo firebase.json encontrado
) else (
    color 0E
    echo Aviso: firebase.json não encontrado
)

echo.

REM Listar dependências
echo [*] Dependências instaladas:
call npm list --depth=0

echo.
color 0B
echo ===========================================
echo   Iniciando Servidor Firebase Emulator
echo ===========================================
echo.
color 0E
echo Dicas:
echo   - O emulador rodará em http://localhost:5000
echo   - Firestore Emulator: http://localhost:4000
echo   - Pressione Ctrl+C para parar o servidor
echo.

color 0A
REM Iniciar o servidor
call npm run serve

pause
