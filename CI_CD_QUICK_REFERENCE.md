# 🚀 CI/CD Quick Start Guide

## Summary

Tu CI/CD ahora tiene **4 workflows automáticos** que validan código, ejecutan tests y despliegan a Fly.io.

---

## 📊 Flujo Visual

```
┌─────────────────────────────────────────────────────────────┐
│ Developer                                                   │
│ $ git push origin feature/my-feature                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ GitHub PR Created (feature → develop)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────┬──────────────────────────────┐
│ PR Validation               │ CI - Tests & Build           │
│ ✓ Title format              │ ✓ Lint & Build               │
│ ✓ No conflicts              │ ✓ Unit Tests + Coverage      │
│ ✓ Description               │ ✓ Integration Tests          │
│ ✓ Size label                │ ⏱ ~20-30 min                 │
└──────────────────────────────┴──────────────────────────────┘
                            ↓
                    All Checks Pass ✅
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 1 Code Review Approved                                      │
│ (merge develop ← feature/my-feature)                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ GitHub PR Created (main ← develop)                          │
│ OR direct push to main (if hotfix)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────┬──────────────────────┬────────────────┐
│ Security & Quality   │ PR Validation        │ CI - Tests     │
│ ✓ npm audit          │ ✓ Title format       │ ✓ Build        │
│ ✓ Dependencies       │ ✓ No conflicts       │ ✓ All Tests    │
│ ✓ Code quality       │ ✓ Commit lint        │ ⏱ ~30 min      │
└──────────────────────┴──────────────────────┴────────────────┘
                            ↓
                    All Checks Pass ✅
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 1 Code Review Approved                                      │
│ Merge to main                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ CD - Deploy Triggered                                       │
│ ✓ Final Build                                               │
│ ✓ Pre-deploy Tests                                          │
│ ✓ Deploy a Fly.io                                           │
│ ✓ Verify Status                                             │
│ ⏱ ~35-40 min                                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    🎉 Live en Producción
```

---

## 🔧 Los 4 Workflows

| Workflow | Trigger | Propósito | Tiempo |
|----------|---------|----------|--------|
| **CI** | Push + PR | Tests, lint, build | 15-20 min |
| **CD** | Push a main | Deploy a Fly.io | 35-40 min |
| **Security** | Push + PR + Semanal | Audit + dependencies | 10-15 min |
| **PR Checks** | PR opened/sync | PR validation + size | 10 min |

---

## 📝 Cómo Usar

### Caso 1: Nuevo Feature
```bash
# 1. Crear rama
git checkout -b feature/auth-improvements develop

# 2. Hacer cambios
echo "console code" > src/my-feature.ts

# 3. Commit (sigue formato)
git add .
git commit -m "feat(auth): add jwt refresh token"

# 4. Push
git push origin feature/auth-improvements

# 5. Crear PR en GitHub
#    → CI valida automáticamente
#    → Se ve status en PR
```

### Caso 2: Mergear a Producción
```bash
# 1. PR de develop a main aprobado
# 2. Clickear "Merge Pull Request"
# 3. CD ejecuta automáticamente
# 4. Esperar ~40 min
# 5. App está en vivo ✅
```

### Caso 3: Hotfix en Producción
```bash
# 1. Crear rama desde main
git checkout -b hotfix/critical-bug main

# 2. Hacer fix rápido
git add .
git commit -m "fix(api): handle null request"

# 3. Push directo a main (o PR si es posible)
git push origin hotfix/critical-bug

# 4. CD ejecuta inmediatamente
# 5. Deploy en ~40 min
```

---

## ✅ Requisitos para Mergear a Main

- [ ] Todos los checks en verde (✅)
- [ ] 1 review aprobado
- [ ] Sin merge conflicts
- [ ] PR title sigue: `type(scope): description`
- [ ] PR tiene descripción
- [ ] No hay warnings de TypeScript

---

## 🔐 Secrets Configurados

✓ **FLY_API_TOKEN** - Ya debe estar en Settings > Secrets

Si no está:
1. Ir a https://fly.io/user/personal_access_tokens
2. Generar nuevo token
3. En GitHub: Settings > Secrets and variables > Actions
4. Crear secret `FLY_API_TOKEN` con el valor

---

## 📊 Ver Workflows

### En GitHub:
1. Repository > **Actions**
2. Seleccionar workflow (CI, CD, Security, etc)
3. Ver ejecuciones y logs

### Local (simulación):
```bash
# Simular CI
npm ci
npx prisma generate
npx tsc --noEmit
npm run build
npm test

# Simular deployment
npm run build  # Build must succeed
```

---

## 🆘 Si Algo Falla

### PR checks fallan
```bash
# Revisar localmente
npm ci
npm run build  # ¿Hay errors?
npm test       # ¿Fallan tests?
```

### Deploy falla
1. Ver logs en GitHub Actions (CD workflow)
2. Revisar que FLY_API_TOKEN es válido
3. Verificar recursos en https://fly.io

### Merge bloqueado
- Esperar a que terminen todos los checks (pueden tardar 20-30 min)
- Ver GitHub Actions para ver cual está en progreso

---

## 📚 Archivos de Referencia

- **CI_CD_DOCUMENTATION.md** - Documentación completa de cada workflow
- **BRANCH_PROTECTION_SETUP.md** - Cómo configurar protecciones en GitHub
- **.github/CODEOWNERS** - Quién revisa qué código

---

## 🎯 Best Practices

### Para PRs:
```
✅ DO:
- Titles en formato: "feat(module): description"
- Descripción clara de cambios
- Tests para nuevas features
- Rebasar contra main/develop antes de PR
- Commits pequeños y atómicos

❌ DON'T:
- Mergear sin que pasen todos los checks
- Largos PRs (>50 archivos)
- Commits sin mensaje descriptivo
- Forzar push (git push -f)
- Ignorar security warnings
```

### Para Deployment:
```
✅ DO:
- Mergear a develop primero (staging)
- Validar en staging antes de main
- Main es solo producción
- Revisar logs después de deploy

❌ DON'T:
- Push directo a main (usar PRs)
- Mergear sin reviews
- Ignorar test failures
- Deploy durante peak hours sin necesidad
```

---

## 🚀 Status Badges

Agregar a **README.md**:

```markdown
## CI/CD Status

[![CI - Tests & Build](https://github.com/OWNER/uniconnect-backend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/OWNER/uniconnect-backend/actions/workflows/ci.yml)
[![CD - Deploy](https://github.com/OWNER/uniconnect-backend/actions/workflows/fly-deploy.yml/badge.svg?branch=main)](https://github.com/OWNER/uniconnect-backend/actions/workflows/fly-deploy.yml)
[![Security & Quality](https://github.com/OWNER/uniconnect-backend/actions/workflows/security-quality.yml/badge.svg?branch=main)](https://github.com/OWNER/uniconnect-backend/actions/workflows/security-quality.yml)
```

*(Reemplazar OWNER con tu usuario)*

---

**Última actualización**: April 30, 2026  
**Soporte**: Ver CI_CD_DOCUMENTATION.md para más detalles
