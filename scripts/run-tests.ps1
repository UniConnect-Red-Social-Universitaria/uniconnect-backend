# ================================================================
# Script de Pruebas - UniConnect Backend (PowerShell)
# ================================================================
# Uso: .\scripts\run-tests.ps1 -Option <opción>
# 
# Opciones:
#   all          - Ejecutar todos los tests
#   watch        - Modo watch (re-ejecuta al cambiar archivos)
#   coverage     - Generar reporte de cobertura
#   integration  - Solo pruebas de integración
#   audit        - Ejecutar audit de seguridad
#   full         - Tests + Audit + Coverage
#   debug        - Debug mode
#
# Ejemplos:
#   .\scripts\run-tests.ps1 -Option all
#   .\scripts\run-tests.ps1 -Option coverage
#   .\scripts\run-tests.ps1 -Option watch
# ================================================================

param(
    [string]$Option = "all"
)

$ErrorActionPreference = "Stop"

# Colores para output
function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# Validar que npm esté instalado
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm no está instalado"
    exit 1
}

# Verificar que las dependencias estén instaladas
if (-not (Test-Path "node_modules")) {
    Write-Warning "node_modules no encontrado, instalando dependencias..."
    npm install
}

# Validar JWT_SECRET en .env (si existe)
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    if ($envContent -notmatch "JWT_SECRET") {
        Write-Warning "JWT_SECRET no configurado en .env"
    }
}

# Procesar opción
switch ($Option.ToLower()) {
    "all" {
        Write-Header "Ejecutando TODOS los tests"
        npm test
        Write-Success "Todos los tests completados"
    }
    
    "watch" {
        Write-Header "Iniciando modo WATCH"
        Write-Host "Presiona 'a' para correr todos los tests" -ForegroundColor Yellow
        Write-Host "Presiona 'q' para salir" -ForegroundColor Yellow
        npm run test:watch
    }
    
    "coverage" {
        Write-Header "Generando reporte de COBERTURA"
        npm run test:coverage
        Write-Host "Reporte generado en coverage/lcov-report/index.html" -ForegroundColor Green
        
        # Intentar abrir el reporte
        $reportPath = Join-Path (Get-Location) "coverage\lcov-report\index.html"
        if (Test-Path $reportPath) {
            try {
                Start-Process $reportPath
            }
            catch {
                Write-Host "Abre manualmente: $reportPath" -ForegroundColor Yellow
            }
        }
    }
    
    "integration" {
        Write-Header "Ejecutando pruebas de INTEGRACIÓN"
        npm test -- tests/integration/api.integration.test.ts
        Write-Success "Pruebas de integración completadas"
    }
    
    "audit" {
        Write-Header "Ejecutando AUDIT de npm"
        npm audit --force
        Write-Host "Para fixes automáticos: npm audit fix" -ForegroundColor Yellow
    }
    
    "full" {
        Write-Header "Ejecutando suite COMPLETA"
        
        Write-Header "1/3 Ejecutando tests..."
        npm test
        
        Write-Header "2/3 Ejecutando audit..."
        npm audit --force
        
        Write-Header "3/3 Generando cobertura..."
        npm run test:coverage
        
        Write-Success "Suite completa ejecutada"
    }
    
    "debug" {
        Write-Header "Iniciando tests en modo DEBUG"
        npm test -- --verbose --detectOpenHandles --runInBand
    }
    
    default {
        Write-Error "Opción desconocida: $Option"
        Write-Host "Opciones disponibles:" -ForegroundColor Yellow
        Write-Host "  all          - Ejecutar todos los tests"
        Write-Host "  watch        - Modo watch"
        Write-Host "  coverage     - Reporte de cobertura"
        Write-Host "  integration  - Solo tests de integración"
        Write-Host "  audit        - Audit de npm"
        Write-Host "  full         - Todo (tests + audit + coverage)"
        Write-Host "  debug        - Modo debug"
        exit 1
    }
}
