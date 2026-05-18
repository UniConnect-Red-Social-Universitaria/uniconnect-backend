# 🆘 CI/CD Troubleshooting Guide

## Common Issues & Solutions

---

## 🔴 CI Tests Failing

### Problem: "npm ci fails"
```
Error: npm ERR! code ERESOLVE
       npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution:**
```bash
# 1. Local test
npm ci

# 2. If fails, check Node version
node --version  # Should be 20.x

# 3. Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json

# 4. Reinstall
npm install

# 5. If still fails, check package.json for conflicts
npm ls  # Shows dependency tree
```

---

### Problem: "Tests fail on CI but pass locally"
```
FAIL tests/endpoints/api.endpoints.test.ts
  ✕ should connect to server
```

**Solutions:**
1. **Check Node version**
   ```bash
   # CI uses: node:20-alpine
   node --version  # Your local must be 20.x
   ```

2. **Check environment variables**
   ```bash
   # Make sure .env is not checked in
   git status | grep .env  # Should be empty
   
   # Tests should use .env.test or no real env vars
   ```

3. **Check database connection**
   ```bash
   # If using MongoDB
   echo $DATABASE_URL
   # Should work or test should mock it
   ```

4. **Run same as CI**
   ```bash
   npm ci
   npx prisma generate
   npm test
   ```

---

### Problem: "Type checking fails: Cannot find module"
```
error TS7016: Could not find a declaration file for module '@types/express'
```

**Solution:**
```bash
# 1. Check tsconfig.json
cat tsconfig.json | grep strict

# 2. Install missing types
npm install --save-dev @types/express @types/node

# 3. Verify
npx tsc --noEmit
```

---

## 🟡 PR Validation Failing

### Problem: "PR Title Invalid"
```
❌ PR title must follow format: type(scope): description
```

**Solution:**
Valid formats:
```
✅ feat(auth): add login endpoint
✅ fix(db): resolve connection issue
✅ docs: update README
✅ refactor(socket): improve event handling
✅ test(messages): add unit tests
✅ chore(deps): update dependencies
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

---

### Problem: "Merge Conflicts Detected"
```
⚠️ Merge conflicts detected!
Please resolve conflicts by rebasing
```

**Solution:**
```bash
# 1. Fetch latest
git fetch origin

# 2. Rebase against main/develop
git rebase origin/develop

# 3. If conflicts, resolve them
git status  # See conflicting files
# Edit files and resolve >>><<< markers

# 4. Continue rebase
git rebase --continue

# 5. Force push (only on your branch!)
git push origin feature/my-feature --force-with-lease
```

---

## 🔴 Deployment Failing

### Problem: "CD Deployment Failed - Tests Failed"
```
FAIL tests/integration/api.integration.test.ts
  ✕ Database connection timeout
```

**Solution:**
1. Same as CI troubleshooting above
2. Ensure all tests pass locally
3. Check environment variables in Fly.io

---

### Problem: "FLY_API_TOKEN invalid or missing"
```
Error: FLY_API_TOKEN not found in environment
```

**Solution:**
1. **Verify secret exists**
   ```
   GitHub > Settings > Secrets and variables > Actions
   Look for: FLY_API_TOKEN
   ```

2. **If missing, create it**
   ```
   1. Go to https://fly.io/user/personal_access_tokens
   2. Create new token
   3. Copy token
   4. GitHub > Settings > Secrets > Actions > New repository secret
   5. Name: FLY_API_TOKEN
   6. Value: (paste token)
   7. Save
   ```

3. **If token expired**
   ```
   1. Regenerate token in https://fly.io/user/personal_access_tokens
   2. Update GitHub secret with new value
   ```

---

### Problem: "Fly.io deployment succeeded but app not responding"
```
Deployment successful but 502 Bad Gateway
```

**Solution:**
1. **Check Fly.io app status**
   ```bash
   flyctl status
   flyctl logs --app your-app-name
   ```

2. **Common causes**
   - Port not matching `PORT` env var (check Dockerfile)
   - Missing environment variables
   - Database connection timeout
   - OOM (out of memory)

3. **Check Fly configuration**
   ```bash
   # Verify fly.toml
   cat fly.toml | grep port
   cat fly.toml | grep env
   ```

4. **Fix and redeploy**
   ```bash
   # Update env var if needed
   flyctl secrets set PORT=3000
   flyctl secrets set DATABASE_URL=...
   
   # Redeploy
   flyctl deploy
   ```

---

### Problem: "Deployment timeout after 30 minutes"
```
error: Workflow timeout reached (30 minutes)
```

**Solution:**
1. **Check what's slow**
   - Dependency installation
   - Build process
   - Tests taking too long

2. **Optimize**
   ```bash
   # Clear npm cache in workflow (add to yaml)
   npm cache clean --force
   
   # Or increase timeout in workflow
   timeout-minutes: 45  # Increase from 30
   ```

3. **If build is slow**
   ```bash
   # Analyze build
   time npm run build
   
   # Check what's taking time
   npx tsc --listFilesOnly > /dev/null
   ```

---

## 🟢 Workflow Stuck

### Problem: "Workflow never completes"
```
⏳ Running for 2 hours...
```

**Solution:**
1. **Cancel workflow**
   ```
   GitHub > Actions > Click running workflow > Cancel
   ```

2. **Check for waiting**
   ```bash
   # See if it's waiting for external service
   # (DB connection, API call, etc)
   ```

3. **Check logs for hangs**
   ```
   GitHub > Actions > Workflow run > Click job > See logs
   Look for lines that don't progress for >5 min
   ```

4. **Common causes**
   - Database connection stuck
   - API call timeout
   - Infinite loop
   - Process not exiting

---

### Problem: "Concurrency lock - deployment blocked"
```
Waiting for other deployments to finish...
```

**This is normal!** Means previous deploy is still running.

**Solution:**
1. **Check previous deployment**
   ```
   GitHub > Actions > CD workflow > See running deployments
   ```

2. **Wait for it to finish** (can take 40+ min)

3. **If stuck, cancel manually**
   ```
   GitHub > Actions > Click deployment job > Cancel
   Wait 5 min
   Retry push or manually trigger workflow
   ```

---

## 📊 Monitoring & Debugging

### View Full Logs
```
GitHub > Actions > Select Workflow > Click Run > Click Job > See logs
```

### Common Log Patterns

**Success:**
```
✅ Task completed in X seconds
Successfully deployed to Fly.io
✅ Deployment verification passed
```

**Warning:**
```
⚠️  npm audit found moderate vulnerabilities
⚠️  This PR has many file changes (>50)
```

**Error:**
```
❌ Error: Cannot find module
error TS2307: Cannot find module
FAIL tests/...
```

---

## 🔧 Quick Fixes

### Fix: "Cannot find module X"
```bash
npm install @types/express  # or whatever is missing
npm ci
npx tsc --noEmit
```

### Fix: "Jest not finding files"
```bash
# Verify jest.config.cjs
npm test -- --listTests  # See what jest finds

# Or run specific test
npm test -- tests/integration/api.integration.test.ts
```

### Fix: "Prisma not generating"
```bash
npx prisma generate
npx prisma db push  # Update schema
npx prisma format  # Format schema.prisma
```

### Fix: "TypeScript errors after dependency update"
```bash
npm ls  # Check versions
npm update  # Update everything
npm test
```

---

## 💡 Prevention Tips

1. **Test locally before push**
   ```bash
   npm ci && npm run build && npm test
   ```

2. **Check TypeScript**
   ```bash
   npx tsc --noEmit
   ```

3. **Validate security**
   ```bash
   npm audit --audit-level=moderate
   ```

4. **Review PR before merge**
   - Read description
   - Check all checks are green
   - Verify no conflicts

5. **Monitor deployments**
   - Stay in Actions tab during deployment
   - Watch for errors
   - Verify app is live after

---

## 📞 Getting Help

1. **Check logs** - Most info is in GitHub Actions logs
2. **Read docs** - CI_CD_DOCUMENTATION.md has most answers
3. **Local reproduction** - Test commands locally first
4. **Check secrets** - FLY_API_TOKEN is common issue
5. **Verify configuration** - fly.toml, .env, tsconfig.json

---

## 🚨 Emergency Fixes

### If Production is Broken

```bash
# 1. Check what's deployed
flyctl status
flyctl logs -n 100

# 2. Identify issue
# Database? Code? Configuration?

# 3. Quick hotfix
git checkout -b hotfix/critical-issue main
# Make minimal fix
git add .
git commit -m "fix: critical production issue"
git push origin hotfix/critical-issue

# 4. Create PR immediately
# Reviews can happen after for hotfix

# 5. Deploy
# Merge to main → CD runs → Live in ~40 min
```

---

**Last Updated**: April 30, 2026  
**For more details**: See CI_CD_DOCUMENTATION.md
