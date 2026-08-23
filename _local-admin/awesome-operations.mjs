/**
 * Awesome 来源运营表单的纯数据转换。
 *
 * 网络请求和密钥继续由 index.html 的本地运行时负责；这里保持无副作用，便于用 Node
 * 验证 revision、排序和空值转换，不把运营数据写入浏览器持久化。
 */

export function emptyAwesomeDraft() {
  return {
    id: "",
    repo_full_name: "",
    display_name: "",
    image_url: "",
    summary_zh: "",
    summary_en: "",
    featured: false,
    sort_order: "0",
    revision: 0
  };
}

export function sourceToAwesomeDraft(source = {}) {
  return {
    id: String(source.id || ""),
    repo_full_name: String(source.repo_full_name || ""),
    display_name: String(source.display_name || ""),
    image_url: String(source.image_url || ""),
    summary_zh: String(source.summary_zh || ""),
    summary_en: String(source.summary_en || ""),
    featured: Boolean(source.featured),
    sort_order: String(Number.isFinite(Number(source.sort_order)) ? Number(source.sort_order) : 0),
    revision: Number(source.revision || 0)
  };
}

export function awesomeWritePayload(draft, editing) {
  const id = String(draft.id || "").trim();
  const repoFullName = String(draft.repo_full_name || "").trim();
  const displayName = String(draft.display_name || "").trim();
  if (!id || !repoFullName || !displayName) {
    throw new Error("ID、GitHub 仓库和显示名称不能为空");
  }
  const sortOrder = Number.parseInt(String(draft.sort_order || "0"), 10);
  if (!Number.isInteger(sortOrder)) {
    throw new Error("排序必须是整数");
  }
  const payload = {
    id,
    repo_full_name: repoFullName,
    display_name: displayName,
    image_url: String(draft.image_url || "").trim(),
    summary_zh: String(draft.summary_zh || "").trim(),
    summary_en: String(draft.summary_en || "").trim(),
    featured: Boolean(draft.featured),
    sort_order: sortOrder
  };
  if (editing) {
    const revision = Number(draft.revision || 0);
    if (!Number.isInteger(revision) || revision <= 0) {
      throw new Error("编辑来源缺少有效 revision，请刷新后重试");
    }
    payload.revision = revision;
  }
  return payload;
}

export function awesomeErrorMessage(status, statusText, body) {
  const error = body && body.error;
  const code = error && typeof error === "object" ? error.code : "";
  const message = typeof error === "string" ? error : error && error.message;
  const detail = [code, message].filter(Boolean).join(": ");
  return `${status} ${statusText}${detail ? `: ${detail}` : ""}`;
}
