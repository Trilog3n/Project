# Security Policy

## Supported Versions
Only the latest `main` branch is supported with security fixes.

## Reporting a Vulnerability
- Do not open public GitHub issues for security bugs.
- Report privately to project maintainers.
- Include reproduction steps, affected endpoints, and impact.

## Secret Management
- Never commit `.env` or credentials.
- Rotate compromised keys immediately.
- Use strong random values for `JWT_SECRET`.

## Baseline Hardening
- `helmet` enabled
- CORS restricted with `CORS_ORIGIN`
- Request validation with whitelist/forbid options
- Global throttling enabled
