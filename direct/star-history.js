/**
 * Direct 官网中英文 Star History 交互，沿用 App Store 已验收的公开 SVG 嵌入流程。
 * 只有用户提交预览时才请求新仓库；两种主题都成功后更新图片与代码，失败保留上一组。
 * 图片通过 Image 加载，无需 API Key 或跨域 fetch；代码复制使用完整 HTML 文本。
 */
(function initializeStarHistory() {
    // 页面语言控制操作提示；卡片语言独立选择，避免切换卡片时整块文案跳语言。
    const isChinese = document.documentElement.lang.toLowerCase().startsWith("zh");
    const labels = isChinese ? {
        copy: "复制 HTML", copied: "已复制", preview: "预览", loading: "加载中…",
        invalidRepo: "请输入公开 GitHub 仓库，格式为 owner/repository。",
        loadingRepo: (repo) => `正在加载 ${repo}… 首次请求可能需要稍等片刻。`,
        ready: "预览已更新，可以复制了。",
        failed: "卡片加载失败，请确认仓库公开且已有足够的 Star 历史后重试。原预览和代码保持不变。",
        clipboard: "无法访问剪贴板。已选中 HTML，请按 ⌘C 或 Ctrl+C 复制。",
        imageError: "卡片暂时无法显示，可点击预览重试，或复制 HTML 到 README 中查看。",
        cardAlt: (repo) => `${repo} Star 历史卡片`,
        split: (value) => `浅色 ${value}%，深色 ${100 - value}%`
    } : {
        copy: "Copy HTML", copied: "Copied!", preview: "Preview", loading: "Loading…",
        invalidRepo: "Enter a public GitHub repository as owner/repository.",
        loadingRepo: (repo) => `Loading ${repo}… First-time requests may take a moment.`,
        ready: "Preview updated. Ready to copy.",
        failed: "Couldn’t load this card. Check that the repository is public and has enough Star history, then try again. The previous preview and HTML are unchanged.",
        clipboard: "Clipboard access is unavailable. The HTML is selected; press ⌘C or Ctrl+C to copy.",
        imageError: "The card preview is unavailable. Use Preview to retry, or copy the HTML to try it in your README.",
        cardAlt: (repo) => `${repo} Star History card`,
        split: (value) => `${value}% light, ${100 - value}% dark`
    };
    const form = document.getElementById("history-form");
    const repository = document.getElementById("history-repo");
    const locale = document.getElementById("history-locale");
    const update = document.getElementById("history-update");
    const updateLabel = document.getElementById("history-update-label");
    const status = document.getElementById("history-status");
    const code = document.getElementById("history-code");
    const copy = document.getElementById("history-copy");
    const copyLabel = document.getElementById("history-copy-label");
    const codeDetails = document.getElementById("history-code-details");
    const compare = document.getElementById("history-compare");
    const range = document.getElementById("history-range");
    const previewName = document.getElementById("history-preview-repo");
    const light = document.getElementById("history-light");
    const dark = document.getElementById("history-dark");
    let copyReset;

    // 固定公开服务域名并编码仓库路径，禁止把输入解释成任意 URL。
    function cardURL(repo, theme, language) {
        const path = repo.split("/").map(encodeURIComponent).join("/");
        return `https://history.starcat.ink/embed/v1/repos/${path}/star-history.svg?theme=${theme}&locale=${language}`;
    }

    // HTML attributes require escaped query separators; image requests do not.
    function embedHTML(repo, language) {
        const lightURL = cardURL(repo, "light", language).replaceAll("&", "&amp;");
        const darkURL = cardURL(repo, "dark", language).replaceAll("&", "&amp;");
        return `<a href="https://github.com/starcat-app/Starcat" target="_blank" rel="noopener noreferrer">\n  <picture data-starcat-star-history>\n    <source\n      media="(prefers-color-scheme: dark)"\n      srcset="${darkURL}">\n    <img\n      alt="${repo} Star History"\n      src="${lightURL}">\n  </picture>\n</a>`;
    }

    function resetCopyFeedback() {
        window.clearTimeout(copyReset);
        copyLabel.textContent = labels.copy;
        copy.classList.remove("is-copied");
    }

    // 冷仓库可能较慢，限定等待时间，失败时不替换正在展示的卡片。
    function loadCard(url) {
        return new Promise(function waitForCard(resolve, reject) {
            const image = new Image();
            const timeout = window.setTimeout(function stopWaiting() {
                image.onload = image.onerror = null;
                reject(new Error("Card request timed out"));
            }, 20000);
            image.onload = function cardLoaded() {
                window.clearTimeout(timeout);
                resolve(image);
            };
            image.onerror = function cardFailed() {
                window.clearTimeout(timeout);
                reject(new Error("Card unavailable"));
            };
            image.src = url;
        });
    }

    range.addEventListener("input", function revealTheme() {
        const value = Number(range.value);
        compare.style.setProperty("--history-split", `${value}%`);
        range.setAttribute("aria-valuetext", labels.split(value));
    });
    repository.addEventListener("input", function clearRepositoryError() {
        repository.setCustomValidity("");
    });

    form.addEventListener("submit", async function updateCard(event) {
        event.preventDefault();
        if (update.disabled) return;
        const repo = repository.value.trim();
        if (!/^[a-z\d][a-z\d-]{0,38}\/[a-z\d_.-]{1,100}$/i.test(repo) || /\/(\.|\.\.)$/.test(repo)) {
            repository.setCustomValidity(labels.invalidRepo);
            repository.reportValidity();
            return;
        }
        const language = locale.querySelector("input:checked").value;
        update.disabled = repository.disabled = locale.disabled = true;
        updateLabel.textContent = labels.loading;
        compare.setAttribute("aria-busy", "true");
        status.textContent = labels.loadingRepo(repo);
        try {
            const images = await Promise.all([loadCard(cardURL(repo, "light", language)), loadCard(cardURL(repo, "dark", language))]);
            [light, dark].forEach(function showCard(image, index) {
                image.width = images[index].naturalWidth;
                image.height = images[index].naturalHeight;
                image.src = images[index].src;
            });
            dark.alt = labels.cardAlt(repo);
            previewName.textContent = repo;
            repository.value = repo;
            code.value = embedHTML(repo, language);
            resetCopyFeedback();
            status.textContent = labels.ready;
        } catch {
            status.textContent = labels.failed;
        } finally {
            update.disabled = repository.disabled = locale.disabled = false;
            updateLabel.textContent = labels.preview;
            compare.removeAttribute("aria-busy");
        }
    });

    copy.addEventListener("click", async function copyEmbed() {
        resetCopyFeedback();
        try {
            await navigator.clipboard.writeText(code.value);
            copyLabel.textContent = labels.copied;
            copy.classList.add("is-copied");
            copyReset = window.setTimeout(resetCopyFeedback, 1500);
        } catch {
            // Reveal the collapsed source before focusing it for manual copying.
            codeDetails.open = true;
            code.focus();
            code.select();
            status.textContent = labels.clipboard;
        }
    });

    [light, dark].forEach(function watchInitialCard(image) {
        image.addEventListener("error", function showImageError() {
            status.textContent = labels.imageError;
        });
    });
    code.value = embedHTML(repository.value, locale.querySelector("input:checked").value);
    update.disabled = copy.disabled = false;
})();
