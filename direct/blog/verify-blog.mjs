/**
 * Verify generated Starcat Blog artifacts before a production deploy.
 *
 * The checks focus on crawl-critical contracts: every source entry must have a
 * static page, unique canonical URL, complete initial HTML, valid JSON-LD, a
 * sitemap entry, and resolvable same-origin links. This prevents a successful
 * rsync from publishing an internally inconsistent blog.
 */

import { access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG_DIR = dirname(fileURLToPath(import.meta.url));
const DIRECT_DIR = dirname(BLOG_DIR);
const SITE_ORIGIN = 'https://starcat.ink';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function matches(source, pattern) {
    return [...source.matchAll(pattern)];
}

async function fileExists(path) {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

function localPathForUrl(url) {
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) {
        return join(DIRECT_DIR, pathname, 'index.html');
    }
    return join(DIRECT_DIR, pathname);
}

async function verifyHtml(path, expectedCanonical, requireArticleSchema) {
    const html = await readFile(path, 'utf8');
    assert(matches(html, /<title>[^<]+<\/title>/g).length === 1, `${path}: expected one non-empty title.`);
    assert(matches(html, /<meta name="description" content="[^"]+">/g).length === 1, `${path}: expected one description.`);
    assert(matches(html, /<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/g).length === 1, `${path}: expected one h1.`);

    const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)">/);
    assert(canonicalMatch, `${path}: missing canonical URL.`);
    assert(canonicalMatch[1] === expectedCanonical, `${path}: canonical mismatch (${canonicalMatch[1]}).`);
    assert(!html.includes('Loading post'), `${path}: contains the former client-rendering placeholder.`);

    const jsonLdBlocks = matches(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    assert(jsonLdBlocks.length > 0, `${path}: missing JSON-LD.`);
    const parsedSchemas = jsonLdBlocks.map((match) => JSON.parse(match[1]));
    if (requireArticleSchema) {
        const serialized = JSON.stringify(parsedSchemas);
        assert(serialized.includes('BlogPosting'), `${path}: missing BlogPosting schema.`);
        assert(serialized.includes('BreadcrumbList'), `${path}: missing BreadcrumbList schema.`);
    }

    for (const hrefMatch of matches(html, /\shref="([^"]+)"/g)) {
        const href = hrefMatch[1];
        if (href.startsWith('#') || href.startsWith('mailto:')) continue;
        const resolved = new URL(href, expectedCanonical);
        if (resolved.origin !== SITE_ORIGIN) continue;
        assert(await fileExists(localPathForUrl(resolved)), `${path}: broken internal link ${href}.`);
    }

    return html;
}

async function main() {
    const rawIndex = JSON.parse(await readFile(join(BLOG_DIR, 'posts', 'index.json'), 'utf8'));
    const posts = rawIndex.posts;
    assert(Array.isArray(posts) && posts.length > 0, 'posts/index.json must contain posts.');

    const sitemap = await readFile(join(DIRECT_DIR, 'sitemap.xml'), 'utf8');
    const feed = await readFile(join(BLOG_DIR, 'feed.xml'), 'utf8');
    const canonicals = new Set();

    const indexCanonical = `${SITE_ORIGIN}/blog/`;
    await verifyHtml(join(BLOG_DIR, 'index.html'), indexCanonical, false);
    assert(sitemap.includes(`<loc>${indexCanonical}</loc>`), 'sitemap.xml is missing the blog index.');

    for (const post of posts) {
        const canonical = `${SITE_ORIGIN}/blog/${post.slug}/`;
        assert(!canonicals.has(canonical), `Duplicate canonical URL: ${canonical}`);
        canonicals.add(canonical);
        await verifyHtml(join(BLOG_DIR, post.slug, 'index.html'), canonical, true);
        assert(sitemap.includes(`<loc>${canonical}</loc>`), `sitemap.xml is missing ${canonical}.`);
        assert(feed.includes(`<id>${canonical}</id>`), `feed.xml is missing ${canonical}.`);
    }

    assert(!sitemap.includes('post.html?slug='), 'sitemap.xml contains a legacy query-parameter URL.');
    assert(matches(feed, /<entry>/g).length === posts.length, 'Atom feed entry count does not match posts/index.json.');

    console.log(`Verified ${posts.length} static posts, canonical URLs, JSON-LD, sitemap, feed and internal links.`);
}

main().catch((error) => {
    console.error(error.stack || error.message || String(error));
    process.exitCode = 1;
});
