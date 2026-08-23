import test from "node:test";
import assert from "node:assert/strict";

import {
  awesomeErrorMessage,
  awesomeWritePayload,
  emptyAwesomeDraft,
  sourceToAwesomeDraft
} from "./awesome-operations.mjs";

test("create payload trims fields without persisting admin-only state", () => {
  const draft = emptyAwesomeDraft();
  Object.assign(draft, {
    id: " awesome-mac ",
    repo_full_name: " owner/repo ",
    display_name: " Awesome Mac ",
    sort_order: "10",
    featured: true
  });
  assert.deepEqual(awesomeWritePayload(draft, false), {
    id: "awesome-mac",
    repo_full_name: "owner/repo",
    display_name: "Awesome Mac",
    image_url: "",
    summary_zh: "",
    summary_en: "",
    featured: true,
    sort_order: 10
  });
});

test("edit payload requires and preserves revision", () => {
  const draft = sourceToAwesomeDraft({
    id: "awesome-go",
    repo_full_name: "avelino/awesome-go",
    display_name: "Awesome Go",
    sort_order: 20,
    revision: 3
  });
  assert.equal(awesomeWritePayload(draft, true).revision, 3);
  draft.revision = 0;
  assert.throws(() => awesomeWritePayload(draft, true), /revision/);
});

test("API errors keep stable code and readable message", () => {
  assert.equal(
    awesomeErrorMessage(409, "Conflict", {error: {code: "AWESOME_SOURCE_CONFLICT", message: "请刷新"}}),
    "409 Conflict: AWESOME_SOURCE_CONFLICT: 请刷新"
  );
});

