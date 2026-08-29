# AGENTS.md

本文档是 `starcat-site` 的 AI 协作规则唯一维护源。

## 仓库边界

- 本目录是 Starcat 官网源码的独立 Git 仓库，维护公开静态页面、博客、更新记录、
  法律页面、Sparkle 元数据和 App Store 站点 Worker，不包含 macOS 应用源码。
- 本仓库拥有独立分支、remote、提交和部署边界；不得把改动并入外层 Starcat 主仓库
  或顺带修改相邻 `supports/*` 项目。
- 开工前核对 `git status --short` 与当前分支，保留用户已有改动；未经明确要求不
  commit、push、切分支或修改 remote。

## 用途、技术栈与目录

- 站点以静态 HTML/CSS/JavaScript 为主；Direct 博客使用 Markdown 与 Node.js 生成器，
  Changelog 使用 Python 生成；App Store 站点包含 Cloudflare Pages/Worker 配置。
- `direct/` 是 `starcat.ink` Direct 正式站，含中英文首页、博客、Changelog、法律页面、
  AASA 与 `appcast.xml`。
- `direct-test/` 是 Direct 购买和下载流程测试站；`appstore/` 是 App Store 合规站点；
  `_local-admin/` 是待新控制台完全验收后移除的本机旧工具，不再扩展新能力。
- Changelog 公开内容来自相邻 `starcat-pro` 的双语 Changelog；不要在生成结果中手工
  制造与来源不一致的版本事实。

## 多站点语义同步

- 产品名称、已上线功能、系统要求、版本号、下载与支持链接等公共事实变化时，必须检查
  `direct/`、`direct-test/`、`appstore/` 以及各自中英文页面并保持语义一致。
- 渠道特定内容不能机械复制：Direct 的 DMG、Homebrew、Sparkle 与购买语义不得混入
  App Store 合规页面；测试站必须保持测试环境标识，不能伪装成正式站。
- 修改英文内容时检查对应中文页面，反之亦然；导航、SEO、结构化数据、法律链接和可访问性
  文本也属于同步范围。
- `direct/appcast.xml`、AASA、价格、下载 URL、隐私政策和用户协议都是公开契约，未经
  明确需求不得顺手修改。

## 本地验证

```bash
git diff --check
node --test _local-admin/awesome-operations.test.mjs
node direct/blog/verify-blog.mjs
python3 -m py_compile direct/generate-changelog.py
bash -n direct/deploy.sh direct-test/deploy.sh appstore/deploy.sh
```

按实际改动选择相关检查，并通过 `python3 -m http.server --directory <site-dir>` 本地预览；
不得用真实部署代替本地验收。Changelog 与博客生成器会改写产物，只有任务明确要求同步
生成结果时才能运行生成命令并审查完整 diff。

## 部署与外部副作用禁令

- 禁止 Agent 擅自执行任何 `deploy.sh`，包括 `direct/deploy.sh`、
  `direct-test/deploy.sh`、`appstore/deploy.sh` 及其 `--dry-run` 模式。
- 未经 dong4j 针对目标环境明确授权，不得执行 rsync/SSH、Nginx 重载、Wrangler、
  Cloudflare Pages/Worker 发布、生产上传、域名或远程文件修改，也不得 push。
- 不得提交 Nginx 私有配置、Token、SSH key、下载产物、真实 `_local-admin/config.js`
  或其他本地环境文件。
