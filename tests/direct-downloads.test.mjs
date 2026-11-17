/**
 * 下载目录的行为测试，不启动浏览器或访问网络。
 * 覆盖完整 tag 身份、渠道故障隔离、默认稳定入口及双语渲染。
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../direct/downloads.js', import.meta.url), 'utf8');
const { releaseFromItem, buildCatalog, loadCatalog, renderDownloads } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

/** 使用真实附件路径形态，让测试能发现把营销版本误当成 tag 的问题。 */
function release(tag, build = '202611120142') {
    const version = tag.split('-')[0];
    return releaseFromItem({
        version, build, size: '133613850', pubDate: '2026-11-12T01:42:00+08:00',
        url: `https://github.com/starcat-app/Starcat/releases/download/v${tag}/Starcat-${version}-arm64.dmg`
    });
}

test('合并双 feed，稳定条目不冒充 Beta，同一营销版本保留多个预发布', () => {
    const stable = release('1.9.1');
    const catalog = buildCatalog([stable], [
        stable, release('1.9.5-beta.2'), release('1.9.4-beta.1'),
        release('1.9.5-beta.10'), release('1.9.5-beta.1'), release('1.9.2-dev.1')
    ]);
    assert.equal(catalog.stable.tag, '1.9.1');
    assert.equal(catalog.development.tag, '1.9.5-beta.10');
    assert.deepEqual(catalog.releases.map(item => item.tag), [
        '1.9.5-beta.10', '1.9.5-beta.2', '1.9.5-beta.1',
        '1.9.4-beta.1', '1.9.2-dev.1', '1.9.1'
    ]);
});

test('正式版优先于相同版本的 Beta，版本按数字排序', () => {
    const catalog = buildCatalog([release('1.10.0'), release('1.9.9')], [release('1.10.0-beta.1')]);
    assert.deepEqual(catalog.releases.map(item => item.tag), ['1.10.0', '1.10.0-beta.1', '1.9.9']);
});

test('无完整附件或版本不匹配的条目不能伪装成可下载版本', () => {
    assert.equal(releaseFromItem({ version: '1.9.1', build: '1' }), null);
    assert.equal(releaseFromItem({
        version: '1.9.1', build: '1',
        url: 'https://github.com/starcat-app/Starcat/releases/download/v1.9.5-beta.1/Starcat-1.9.5-arm64.dmg'
    }), null);
});

test('独立加载两个 feed，任一请求或解析失败保留另一渠道', async () => {
    for (const failed of ['/appcast.xml', '/appcast-development.xml']) {
        const fetched = [];
        const catalog = await loadCatalog(async path => {
            fetched.push(path);
            if (path === failed) throw new Error('offline');
            return { ok: true, text: async () => path };
        }, path => path === '/appcast.xml' ? [release('1.9.1')] : [release('1.9.5-beta.1')]);
        assert.equal(fetched.length, 2);
        assert.equal(Boolean(catalog.stable), failed !== '/appcast.xml');
        assert.equal(Boolean(catalog.development), failed !== '/appcast-development.xml');
    }
    const empty = await loadCatalog(async () => ({ ok: false }));
    assert.equal(empty.releases.length, 0);
    const parsed = await loadCatalog(async path => ({ ok: true, text: async () => path }), path => {
        if (path === '/appcast.xml') throw new Error('invalid XML');
        return [release('1.9.1'), release('1.9.5-beta.1')];
    });
    assert.equal(parsed.stable.tag, '1.9.1');
    assert.equal(parsed.development.tag, '1.9.5-beta.1');
});

/** 最小 DOM 接口记录实际渲染结果，不复刻目录选择与文案生成逻辑。 */
function documentFixture(language) {
    const element = () => ({
        children: [], textContent: '', href: '',
        append(...children) { this.children.push(...children); },
        replaceChildren() { this.children = []; }
    });
    const selectors = Object.fromEntries([
        '[data-download-version]', '[data-download-build]', '[data-download-size]',
        '[data-download-link], [data-download-open]', '[data-download-development-version]',
        '[data-download-development-meta]', '[data-download-development-link]', '[data-download-history]'
    ].map(selector => [selector, element()]));
    return {
        documentElement: { lang: language }, selectors,
        createElement: element,
        querySelectorAll: selector => [selectors[selector]],
        querySelector: selector => selectors[selector]
    };
}

test('双语入口默认稳定版，Beta 和 Dev 历史保留完整身份及原附件 URL', () => {
    const catalog = buildCatalog([release('1.9.1')], [
        release('1.9.5-beta.1'), release('1.9.4-beta.1'), release('1.9.3-beta.1'), release('1.9.2-dev.1')
    ]);
    for (const language of ['en', 'zh-CN']) {
        const doc = documentFixture(language);
        renderDownloads(doc, catalog);
        assert.equal(doc.selectors['[data-download-version]'].textContent, 'Starcat 1.9.1');
        assert.equal(doc.selectors['[data-download-link], [data-download-open]'].href, release('1.9.1').url);
        assert.equal(doc.selectors['[data-download-development-version]'].textContent, 'Starcat 1.9.5 Beta 1');
        assert.equal(doc.selectors['[data-download-development-link]'].href, release('1.9.5-beta.1').url);
        assert.equal(doc.selectors['[data-download-development-link]'].textContent, language === 'en' ? 'Download development DMG' : '下载开发版 DMG');
        const history = doc.selectors['[data-download-history]'].children;
        assert.deepEqual(history.map(row => row.children[0].children[0].textContent), [
            'Starcat 1.9.4 Beta 1', 'Starcat 1.9.3 Beta 1', 'Starcat 1.9.2 Dev 1'
        ]);
        assert.equal(history[2].children[1].href, release('1.9.2-dev.1').url);
    }
});

test('双 feed 失败保留静态稳定链接，开发入口降级到 GitHub 而不伪造版本', () => {
    const doc = documentFixture('zh-CN');
    doc.selectors['[data-download-link], [data-download-open]'].href = release('1.9.1').url;
    renderDownloads(doc, buildCatalog([], []));
    assert.equal(doc.selectors['[data-download-link], [data-download-open]'].href, release('1.9.1').url);
    assert.equal(doc.selectors['[data-download-development-link]'].href, 'https://github.com/starcat-app/Starcat/releases');
    assert.match(doc.selectors['[data-download-development-version]'].textContent, /GitHub/);
});
