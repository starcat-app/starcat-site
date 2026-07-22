# Security Policy

## Reporting a Vulnerability

Report website injection, cross-site scripting, unsafe redirects, compromised download or update links, malicious public assets, Cloudflare Worker routing problems, or accidental exposure of local administration data through [GitHub Security Advisories](https://github.com/starcat-app/starcat-site/security/advisories/new).

Do not include credentials, tokens, private configuration, customer information, or active exploit details in public issues. If a report concerns the Starcat application or a support API rather than this website, report it to the repository that owns the affected code when known.

## Supported Surfaces

Security fixes target the current default branch and the public surfaces maintained from it, including `starcat.ink` and the Starcat pages under `dong4j.app`. Local deployment credentials, Nginx configuration, and the real `_local-admin/config.js` are intentionally excluded from version control.
