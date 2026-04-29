#!/bin/bash

# ================================================================
# Script de Pruebas - UniConnect Backend
# ================================================================
# Uso: ./scripts/run-tests.sh [opción]
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
#   ./scripts/run-tests.sh all
#   ./scripts/run-tests.sh coverage
#   ./scripts/run-tests.sh watch
# ================================================================

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función de printing
print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Validar que npm esté instalado
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    print_warning "node_modules no encontrado, instalando dependencias..."
    npm install
fi

# Validar JWT_SECRET en .env (si existe)
if [ -f ".env" ]; then
    if ! grep -q "JWT_SECRET" .env; then
        print_warning "JWT_SECRET no configurado en .env"
    fi
fi

# Opción por defecto
OPTION=${1:-all}

case $OPTION in
    all)
        print_header "Ejecutando TODOS los tests"
        npm test
        print_success "Todos los tests completados"
        ;;
    
    watch)
        print_header "Iniciando modo WATCH"
        echo -e "${YELLOW}Presiona 'a' para correr todos los tests${NC}"
        echo -e "${YELLOW}Presiona 'q' para salir${NC}"
        npm run test:watch
        ;;
    
    coverage)
        print_header "Generando reporte de COBERTURA"
        npm run test:coverage
        echo -e "${GREEN}Reporte generado en coverage/lcov-report/index.html${NC}"
        
        # Intentar abrir el reporte
        if command -v open &> /dev/null; then
            open coverage/lcov-report/index.html
        elif command -v xdg-open &> /dev/null; then
            xdg-open coverage/lcov-report/index.html
        elif command -v start &> /dev/null; then
            start coverage/lcov-report/index.html
        else
            echo -e "${YELLOW}Abre manualmente: coverage/lcov-report/index.html${NC}"
        fi
        ;;
    
    integration)
        print_header "Ejecutando pruebas de INTEGRACIÓN"
        npm test -- tests/integration/api.integration.test.ts
        print_success "Pruebas de integración completadas"
        ;;
    
    audit)
        print_header "Ejecutando AUDIT de npm"
        npm audit || true
        echo -e "${YELLOW}Para fixes automáticos: npm audit fix${NC}"
        ;;
    
    full)
        print_header "Ejecutando suite COMPLETA"
        
        print_header "1/3 Ejecutando tests..."
        npm test
        
        print_header "2/3 Ejecutando audit..."
        npm audit || true
        
        print_header "3/3 Generando cobertura..."
        npm run test:coverage
        
        print_success "Suite completa ejecutada"
        ;;
    
    debug)
        print_header "Iniciando tests en modo DEBUG"
        npm test -- --verbose --detectOpenHandles --runInBand
        ;;
    
    *)
        print_error "Opción desconocida: $OPTION"
        echo -e "${YELLOW}Opciones disponibles:${NC}"
        echo "  all          - Ejecutar todos los tests"
        echo "  watch        - Modo watch"
        echo "  coverage     - Reporte de cobertura"
        echo "  integration  - Solo tests de integración"
        echo "  audit        - Audit de npm"
        echo "  full         - Todo (tests + audit + coverage)"
        echo "  debug        - Modo debug"
        exit 1
        ;;
esac
