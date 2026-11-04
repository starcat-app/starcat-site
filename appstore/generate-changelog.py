#!/usr/bin/env python3
"""
将同目录下的 CHANGELOG.md 与 CHANGELOG-ZH.md（App Store 渠道更新日志）转换为
App Store 落地站的更新日志页。视觉令牌与 appstore/index.html 一致（系统字体、
#090B10 深色底、#7DD3FC 主色）；生成逻辑与 direct/generate-changelog.py 同构，
Markdown 转换子集保持一致，避免两站正文渲染漂移。
用法: python3 generate-changelog.py
"""

import re
import sys
from pathlib import Path

# App Store 渠道 changelog 自 2026-11 起随站点同仓维护（#202 迁移），
# 来源为主仓库原 App Store 双语日志，不再读取主仓库根目录。
SCRIPT_DIR = Path(__file__).resolve().parent
CHANGELOG_PAGES = [
    {
        "source": SCRIPT_DIR / "CHANGELOG.md",
        "target": SCRIPT_DIR / "changelog.html",
        "lang": "en",
        "description": "Starcat for GitHub — App Store release notes and product updates",
        "title": "What's New · Starcat",
        "home_href": "./index.html",
        "privacy_href": "./privacy.html",
        "eula_href": "./eula.html",
        "current_href": "./changelog.html",
        "nav_label": "Navigation",
        "home_label": "Home",
        "privacy_label": "Privacy",
        "eula_label": "EULA",
        "changelog_label": "What's New",
        "hero_eyebrow": "App Store Release Notes",
        "hero_title": "What's New",
        "contact_label": "Contact",
    },
    {
        "source": SCRIPT_DIR / "CHANGELOG-ZH.md",
        "target": SCRIPT_DIR / "changelog-zh.html",
        "lang": "zh-Hans",
        "description": "Starcat App Store 版更新日志 — 版本更新记录",
        "title": "更新记录 · Starcat",
        "home_href": "./index.html",
        "privacy_href": "./privacy.html",
        "eula_href": "./eula.html",
        "current_href": "./changelog-zh.html",
        "nav_label": "导航",
        "home_label": "首页",
        "privacy_label": "隐私",
        "eula_label": "EULA",
        "changelog_label": "更新记录",
        "hero_eyebrow": "App Store 版本记录",
        "hero_title": "更新记录",
        "contact_label": "联系我们",
    },
]

PENDING_VERSION_HEADING = re.compile(r"^##\s+.+-待发布\s*$", re.MULTILINE)

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="{lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{description}">
    <meta name="robots" content="index, follow">
    <title>{title}</title>
    <link rel="icon" type="image/png" href="/starcat/starcat-logo.png">

    <style>
        :root {{
            --color-bg:         #090B10;
            --color-bg-elevated:#141821;
            --color-bg-glass:   rgba(255, 255, 255, 0.055);
            --color-border:     rgba(255, 255, 255, 0.10);
            --color-border-hover: rgba(255, 255, 255, 0.22);
            --color-text:       #F7F7F8;
            --color-text-secondary: #B8BDC7;
            --color-text-muted: #7F8795;
            --color-cta:        #7DD3FC;
            --color-cta-hover:  #BAE6FD;
            --color-accent:     #F5D06F;
            --content-max: 900px;
        }}

        * {{ box-sizing: border-box; }}
        html {{ scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }}
        body {{
            margin: 0; background: var(--color-bg); color: var(--color-text);
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', 'PingFang SC', sans-serif;
            font-size: 16px; line-height: 1.7;
            -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
        }}
        ::selection {{ background: rgba(125, 211, 252, 0.28); color: var(--color-text); }}
        a {{ color: var(--color-cta); text-decoration: none; transition: color .15s ease; }}
        a:hover {{ color: var(--color-cta-hover); }}
        code {{
            background: var(--color-bg-glass); border-radius: 4px;
            padding: 2px 6px; font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 0.9em; color: var(--color-text);
        }}

        .nav {{
            position: sticky; top: 16px; z-index: 50;
            width: calc(100% - 32px); max-width: var(--content-max);
            margin: 16px auto 0; padding: 12px 20px;
            display: flex; align-items: center; justify-content: space-between;
            background: rgba(20, 24, 33, 0.75); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
            border: 1px solid var(--color-border); border-radius: 16px;
        }}
        .nav-brand {{ display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 17px; color: var(--color-text); }}
        .nav-logo {{ width: 32px; height: 32px; border-radius: 8px; }}
        .nav-links {{ display: flex; align-items: center; gap: 26px; font-size: 14px; }}
        .nav-links a {{ color: var(--color-text-secondary); transition: color .15s ease; }}
        .nav-links a:hover {{ color: var(--color-text); text-decoration: none; }}
        @media (max-width: 767px) {{ .nav-links {{ display: none; }} }}

        .hero {{ padding: 64px 24px 40px; }}
        .hero-inner {{ max-width: var(--content-max); margin: 0 auto; }}
        .hero-eyebrow {{
            font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em;
            color: var(--color-accent); font-weight: 600; margin: 0 0 12px;
        }}
        .hero h1 {{ font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif; font-size: clamp(28px, 4vw, 40px); font-weight: 700; margin: 0 0 16px; letter-spacing: -0.02em; }}

        main {{ max-width: var(--content-max); margin: 0 auto; padding: 24px 24px 96px; }}
        .changelog-content {{
            background: var(--color-bg-elevated); border: 1px solid var(--color-border);
            border-radius: 16px; padding: 48px 56px;
        }}

        .changelog-content h1 {{ font-size: clamp(28px, 4vw, 40px); font-weight: 700; margin: 0 0 8px; color: var(--color-text); }}
        .changelog-content h2 {{ font-size: clamp(22px, 3vw, 28px); font-weight: 700; margin: 48px 0 16px; padding-bottom: 12px; border-bottom: 1px solid var(--color-border); color: var(--color-text); }}
        .changelog-content h2:first-of-type {{ margin-top: 0; }}
        .changelog-content h3 {{ font-size: 20px; font-weight: 600; margin: 32px 0 12px; color: var(--color-accent); }}
        .changelog-content p {{ margin: 12px 0; color: var(--color-text-secondary); line-height: 1.7; }}
        .changelog-content ul {{ padding-left: 20px; margin: 12px 0; list-style: none; }}
        .changelog-content ul li {{ margin: 10px 0; color: var(--color-text-secondary); line-height: 1.6; position: relative; padding-left: 16px; }}
        .changelog-content ul li::before {{ content: "·"; position: absolute; left: 0; color: var(--color-text-muted); font-weight: 700; }}
        .changelog-content strong {{ color: var(--color-text); font-weight: 600; }}
        .changelog-content a {{ color: var(--color-cta); }}
        .changelog-content a:hover {{ color: var(--color-cta-hover); }}
        /* Changelog 截图：限制宽度、圆角，避免撑破卡片 */
        .changelog-content img {{ display: block; max-width: 100%; height: auto; margin: 12px 0 20px; border-radius: 10px; border: 1px solid var(--color-border); }}
        .changelog-content hr {{ border: none; border-top: 1px solid var(--color-border); margin: 40px 0; }}
        .changelog-content blockquote {{ border-left: 3px solid var(--color-border); padding: 8px 16px; margin: 16px 0; color: var(--color-text-muted); font-style: italic; background: var(--color-bg-glass); border-radius: 0 8px 8px 0; }}
        .changelog-content blockquote p {{ color: var(--color-text-muted); }}

        footer.site-footer {{ border-top: 1px solid var(--color-border); padding: 40px 24px; color: var(--color-text-muted); font-size: 13px; text-align: center; }}
        footer.site-footer .links {{ display: flex; justify-content: center; gap: 26px; margin-bottom: 16px; flex-wrap: wrap; }}
        footer.site-footer .links a {{ color: var(--color-text-muted); transition: color .15s ease; }}
        footer.site-footer .links a:hover {{ color: var(--color-text-secondary); text-decoration: none; }}
        footer.site-footer .copyright {{ color: var(--color-text-muted); font-size: 12px; margin: 0; }}

        @media (max-width: 767px) {{
            .changelog-content {{ padding: 28px 22px; }}
            .hero {{ padding: 44px 16px 32px; }}
            .hero h1 {{ font-size: 28px; }}
        }}
    </style>
</head>
<body>

<header class="nav" role="banner">
    <a class="nav-brand" href="{home_href}">
        <img src="/starcat/starcat-logo.png" alt="Starcat" class="nav-logo" width="32" height="32">
        <span>Starcat</span>
    </a>
    <nav class="nav-links" aria-label="{nav_label}">
        <a href="{home_href}">{home_label}</a>
        <a href="{privacy_href}">{privacy_label}</a>
        <a href="{eula_href}">{eula_label}</a>
        <a href="{current_href}" style="color:var(--color-text);font-weight:500;">{changelog_label}</a>
    </nav>
</header>

<section class="hero">
    <div class="hero-inner">
        <p class="hero-eyebrow">{hero_eyebrow}</p>
        <h1>{hero_title}</h1>
    </div>
</section>

<main>
    <div class="changelog-content">
{content}
    </div>
</main>

<footer class="site-footer" role="contentinfo">
    <div class="links">
        <a href="{home_href}">{home_label}</a>
        <a href="{privacy_href}">{privacy_label}</a>
        <a href="{eula_href}">{eula_label}</a>
        <a href="{current_href}">{changelog_label}</a>
        <a href="mailto:dong4j@gmail.com">{contact_label}</a>
    </div>
    <p class="copyright">Copyright &copy; 2026 Starcat. All rights reserved.</p>
</footer>

</body>
</html>
"""


def md_to_html(text: str) -> str:
    """Simple Markdown to HTML converter. Handles the subset used by Starcat changelogs."""
    lines = text.split("\n")
    out = []
    i = 0
    in_code_block = False
    in_list = False
    in_blockquote = False

    while i < len(lines):
        line = lines[i]

        # Code blocks
        if line.startswith("```"):
            if in_code_block:
                out.append("</code></pre>")
                in_code_block = False
            else:
                out.append("<pre><code>")
                in_code_block = True
            i += 1
            continue

        if in_code_block:
            out.append(_escape(line))
            i += 1
            continue

        # Empty line
        if not line.strip():
            if in_list:
                out.append("</ul>")
                in_list = False
            if in_blockquote:
                out.append("</blockquote>")
                in_blockquote = False
            i += 1
            continue

        # Blockquote
        if line.startswith("> "):
            if not in_blockquote:
                out.append("<blockquote>")
                in_blockquote = True
            content = _inline(line[2:])
            out.append(f"<p>{content}</p>")
            i += 1
            continue
        elif line.startswith(">") and in_blockquote:
            content = _inline(line[1:].lstrip())
            out.append(f"<p>{content}</p>")
            i += 1
            continue
        elif in_blockquote and not line.startswith(">"):
            out.append("</blockquote>")
            in_blockquote = False

        # Horizontal rule
        if line.strip() == "---":
            if in_list:
                out.append("</ul>")
                in_list = False
            out.append("<hr>")
            i += 1
            continue

        # Headings
        if line.startswith("# "):
            if in_list:
                out.append("</ul>")
                in_list = False
            out.append(f"<h1>{_inline(line[2:])}</h1>")
            i += 1
            continue
        if line.startswith("## "):
            if in_list:
                out.append("</ul>")
                in_list = False
            out.append(f"<h2>{_inline(line[3:])}</h2>")
            i += 1
            continue
        if line.startswith("### "):
            if in_list:
                out.append("</ul>")
                in_list = False
            out.append(f"<h3>{_inline(line[4:])}</h3>")
            i += 1
            continue

        # Unordered list
        if re.match(r"^- ", line):
            if not in_list:
                out.append("<ul>")
                in_list = True
            out.append(f"<li>{_inline(line[2:])}</li>")
            i += 1
            continue

        # Paragraph
        if in_list:
            out.append("</ul>")
            in_list = False
        out.append(f"<p>{_inline(line)}</p>")
        i += 1

    if in_list:
        out.append("</ul>")
    if in_blockquote:
        out.append("</blockquote>")
    if in_code_block:
        out.append("</code></pre>")

    return "\n".join(out)


def _inline(text: str) -> str:
    """Handle inline markdown: images, links, bold, italic, code.

    必须先处理图片 `![alt](url)`，再处理链接 `[text](url)`。
    否则 `!` 会被留下，括号部分被误当成普通链接（direct 站曾出现 `!截图名` 蓝字）。
    """
    # Images ![alt](url) — before links, otherwise ! remains as text
    text = re.sub(
        r"!\[([^\]]*)\]\(([^)]+)\)",
        r'<img src="\2" alt="\1" loading="lazy">',
        text,
    )
    # Links [text](url)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', text)
    # Bold **text**
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    # Inline code `text`
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    # Italic *text* (but not **)
    text = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", text)
    return text


def _escape(text: str) -> str:
    """Escape HTML entities."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def validate_formal_changelog(text: str, source_path: Path) -> None:
    """拒绝把仍处于待发布状态的版本生成到正式官网。"""
    match = PENDING_VERSION_HEADING.search(text)
    if match:
        raise ValueError(
            f"{source_path} 仍包含待发布版本标题：{match.group(0)}"
        )


def main():
    for page in CHANGELOG_PAGES:
        source_path = page["source"]
        target_path = page["target"]
        if not source_path.exists():
            print(f"Error: {source_path} not found", file=sys.stderr)
            sys.exit(1)

        md_text = source_path.read_text(encoding="utf-8")
        validate_formal_changelog(md_text, source_path)
        html_body = md_to_html(md_text)
        # 每个页面只替换导航和页头文案；正文仍由对应 Markdown 单一来源生成。
        full_html = HTML_TEMPLATE.format(content=html_body, **page)

        target_path.write_text(full_html, encoding="utf-8")
        print(f"✓ Generated {target_path} ({len(full_html)} bytes)")


if __name__ == "__main__":
    main()
