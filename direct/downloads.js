/**
 * Direct 双语下载入口共用逻辑。feed 是版本来源，GitHub 附件的 tag 是发布身份；
 * 开发 feed 也包含正式版，不能按来源或营销版本把它们全部标成 Beta。
 */
const releasesURL = 'https://github.com/starcat-app/Starcat/releases';

/** 保留 beta.N / dev.N，避免同一营销版本的不同预发布被覆盖。 */
export function releaseFromItem({ version, build, url, size, pubDate }) {
    const match = url?.match(/^https:\/\/github\.com\/starcat-app\/Starcat\/releases\/download\/v([^/]+)\/Starcat-([^/]+)-arm64\.dmg$/);
    if (!match || !version || !build) return null;
    const tag = decodeURIComponent(match[1]);
    if (tag.split('-')[0] !== version || match[2] !== version) return null;
    return { version, build, url, size: Number(size), pubDate, tag, prerelease: tag.includes('-') };
}

/** 两个渠道合并后按版本排序；正式版优先于相同版本的预发布。 */
export function buildCatalog(stable, development) {
    const unique = new Map();
    for (const release of [...stable, ...development]) {
        if (release) unique.set(release.tag, release);
    }
    const releases = [...unique.values()].sort((left, right) => {
        const versionOrder = right.version.localeCompare(left.version, 'en', { numeric: true });
        if (versionOrder) return versionOrder;
        if (left.prerelease !== right.prerelease) return left.prerelease ? 1 : -1;
        const previewKey = tag => tag.replace('-dev.', '-0.').replace('-beta.', '-1.');
        return previewKey(right.tag).localeCompare(previewKey(left.tag), 'en', { numeric: true });
    });
    return {
        stable: releases.find(release => !release.prerelease),
        development: releases.find(release => release.prerelease),
        releases
    };
}

/** XML 缺字段时忽略该条，不能把旧兜底附件拼成一个不存在的新版本。 */
export function parseAppcast(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('Invalid appcast');
    const sparkleNS = 'http://www.andymatuschak.org/xml-namespaces/sparkle';
    return Array.from(doc.getElementsByTagName('item')).map(item => {
        const text = name => item.getElementsByTagNameNS(sparkleNS, name)[0]?.textContent?.trim() || '';
        const enclosure = item.getElementsByTagName('enclosure')[0];
        return releaseFromItem({
            version: text('shortVersionString'),
            build: text('version'),
            url: enclosure?.getAttribute('url'),
            size: enclosure?.getAttribute('length'),
            pubDate: item.getElementsByTagName('pubDate')[0]?.textContent?.trim() || ''
        });
    }).filter(Boolean);
}

/** 独立读取两个 feed，任一渠道失败不抹掉另一渠道的有效下载。 */
export async function loadCatalog(fetcher = fetch, parser = parseAppcast) {
    const results = await Promise.allSettled(['/appcast.xml', '/appcast-development.xml'].map(async path => {
        const response = await fetcher(path, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Unavailable appcast: ${path}`);
        return parser(await response.text());
    }));
    return buildCatalog(...results.map(result => result.status === 'fulfilled' ? result.value : []));
}

/** 渲染时只写文本与附件地址；默认入口始终指向稳定版。 */
export function renderDownloads(doc, catalog) {
    const chinese = doc.documentElement.lang.startsWith('zh');
    const formatSize = size => size ? `${(size / (1024 * 1024)).toFixed(1)} MB` : (chinese ? '未知大小' : 'Unknown size');
    const formatVersion = release => `Starcat ${release.tag.replace(/-beta\.(\d+)$/, ' Beta $1').replace(/-dev\.(\d+)$/, ' Dev $1')}`;
    const setText = (selector, value) => doc.querySelectorAll(selector).forEach(element => { element.textContent = value; });
    const setURL = (selector, url) => doc.querySelectorAll(selector).forEach(element => { element.href = url; });
    const metadata = release => {
        const date = new Date(release.pubDate);
        const dateText = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(chinese ? 'zh-CN' : 'en', { year: 'numeric', month: 'short', day: 'numeric' });
        return [`Build ${release.build}`, dateText, formatSize(release.size)].filter(Boolean).join(' · ');
    };

    if (catalog.stable) {
        setText('[data-download-version]', formatVersion(catalog.stable));
        setText('[data-download-build]', catalog.stable.build);
        setText('[data-download-size]', formatSize(catalog.stable.size));
        setURL('[data-download-link], [data-download-open]', catalog.stable.url);
    }
    if (catalog.development) {
        setText('[data-download-development-version]', formatVersion(catalog.development));
        setText('[data-download-development-meta]', metadata(catalog.development));
        setText('[data-download-development-link]', chinese ? '下载开发版 DMG' : 'Download development DMG');
        setURL('[data-download-development-link]', catalog.development.url);
    } else {
        setText('[data-download-development-version]', chinese ? '前往 GitHub 查看开发版' : 'View development releases on GitHub');
        setText('[data-download-development-meta]', chinese ? '开发版信息暂不可用，请查看 GitHub Releases。' : 'Development information is unavailable. Check GitHub Releases.');
        setText('[data-download-development-link]', chinese ? '查看 GitHub Releases' : 'View GitHub Releases');
        setURL('[data-download-development-link]', releasesURL);
    }

    const history = doc.querySelector('[data-download-history]');
    if (!history) return;
    const previous = catalog.releases.filter(release => release !== catalog.stable && release !== catalog.development);
    history.replaceChildren();
    if (!previous.length) {
        const message = doc.createElement('p');
        message.className = 'download-history-empty';
        message.textContent = chinese ? '暂无可用的历史版本。' : 'No previous versions available.';
        history.append(message);
    }
    for (const release of previous) {
        const row = doc.createElement('div');
        row.className = 'download-history-item';
        const details = doc.createElement('div');
        const version = doc.createElement('div');
        version.className = 'download-history-version';
        version.textContent = formatVersion(release);
        const meta = doc.createElement('div');
        meta.className = 'download-history-meta';
        meta.textContent = metadata(release);
        const link = doc.createElement('a');
        link.className = 'download-history-link';
        link.href = release.url;
        link.textContent = chinese ? '下载 DMG' : 'Download DMG';
        details.append(version, meta);
        row.append(details, link);
        history.append(row);
    }
}

// 静态 HTML 保留 GitHub 最新稳定版出口；feed 失败时不会回退到过时的硬编码版本。
if (typeof document !== 'undefined') {
    loadCatalog().then(catalog => renderDownloads(document, catalog));
}
