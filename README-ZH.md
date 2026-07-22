# Starcat 官网

<!-- starcat-promo:start -->
<div align="center">
<a href="https://starcat.ink"><img src="https://raw.githubusercontent.com/starcat-app/starcat-pro/main/banner.webp" width="100%" alt="Starcat" /></a>

<p><strong>这是 Starcat 的官方开源网站，包含 Direct 与 Mac App Store 落地页、产品博客、更新记录和公开法律页面。</strong></p>
<p>Starcat 是一款原生 macOS 应用，可以把 GitHub Stars 变成可搜索、可整理、可用 AI 理解的知识库。它支持 README 渲染、标签与私有笔记、Release 追踪、仓库健康度、AI 摘要、语义搜索、浏览器插件工作流，并提供多个可自部署 API。</p>

<a href="https://github.com/starcat-app/homebrew-starcat"><img src="https://img.shields.io/badge/Install%20with-Homebrew-FBBF24?style=for-the-badge&logo=homebrew&logoColor=white" width="220" alt="Install with Homebrew"/></a>
<br/>
<sub><a href="./README.md">English</a></sub>
</div>

<div align="center">
<a href="https://starcat.ink"><img src="https://img.shields.io/badge/website-starcat.ink-38BDF8?style=flat&color=blue" alt="website"/></a>
<a href="https://github.com/starcat-app/starcat-pro"><img src="https://img.shields.io/badge/support-starcat--pro-lightgrey.svg?style=flat&color=blue" alt="support"/></a>
<a href="https://github.com/starcat-app/homebrew-starcat"><img src="https://img.shields.io/badge/install-homebrew-lightgrey.svg?style=flat&color=blue" alt="homebrew"/></a>
<a href="https://github.com/starcat-app/starcat-localization"><img src="https://img.shields.io/badge/localization-open-lightgrey.svg?style=flat&color=blue" alt="localization"/></a>
</div>

<div align="center">
<img width="900" src="https://raw.githubusercontent.com/starcat-app/starcat-pro/main/main.webp" alt="Starcat 主窗口"/>
</div>

**首选 Homebrew 安装：**

```bash
brew tap starcat-app/starcat
brew trust starcat-app/starcat
brew install --cask starcat
```

**相关链接：**

- 官网与下载: https://starcat.ink
- 公开支持与发布说明: https://github.com/starcat-app/starcat-pro
- Starcat App Homebrew tap: https://github.com/starcat-app/homebrew-starcat
- CLI / MCP: [starcat-cli](https://github.com/starcat-app/starcat-cli) / [Homebrew tap](https://github.com/starcat-app/homebrew-starcat-cli)
- AI Agent Skill: https://github.com/starcat-app/starcat-skill
- 浏览器插件: [Chrome](https://github.com/starcat-app/starcat-chrome-plugin) / [Safari](https://github.com/starcat-app/starcat-safari-plugin)
- 官方文档: https://github.com/starcat-app/starcat-docs
- 官网源码: https://github.com/starcat-app/starcat-site
- 本地化: https://github.com/starcat-app/starcat-localization

**可自部署支撑 API：**

- [starcat-sharing-api](https://github.com/starcat-app/starcat-sharing-api)
- [starcat-trending-api](https://github.com/starcat-app/starcat-trending-api)
- [starcat-weekly-api](https://github.com/starcat-app/starcat-weekly-api)
- [starcat-wiki-api](https://github.com/starcat-app/starcat-wiki-api)
- [starcat-recommend-api](https://github.com/starcat-app/starcat-recommend-api)
- [starcat-discovery-api](https://github.com/starcat-app/starcat-discovery-api)
<!-- starcat-promo:end -->

## 关于本仓库

这个仓库维护 Starcat Direct 和 Mac App Store 两个分发渠道使用的公开网站源码，并与私有的 macOS 应用仓库保持独立。

公开内容包括产品页面、截图、更新记录、法律文档、Markdown 博客、Sparkle 更新元数据和 Apple App Site Association 文件。本地凭据、Nginx 服务端配置、下载产物和私有环境文件统一由 `.gitignore` 排除。

## 仓库结构

| 路径 | 用途 |
|---|---|
| `direct/` | `starcat.ink` 的 Direct 正式官网，包含博客、更新记录、隐私政策、用户协议、截图、AASA 和 Sparkle appcast。 |
| `direct-test/` | 用于正式变更前验证 Direct 购买与下载体验的测试落地页。 |
| `appstore/` | 符合 App Store 合规边界的落地页、支持页、隐私政策和用户协议，以及 Cloudflare Pages 路由 Worker。 |
| `_local-admin/` | 仅限本地使用的管理界面源码；真实 `config.js` 已忽略，严禁提交。 |

## 本地预览

通过 HTTP 启动静态页面，确保博客 Markdown 等浏览器 `fetch` 请求可以正常工作：

```bash
python3 -m http.server 8765 --directory direct
python3 -m http.server 8766 --directory appstore
python3 -m http.server 8767 --directory direct-test
```

然后打开 `http://127.0.0.1:8765`、`http://127.0.0.1:8766` 或 `http://127.0.0.1:8767`。

博客写作规范见 [`direct/blog/README.md`](./direct/blog/README.md)。

## 内容与发布边界

- 公开含义发生变化时，中英文页面必须同步修改。
- `direct/appcast.xml` 是公开发布元数据，严禁加入签名私钥或发布凭据。
- `direct/generate-changelog.py` 默认从同级 `starcat-pro` 仓库读取双语公开 Changelog；独立目录布局可通过 `STARCAT_PRO_ROOT` 显式指定。
- 部署脚本依赖维护者本地凭据；Pull Request 不得部署生产或测试环境。
- Nginx 配置仅保留在本地，不进入本仓库版本控制。

## 贡献与安全

欢迎提交范围明确的文案、无障碍、本地化、SEO 元数据、静态资源和页面行为改进。提交 Pull Request 前请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)，安全问题请按 [SECURITY.md](./SECURITY.md) 的私密渠道报告。

Starcat 应用问题、订阅、下载或产品支持请前往 [starcat-pro](https://github.com/starcat-app/starcat-pro/issues)。

## 许可证

Starcat Site 使用 [MIT License](./LICENSE)。仓库内 vendored 的第三方软件见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
