# Contributing

## Branch Strategy
- `main`: protected production branch
- feature branches: `feat/<short-name>`
- bugfix branches: `fix/<short-name>`

## Development Flow
1. Fork or create a branch from `main`.
2. Make focused changes.
3. Run local checks:

```bash
cd api && npm run build
cd ../web && npm run build
```

4. Open a pull request with:
- clear title
- problem statement
- test evidence (logs/screenshots)

## Commit Convention
Use conventional commits:
- `feat: add vendor filtering`
- `fix: handle expired refresh token`
- `chore: update ci workflow`

## Pull Request Checklist
- [ ] No secrets in diff
- [ ] Build passes for API and Web
- [ ] Env changes reflected in `.env.example`
- [ ] Backward compatibility considered
