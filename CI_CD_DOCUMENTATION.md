# CI/CD Workflow Documentation - UniConnect Backend

## 📋 Overview

Este proyecto utiliza **GitHub Actions** para automatizar el flujo completo de desarrollo, testing y deployment. Se implementan 3 workflows independientes que trabajan en conjunto.

---

## 🔄 Workflows

### 1. **CI - Tests & Build** (`ci.yml`)
**Trigger:** 
- Push a `main` y `develop`
- Pull requests a `main` y `develop`

**Propósito:** Validar código, ejecutar tests y verificar compilación

**Etapas:**

#### 🔍 Lint & Build
```yaml
- Setup Node.js 20
- Instalar dependencias
- Generar Prisma Client
- Type checking (TypeScript)
- Build del proyecto
Timeout: 15 min
```

#### ✅ Unit Tests
```yaml
- Setup Node.js 20
- Instalar dependencias
- Generar Prisma Client
- Ejecutar tests con coverage
- Upload coverage a CodeCov
Timeout: 15 min
```

#### 🧪 Integration Tests
```yaml
- Setup Node.js 20
- Instalar dependencias
- Generar Prisma Client
- Ejecutar tests de integración
Timeout: 20 min
```

**Status Badge:** Requerido para mergear PRs

---

### 2. **CD - Deploy to Production** (`fly-deploy.yml`)
**Trigger:**
- Push a `main` (ejecuta directamente)
- Puede escuchar workflow de CI completado

**Propósito:** Desplegar a Fly.io en ambiente de producción

**Etapas:**

#### 🏗️ Build & Validation
```yaml
- Checkout código
- Setup Node.js 20
- Instalar dependencias
- Generar Prisma Client
- Type checking
- Build proyecto
- Ejecutar tests completos
Timeout: 30 min
```

#### 🚀 Deployment
```yaml
- Setup Flyctl
- Desplegar a Fly.io
- Verificar status
- Notificar resultado
Concurrency: Solo 1 deploy a la vez
```

**⚠️ Importante:** 
- El deploy SOLO ocurre si tests y build pasan
- Usa concurrency group para evitar deploys simultáneos
- Requiere `FLY_API_TOKEN` en secrets

---

### 3. **Security & Quality** (`security-quality.yml`)
**Trigger:**
- Push a `main` y `develop`
- Pull requests a `main` y `develop`
- Programado: Todos los domingos a las 2am UTC

**Propósito:** Auditoría de seguridad y análisis de calidad

**Etapas:**

#### 🔐 Security Audit
```yaml
- npm audit (level: moderate)
- Verificar vulnerabilidades
- Dry-run de npm audit fix
Timeout: 15 min
```

#### 📦 Dependency Check
```yaml
- Verificar paquetes outdated
- Mostrar actualizaciones disponibles
Timeout: 10 min
```

#### 📊 Code Quality
```yaml
- TypeScript compilation check
- Validar estructura del proyecto
- Pretty error reporting
Timeout: 15 min
```

---

## 🔐 Secrets Requeridos

Configurar en: `Settings > Secrets and variables > Actions`

### Producción (main branch):
```
FLY_API_TOKEN       - Token de API de Fly.io
                      Obtener en: https://fly.io/user/personal_access_tokens
```

---

## 📊 Flujo Completo

```
┌─ Pull Request abierto
│
├─ CI (ci.yml) ✅
│  ├─ Lint & Build
│  ├─ Unit Tests
│  └─ Integration Tests
│
├─ PR Review + CI Status Check
│
└─ Merge a main
   │
   └─ CD (fly-deploy.yml) 🚀
      ├─ Validación completa
      ├─ Tests pre-deployment
      └─ Deploy a Fly.io
```

---

## 🔄 Flujo de Desarrollo Recomendado

### Rama develop:
```bash
# Crear rama de feature
git checkout -b feature/mi-feature develop

# Hacer cambios
git add .
git commit -m "feat: descripción"

# Push
git push origin feature/mi-feature

# Crear PR a develop
# → CI valida automáticamente
```

### Merge a main (Producción):
```bash
# Una vez develop está estable y testeado
git checkout main
git pull
git merge develop
git push

# → CD ejecuta automáticamente
# → App se deploya a Fly.io
# → Se verifica el status
```

---

## 📈 Monitoreo

### Ver Workflows:
1. GitHub > Repository > Actions
2. Seleccionar el workflow deseado
3. Ver ejecuciones y logs

### Status Badges (README):
```markdown
[![CI - Tests & Build](https://github.com/USERNAME/REPO/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/USERNAME/REPO/actions/workflows/ci.yml)

[![CD - Deploy](https://github.com/USERNAME/REPO/actions/workflows/fly-deploy.yml/badge.svg?branch=main)](https://github.com/USERNAME/REPO/actions/workflows/fly-deploy.yml)

[![Security & Quality](https://github.com/USERNAME/REPO/actions/workflows/security-quality.yml/badge.svg?branch=main)](https://github.com/USERNAME/REPO/actions/workflows/security-quality.yml)
```

---

## 🛠️ Troubleshooting

### Deploy falla pero tests pasaron localmente
1. Revisar logs en: Actions > Workflow Run
2. Verificar dependencias: `npm ci` vs `npm install`
3. Ejecutar localmente: `npm ci && npm run build && npm test`

### CI falla en PRs pero funciona en local
1. Revisar versión de Node en workflow vs local
2. Verificar variables de ambiente en `.env`
3. Revisar cache de npm: Actions > Clear cache

### Security warnings
1. Ejecutar: `npm audit --audit-level=moderate`
2. Si es menor (low): ignora
3. Si es moderate+: ejecuta `npm audit fix` o actualiza paquete

### Deployment lento
1. Revisar log de `flyctl deploy`
2. Timeout por defecto: 30 min
3. Aumentar si es necesario

---

## ✅ Checklist Pre-Deployment

Antes de mergear a main:

- [ ] Todos los tests pasan: `npm test`
- [ ] Build compila sin errores: `npm run build`
- [ ] No hay warnings de TypeScript
- [ ] Code está formateado y limpio
- [ ] PR tiene descripción y context
- [ ] Al menos 1 review aprobado
- [ ] No hay conflictos con main
- [ ] Cambios en `.env` documentados
- [ ] Changelog actualizado (si aplica)

---

## 🚀 Quick Commands

```bash
# Simular CI localmente
npm ci
npx prisma generate
npx tsc --noEmit
npm run build
npm test

# Simular seguridad
npm audit --audit-level=moderate

# Ver estructura
ls -la src/
npm list --depth=0
```

---

## 📞 Support

Para issues con CI/CD:
1. Check logs en GitHub Actions
2. Revisar este documento
3. Consultar [Fly.io Docs](https://fly.io/docs/)
4. Issues en GitHub
