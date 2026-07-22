# Starcat Site

<!-- starcat-promo:start -->
<div align="center">
<a href="https://starcat.ink"><img src="https://raw.githubusercontent.com/starcat-app/starcat-pro/main/banner.webp" width="100%" alt="Starcat" /></a>

<p><strong>Official open-source website for Starcat, including Direct and Mac App Store landing pages, the product blog, release notes, and public legal pages.</strong></p>
<p>Starcat is a native macOS app that turns GitHub Stars into a searchable, organized and AI-assisted knowledge base. It supports README rendering, tags, private notes, release tracking, repository health signals, AI summaries, semantic search, browser plugin workflows and self-hostable support APIs.</p>

<a href="https://github.com/starcat-app/homebrew-starcat"><img src="https://img.shields.io/badge/Install%20with-Homebrew-FBBF24?style=for-the-badge&logo=homebrew&logoColor=white" width="220" alt="Install with Homebrew"/></a>
<br/>
<sub><a href="./README-ZH.md">中文说明</a></sub>
</div>

<div align="center">
<a href="https://starcat.ink"><img src="https://img.shields.io/badge/website-starcat.ink-38BDF8?style=flat&color=blue" alt="website"/></a>
<a href="https://github.com/starcat-app/starcat-pro"><img src="https://img.shields.io/badge/support-starcat--pro-lightgrey.svg?style=flat&color=blue" alt="support"/></a>
<a href="https://github.com/starcat-app/homebrew-starcat"><img src="https://img.shields.io/badge/install-homebrew-lightgrey.svg?style=flat&color=blue" alt="homebrew"/></a>
<a href="https://github.com/starcat-app/starcat-localization"><img src="https://img.shields.io/badge/localization-open-lightgrey.svg?style=flat&color=blue" alt="localization"/></a>
</div>

<div align="center">
<img width="900" src="https://raw.githubusercontent.com/starcat-app/starcat-pro/main/main.webp" alt="Starcat main window"/>
</div>

**Preferred install method:**

```bash
brew tap starcat-app/starcat
brew trust starcat-app/starcat
brew install --cask starcat
```

**Useful links:**

- Home and downloads: https://starcat.ink
- Public support and release notes: https://github.com/starcat-app/starcat-pro
- Starcat App Homebrew tap: https://github.com/starcat-app/homebrew-starcat
- CLI / MCP: [starcat-cli](https://github.com/starcat-app/starcat-cli) / [Homebrew tap](https://github.com/starcat-app/homebrew-starcat-cli)
- AI Agent Skill: https://github.com/starcat-app/starcat-skill
- Browser plugins: [Chrome](https://github.com/starcat-app/starcat-chrome-plugin) / [Safari](https://github.com/starcat-app/starcat-safari-plugin)
- Localization: https://github.com/starcat-app/starcat-localization

**Self-hostable support APIs:**

- [starcat-sharing-api](https://github.com/starcat-app/starcat-sharing-api)
- [starcat-trending-api](https://github.com/starcat-app/starcat-trending-api)
- [starcat-weekly-api](https://github.com/starcat-app/starcat-weekly-api)
- [starcat-wiki-api](https://github.com/starcat-app/starcat-wiki-api)
- [starcat-recommend-api](https://github.com/starcat-app/starcat-recommend-api)
- [starcat-discovery-api](https://github.com/starcat-app/starcat-discovery-api)
<!-- starcat-promo:end -->

## About This Repository

This repository contains the public website source used by Starcat's Direct and Mac App Store distribution channels. It is intentionally separate from the private macOS application repository.

The public site contains product pages, screenshots, release notes, legal documents, a Markdown-powered blog, Sparkle update metadata, and the Apple App Site Association file. Local credentials, Nginx server configuration, downloaded release artifacts, and private environment files are excluded by `.gitignore`.

## Repository Structure

| Path | Purpose |
|---|---|
| `direct/` | Production Direct website for `starcat.ink`, including the blog, changelog, privacy policy, EULA, screenshots, AASA, and Sparkle appcast. |
| `direct-test/` | Test landing pages used to verify the Direct purchase and download experience before production changes. |
| `appstore/` | App Store-compliant landing, support, privacy, and EULA pages, plus the Cloudflare Pages routing worker. |
| `_local-admin/` | Local-only administration UI source. The real `config.js` is ignored and must never be committed. |

## Local Preview

Serve each static surface over HTTP so browser `fetch` calls, including blog Markdown loading, work correctly:

```bash
python3 -m http.server 8765 --directory direct
python3 -m http.server 8766 --directory appstore
python3 -m http.server 8767 --directory direct-test
```

Then open `http://127.0.0.1:8765`, `http://127.0.0.1:8766`, or `http://127.0.0.1:8767`.

For blog authoring details, see [`direct/blog/README.md`](./direct/blog/README.md).

## Content and Release Boundaries

- Keep English and Simplified Chinese pages synchronized when public meaning changes.
- Treat `direct/appcast.xml` as public release metadata; never add signing keys or release credentials.
- `direct/generate-changelog.py` reads the paired public changelog files from `starcat-pro` when the expected Starcat workspace layout is available.
- Deployment scripts require maintainer-owned local credentials. Pull requests must not deploy production or test environments.
- Nginx configuration remains local-only and is intentionally not tracked in this repository.

## Contributing and Security

Focused fixes to copy, accessibility, localization, SEO metadata, static assets, and site behavior are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request and report vulnerabilities through the private process in [SECURITY.md](./SECURITY.md).

For Starcat application bugs, subscriptions, downloads, or product support, use [starcat-pro](https://github.com/starcat-app/starcat-pro/issues).

## License

Starcat Site is available under the [MIT License](./LICENSE). Vendored third-party software is documented in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
