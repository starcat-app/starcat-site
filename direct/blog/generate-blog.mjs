/**
 * Starcat Blog static generator.
 *
 * Markdown remains the authoring source, while this script emits complete HTML
 * for readers and crawlers. The repository already vendors marked.js for the
 * old browser renderer, so the build deliberately reuses it instead of adding
 * a package-manager or network dependency to the production-site workflow.
 */

import { createRequire } from 'node:module';
import { readFile, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const marked = require('./vendor/marked.min.js');

const BLOG_DIR = dirname(fileURLToPath(import.meta.url));
const DIRECT_DIR = dirname(BLOG_DIR);
const POSTS_DIR = join(BLOG_DIR, 'posts');
const SITE_URL = 'https://starcat.ink';
const SITE_NAME = 'Starcat';
const SITE_IMAGE = `${SITE_URL}/sc-banner.webp`;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

marked.setOptions({ gfm: true, breaks: false });

/** Escape text before inserting it into HTML attributes or text nodes. */
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Escape XML feed/sitemap values without relying on an external serializer. */
function escapeXml(value) {
    return escapeHtml(value);
}

/**
 * Parse the intentionally small frontmatter format used by the blog.
 * Nested YAML is not supported because the same metadata also lives in the
 * checked index file and should remain easy to review in diffs.
 */
function parseFrontmatter(raw) {
    const text = String(raw ?? '').replace(/^\uFEFF/, '');
    if (!text.startsWith('---\n') && !text.startsWith('---\r\n')) {
        return { meta: {}, body: text };
    }

    const end = text.indexOf('\n---', 3);
    if (end === -1) {
        throw new Error('Frontmatter is missing a closing --- delimiter.');
    }

    const meta = {};
    for (const line of text.slice(4, end).split(/\r?\n/)) {
        const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (!match) continue;
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        meta[match[1]] = value;
    }

    return {
        meta,
        body: text.slice(end + 4).replace(/^\r?\n/, '')
    };
}

function formatDate(isoDate) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    }).format(new Date(`${isoDate}T00:00:00Z`));
}

function toSchemaDate(isoDate) {
    return `${isoDate}T00:00:00+08:00`;
}

function estimateMinutes(markdownBody) {
    const words = String(markdownBody ?? '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
}

function validateDate(value, field, slug) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) {
        throw new Error(`${slug}: ${field} must use YYYY-MM-DD.`);
    }
}

/**
 * Read and cross-check every post before generating any output. Failing the
 * whole build is intentional: a partial deploy would leave sitemap, feed and
 * navigation disagreeing about which article is canonical.
 */
async function loadPosts() {
    const indexPath = join(POSTS_DIR, 'index.json');
    const parsedIndex = JSON.parse(await readFile(indexPath, 'utf8'));
    const entries = Array.isArray(parsedIndex) ? parsedIndex : parsedIndex.posts;
    if (!Array.isArray(entries)) {
        throw new Error('posts/index.json must contain a posts array.');
    }

    const seen = new Set();
    const posts = [];
    for (const entry of entries) {
        const slug = String(entry.slug ?? '');
        if (!SLUG_PATTERN.test(slug)) {
            throw new Error(`Invalid blog slug: ${slug}`);
        }
        if (seen.has(slug)) {
            throw new Error(`Duplicate blog slug: ${slug}`);
        }
        seen.add(slug);

        const source = parseFrontmatter(await readFile(join(POSTS_DIR, `${slug}.md`), 'utf8'));
        const title = entry.title || source.meta.title;
        const summary = entry.summary || source.meta.summary;
        const date = entry.date || source.meta.date;
        const updated = entry.updated || source.meta.updated || date;
        const author = entry.author || source.meta.author || SITE_NAME;

        if (!title || !summary || !date) {
            throw new Error(`${slug}: title, summary and date are required.`);
        }
        validateDate(date, 'date', slug);
        validateDate(updated, 'updated', slug);

        posts.push({
            sourceOrder: posts.length,
            slug,
            title,
            summary,
            date,
            updated,
            author,
            minutes: Number(entry.minutes) || estimateMinutes(source.body),
            body: source.body
        });
    }

    return posts.sort((left, right) => {
        const dateOrder = right.date.localeCompare(left.date);
        // index.json remains the editorial tie-breaker when several posts are
        // published on the same day; alphabetical order is not meaningful.
        return dateOrder || left.sourceOrder - right.sourceOrder;
    });
}

function navigation(prefix, active = 'blog') {
    const link = (href, label, key) =>
        `<a href="${href}"${active === key ? ' class="is-active"' : ''}>${label}</a>`;
    return `
<header class="topbar" role="banner">
    <div class="topbar-inner">
        <a class="brand" href="${prefix}index.html">
            <img src="${prefix}starcat-logo.png" alt="Starcat" class="brand-logo" width="28" height="28">
            <span>Starcat</span>
        </a>
        <nav class="topbar-nav" aria-label="Navigation">
            ${link(`${prefix}index.html`, 'Home', 'home')}
            ${link(prefix === '../' ? './' : '../', 'Blog', 'blog')}
            ${link(`${prefix}changelog.html`, 'Changelog', 'changelog')}
            ${link(`${prefix}privacy.html`, 'Privacy', 'privacy')}
        </nav>
    </div>
</header>`;
}

function footer(prefix) {
    return `
<footer class="site-footer" role="contentinfo">
    <div class="links">
        <a href="${prefix}index.html">Home</a>
        <a href="${prefix === '../' ? './' : '../'}">Blog</a>
        <a href="${prefix}changelog.html">Changelog</a>
        <a href="${prefix}privacy.html">Privacy Policy</a>
        <a href="https://github.com/starcat-app/Starcat">GitHub</a>
        <a href="mailto:dong4j@gmail.com">Contact</a>
    </div>
    <p class="copyright">Copyright &copy; 2026 Starcat. All rights reserved.</p>
</footer>`;
}

function authorRow(post, logoPath) {
    const updatedLabel = post.updated !== post.date
        ? ` · Updated ${formatDate(post.updated)}`
        : '';
    return `<div class="author-row">
    <img class="author-avatar" src="${logoPath}" alt="" width="36" height="36">
    <div class="author-text">
        <span class="author-name">${escapeHtml(post.author)}</span>
        <span class="author-meta"><time datetime="${post.date}">${formatDate(post.date)}</time>${updatedLabel} · ${post.minutes} min read</span>
    </div>
</div>`;
}

function renderBlogIndex(posts) {
    const cards = posts.map((post) => `
        <li>
            <a class="post-card" href="${post.slug}/">
                <div class="post-card-body">
                    <h2>${escapeHtml(post.title)}</h2>
                    <p class="summary">${escapeHtml(post.summary)}</p>
                </div>
                ${authorRow(post, '../starcat-logo.png')}
            </a>
        </li>`).join('');

    const blogSchema = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Starcat Blog',
        url: `${SITE_URL}/blog/`,
        description: 'Practical guides to organizing, searching, backing up, and understanding GitHub Stars on macOS.',
        publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/starcat-logo.png` }
        },
        blogPost: posts.map((post) => ({
            '@type': 'BlogPosting',
            headline: post.title,
            url: `${SITE_URL}/blog/${post.slug}/`,
            datePublished: toSchemaDate(post.date),
            dateModified: toSchemaDate(post.updated)
        }))
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Practical guides to organizing, searching, backing up, and understanding GitHub Stars on macOS.">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${SITE_URL}/blog/">
    <link rel="alternate" type="application/atom+xml" title="Starcat Blog" href="${SITE_URL}/blog/feed.xml">
    <meta property="og:site_name" content="Starcat">
    <meta property="og:title" content="GitHub Stars Management Blog · Starcat">
    <meta property="og:description" content="Practical guides to organizing, searching, backing up, and understanding GitHub Stars on macOS.">
    <meta property="og:url" content="${SITE_URL}/blog/">
    <meta property="og:image" content="${SITE_IMAGE}">
    <meta property="og:image:alt" content="Starcat — GitHub Stars manager and AI knowledge base for macOS">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="GitHub Stars Management Blog · Starcat">
    <meta name="twitter:description" content="Practical guides to organizing, searching, backing up, and understanding GitHub Stars on macOS.">
    <meta name="twitter:image" content="${SITE_IMAGE}">
    <title>GitHub Stars Management Blog · Starcat</title>
    <link rel="icon" type="image/png" href="../starcat-logo.png">
    <link rel="stylesheet" href="blog.css">
    <script type="application/ld+json">${JSON.stringify(blogSchema)}</script>
</head>
<body>
${navigation('../')}

<section class="hero">
    <div class="hero-inner">
        <h1>Starcat Blog</h1>
        <p class="hero-lead">Practical guides for turning GitHub Stars into an organized, searchable, local-first knowledge base.</p>
    </div>
</section>

<main class="blog-main">
    <ul class="post-list">${cards}
    </ul>
</main>
${footer('../')}
</body>
</html>
`;
}

function renderArticle(post, relatedPosts) {
    const canonical = `${SITE_URL}/blog/${post.slug}/`;
    const articleSchema = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BlogPosting',
                '@id': `${canonical}#article`,
                headline: post.title,
                description: post.summary,
                image: [SITE_IMAGE],
                datePublished: toSchemaDate(post.date),
                dateModified: toSchemaDate(post.updated),
                inLanguage: 'en',
                mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
                author: { '@type': 'Organization', name: post.author, url: SITE_URL },
                publisher: {
                    '@type': 'Organization',
                    name: SITE_NAME,
                    url: SITE_URL,
                    logo: { '@type': 'ImageObject', url: `${SITE_URL}/starcat-logo.png` }
                }
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Starcat', item: `${SITE_URL}/` },
                    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
                    { '@type': 'ListItem', position: 3, name: post.title, item: canonical }
                ]
            }
        ]
    };

    const related = relatedPosts.map((item) => `
            <li><a href="../${item.slug}/">${escapeHtml(item.title)}</a></li>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHtml(post.summary)}">
    <meta name="author" content="${escapeHtml(post.author)}">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${canonical}">
    <link rel="alternate" type="application/atom+xml" title="Starcat Blog" href="${SITE_URL}/blog/feed.xml">
    <meta property="og:site_name" content="Starcat">
    <meta property="og:title" content="${escapeHtml(post.title)}">
    <meta property="og:description" content="${escapeHtml(post.summary)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${SITE_IMAGE}">
    <meta property="og:image:alt" content="Starcat — GitHub Stars manager and AI knowledge base for macOS">
    <meta property="og:type" content="article">
    <meta property="article:published_time" content="${toSchemaDate(post.date)}">
    <meta property="article:modified_time" content="${toSchemaDate(post.updated)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(post.title)}">
    <meta name="twitter:description" content="${escapeHtml(post.summary)}">
    <meta name="twitter:image" content="${SITE_IMAGE}">
    <title>${escapeHtml(post.title)} · Starcat</title>
    <link rel="icon" type="image/png" href="../../starcat-logo.png">
    <link rel="stylesheet" href="../blog.css">
    <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
</head>
<body>
${navigation('../../')}

<main class="article-main">
    <article>
        <a class="article-back" href="../">← Back to Blog</a>
        <header class="article-header">
            <h1>${escapeHtml(post.title)}</h1>
            ${authorRow(post, '../../starcat-logo.png')}
        </header>
        <div class="article-body">${marked.parse(post.body)}</div>
        <aside class="article-cta" aria-label="Try Starcat">
            <h2>Put your GitHub Stars to work</h2>
            <p>Starcat is a native, local-first macOS app for organizing, searching, understanding, and asking questions of your starred repositories.</p>
            <div class="article-cta-actions">
                <a class="article-cta-primary" href="../../index.html#download">Download Starcat</a>
                <a href="https://github.com/starcat-app/Starcat">View the source on GitHub</a>
            </div>
        </aside>
        <nav class="related-posts" aria-label="Related articles">
            <h2>Continue reading</h2>
            <ul>${related}
            </ul>
        </nav>
    </article>
</main>
${footer('../../')}
</body>
</html>
`;
}

function renderAtomFeed(posts) {
    const updated = posts.reduce((latest, post) => post.updated > latest ? post.updated : latest, '1970-01-01');
    const entries = posts.map((post) => `
  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${SITE_URL}/blog/${post.slug}/"/>
    <id>${SITE_URL}/blog/${post.slug}/</id>
    <published>${toSchemaDate(post.date)}</published>
    <updated>${toSchemaDate(post.updated)}</updated>
    <author><name>${escapeXml(post.author)}</name></author>
    <summary>${escapeXml(post.summary)}</summary>
  </entry>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Starcat Blog</title>
  <link href="${SITE_URL}/blog/"/>
  <link href="${SITE_URL}/blog/feed.xml" rel="self"/>
  <id>${SITE_URL}/blog/</id>
  <updated>${toSchemaDate(updated)}</updated>
  <subtitle>Practical guides for organizing, searching, backing up, and understanding GitHub Stars.</subtitle>${entries}
</feed>
`;
}

async function fileDate(relativePath) {
    const fileStat = await stat(join(DIRECT_DIR, relativePath));
    return fileStat.mtime.toISOString().slice(0, 10);
}

function sitemapUrl(location, lastmod, alternates = []) {
    const alternateXml = alternates.map((item) =>
        `    <xhtml:link rel="alternate" hreflang="${item.language}" href="${item.url}"/>`
    ).join('\n');
    return `  <url>
    <loc>${escapeXml(location)}</loc>
    <lastmod>${lastmod}</lastmod>${alternateXml ? `\n${alternateXml}` : ''}
  </url>`;
}

async function renderSitemap(posts) {
    const bilingualPages = [
        { en: '/', zh: '/index-zh.html', enFile: 'index.html', zhFile: 'index-zh.html' },
        { en: '/changelog.html', zh: '/changelog-zh.html', enFile: 'changelog.html', zhFile: 'changelog-zh.html' },
        { en: '/privacy.html', zh: '/privacy-zh.html', enFile: 'privacy.html', zhFile: 'privacy-zh.html' },
        { en: '/eula.html', zh: '/eula-zh.html', enFile: 'eula.html', zhFile: 'eula-zh.html' }
    ];

    const urls = [];
    for (const page of bilingualPages) {
        const alternates = [
            { language: 'en', url: `${SITE_URL}${page.en}` },
            { language: 'zh-Hans', url: `${SITE_URL}${page.zh}` },
            { language: 'x-default', url: `${SITE_URL}${page.en}` }
        ];
        urls.push(sitemapUrl(`${SITE_URL}${page.en}`, await fileDate(page.enFile), alternates));
        urls.push(sitemapUrl(`${SITE_URL}${page.zh}`, await fileDate(page.zhFile), alternates));
    }

    const blogUpdated = posts.reduce((latest, post) => post.updated > latest ? post.updated : latest, '1970-01-01');
    urls.splice(2, 0, sitemapUrl(`${SITE_URL}/blog/`, blogUpdated));
    posts.forEach((post, index) => {
        urls.splice(3 + index, 0, sitemapUrl(`${SITE_URL}/blog/${post.slug}/`, post.updated));
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

/** Remove only generated slug directories; source files and hand-authored assets stay intact. */
async function cleanGeneratedArticleDirectories() {
    for (const entry of await readdir(BLOG_DIR, { withFileTypes: true })) {
        if (entry.isDirectory() && SLUG_PATTERN.test(entry.name) && entry.name !== 'posts' && entry.name !== 'vendor') {
            await rm(join(BLOG_DIR, entry.name), { recursive: true, force: true });
        }
    }
}

async function main() {
    const posts = await loadPosts();
    await cleanGeneratedArticleDirectories();

    await writeFile(join(BLOG_DIR, 'index.html'), renderBlogIndex(posts), 'utf8');
    await writeFile(join(BLOG_DIR, 'feed.xml'), renderAtomFeed(posts), 'utf8');
    await writeFile(join(DIRECT_DIR, 'sitemap.xml'), await renderSitemap(posts), 'utf8');

    for (const [index, post] of posts.entries()) {
        const articleDir = join(BLOG_DIR, post.slug);
        const related = [];
        for (let offset = 1; related.length < Math.min(3, posts.length - 1); offset += 1) {
            const candidate = posts[(index + offset) % posts.length];
            if (candidate.slug !== post.slug && !related.some((item) => item.slug === candidate.slug)) {
                related.push(candidate);
            }
        }
        await mkdir(articleDir, { recursive: true });
        await writeFile(join(articleDir, 'index.html'), renderArticle(post, related), 'utf8');
    }

    console.log(`Generated ${posts.length} static blog posts, feed.xml and sitemap.xml.`);
}

main().catch((error) => {
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
});
