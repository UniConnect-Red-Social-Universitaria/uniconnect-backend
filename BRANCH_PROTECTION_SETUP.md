# GitHub Branch Protection Configuration

## Setup Instructions

### Para establecer Branch Protection Rules en GitHub:

1. Ir a: **Settings > Branches**
2. Seleccionar **"Add rule"** o editar rama **`main`**
3. Configurar según abajo:

---

## 📋 Configuración Recomendada para `main` (Producción)

### ✅ Require Pull Request Reviews
- **Require approvals**: 1
- **Require review from Code Owners**: ✓ (si tienes CODEOWNERS)
- **Dismiss stale pull request approvals when new commits are pushed**: ✓
- **Require approval of the most recent reviewable push**: ✓

### ✅ Require Status Checks to Pass
Habilitar (los workflows automáticamente crearán estos checks):
```
✓ CI - Tests & Build / Lint & Build
✓ CI - Tests & Build / Unit Tests
✓ CI - Tests & Build / Integration Tests
✓ Security & Quality / Security Audit
✓ Security & Quality / Code Quality Analysis
✓ PR - Validation & Checks / PR Validation
```

**Importante**: 
- ✓ Require branches to be up to date before merging
- ✓ Require conversations to be resolved before merging

### ✅ Require Code Owner Review
(Opcional, si tienes file-specific reviewers)
- Crear archivo `.github/CODEOWNERS`

### ✅ Restrict Who Can Push
- **Restrict who can push to matching branches**: ✓
  - Solo: Administrators, maintainers

### ✅ Require Deployments to Succeed
(Opcional, si usas deployment environments)

---

## 📋 Configuración Recomendada para `develop` (Staging)

### ✅ Require Pull Request Reviews
- **Require approvals**: 1

### ✅ Require Status Checks to Pass
```
✓ CI - Tests & Build / Unit Tests
✓ CI - Tests & Build / Integration Tests
```

**Importante**: 
- ✓ Require branches to be up to date before merging

### ✅ Allow Forced Pushes
- ❌ Deshabilitado (no permitir --force)

---

## 🔄 Configuración para Ramas de Feature

### Patrón: `feature/*`

Si quieres proteger también ramas feature:

### ✅ Require Status Checks
```
✓ CI - Tests & Build / Lint & Build
✓ CI - Tests & Build / Unit Tests
```

---

## 🛠️ Script de Configuración (Opcional)

Si quieres automatizar con GitHub CLI:

```bash
# Instalar GitHub CLI
# https://cli.github.com/

# Login
gh auth login

# Proteger main branch
gh api repos/{owner}/{repo}/branches/main/protection \
  -f required_pull_request_reviews='{"required_approving_review_count":1}' \
  -f required_status_checks='{"strict":true,"contexts":["CI - Tests & Build / Lint & Build","CI - Tests & Build / Unit Tests"]}' \
  -f enforce_admins=true \
  -f dismissal_restrictions='{"users":[],"teams":[]}' \
  -f allow_deletion_of_head_ref=false

# Verificar configuración
gh api repos/{owner}/{repo}/branches/main/protection
```

---

## 📝 CODEOWNERS Recomendado

Crear archivo `.github/CODEOWNERS`:

```
# Default owners for everything in the repo
*       @cristian-co @jackeline-rivera

# Database/Prisma changes
prisma/     @cristian-co
src/infrastructure/database/    @cristian-co

# Auth/Security
src/lib/auth.ts     @cristian-co
src/middleware/autenticacion.middleware.ts     @cristian-co

# Real-time/Sockets
src/lib/socket.ts   @jackeline-rivera
src/shared/eventos-observer/    @jackeline-rivera

# Tests
tests/  @cristian-co @jackeline-rivera
jest.config.cjs     @cristian-co
```

---

## ✅ Pre-Deployment Checklist

Antes de mergear a `main`, asegurate que:

- [ ] Todos los workflows pasen (green ✅)
- [ ] Al menos 1 review aprobado
- [ ] PR description completa y clara
- [ ] No hay merge conflicts
- [ ] Commits siguen conventional commits format
- [ ] Tests coverage >= 80% (recomendado)
- [ ] No hay warnings de TypeScript
- [ ] No hay vulnerabilidades críticas en npm audit

---

## 🚀 Flujo de Deployment

```
1. Developer crea rama y abre PR desde feature/* a develop
   ↓
2. GitHub Actions ejecuta todos los checks
   ↓
3. Si todos pasan → Puede mergear a develop (sin review requerido)
   ↓
4. En develop se hace staging/testing
   ↓
5. Cuando está listo → Abrir PR de develop a main
   ↓
6. Requiere 1 review + todos los checks
   ↓
7. Una vez aprobado → Merge a main (Fast-forward)
   ↓
8. GitHub Actions ejecuta CI + CD automáticamente
   ↓
9. Deploy a Fly.io sin confirmación manual
   ↓
10. ✅ Verificar deployment está vivo
```

---

## 🔐 Secrets Requeridos en GitHub

Settings > Secrets and variables > Actions

```
FLY_API_TOKEN       → Token de Fly.io (https://fly.io/user/personal_access_tokens)
```

---

## 📊 Monitoring

### Ver Status de Workflows:
1. Actions > Seleccionar workflow
2. Ver histórico de ejecuciones
3. Clickear en run para ver logs

### Badge Status (para README):

```markdown
## Status

[![CI - Tests & Build](https://github.com/TU_USERNAME/uniconnect-backend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/TU_USERNAME/uniconnect-backend/actions/workflows/ci.yml)

[![CD - Deploy](https://github.com/TU_USERNAME/uniconnect-backend/actions/workflows/fly-deploy.yml/badge.svg?branch=main)](https://github.com/TU_USERNAME/uniconnect-backend/actions/workflows/fly-deploy.yml)

[![Security & Quality](https://github.com/TU_USERNAME/uniconnect-backend/actions/workflows/security-quality.yml/badge.svg?branch=main)](https://github.com/TU_USERNAME/uniconnect-backend/actions/workflows/security-quality.yml)
```

Reemplazar `TU_USERNAME` con el owner del repo.

---

## 🆘 Troubleshooting

### El PR no se puede mergear porque faltan checks
→ Esperar a que terminen todos los workflows

### Un test falla en CI pero pasa localmente
→ Revisar diferencias de environment (NODE_ENV, variables de .env)
→ Asegurar que `.env.test` existe o está configurado

### Deployment falla pero tests pasaron
→ Ver logs en CD workflow
→ Verificar que FLY_API_TOKEN es válido
→ Revisar disponibilidad de recursos en Fly.io

### El merge está bloqueado por CODEOWNERS
→ Pedir review al usuario/equipo especificado en CODEOWNERS
→ O actualizar CODEOWNERS file según necesidad

---

## 📚 Resources

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Fly.io Documentation](https://fly.io/docs/)
