---
title: How to Export and Back Up Your GitHub Stars
date: 2026-08-24
summary: Protect the starred-repository list and the private notes, tags, and status that make it useful with a simple layered backup plan.
author: Starcat
---

Your public GitHub Stars are recoverable from GitHub. The context you add in a manager may not be.

Private notes, personal tags, reading status, custom collections, AI summaries, and indexing settings can represent years of small decisions. Losing that layer leaves you with the original flat list and none of the reasons it became useful.

A good backup plan separates public repository data from user-owned metadata, exports both in a readable format, and tests recovery before an emergency.

## Understand the three data layers

### Layer 1: the public Star relationship

GitHub records that your account starred a repository. You can retrieve the list through the GitHub API and export basic metadata such as:

- owner and repository name
- canonical URL
- description and Topics
- primary language
- star timestamp, when the API/media type provides it

This is the easiest layer to rebuild, assuming the account remains accessible and the repository still exists.

### Layer 2: cached repository content

A Star manager may cache READMEs, release information, health signals, file trees, or search chunks. Most of this can be downloaded again.

It is useful to back up when you need offline access or when repositories may disappear, but it should not be confused with irreplaceable personal data. Large caches can make exports slow and difficult to inspect.

### Layer 3: user-owned context

This is the critical layer:

- private notes
- personal tags
- reading or adoption status
- pinned items and custom collections
- release subscriptions
- local summaries you edited
- relationships or organization rules

GitHub does not know about these fields. If an application stores them only in its internal database, the application must provide a reliable export path.

## What a useful export should contain

Prefer a documented, versioned format. JSON is common because it preserves structure while remaining readable and easy to transform.

A minimal record might look like this:

```json
{
  "repository": "owner/project",
  "url": "https://github.com/owner/project",
  "starred_at": "2026-08-24T08:00:00Z",
  "tags": ["infra/database", "learn/later"],
  "status": "reading",
  "note": "Evaluate migration support before adopting."
}
```

The real schema may contain more fields, but it should have stable repository identity and explicit version metadata. Avoid using a display title as the only key; repositories can have similar names and can be transferred between owners.

Check whether the export includes:

- deleted or deprecated records
- private notes and custom tags
- timestamps
- release subscriptions
- custom collections or rules
- app-specific generated summaries
- enough schema/version information for future migration

Credentials and API keys usually should **not** be included in a plain export. Backing up secrets requires a separate encrypted process.

## Create a layered backup routine

### 1. Export from the application

Run the manager's supported export command or UI action. Do not copy an open SQLite file unless the application explicitly documents that method; an active database can include write-ahead log state that a naive copy misses.

Name the file with a date:

```text
github-stars-2026-08-24.json
```

### 2. Store the export outside the application directory

An export next to the database is not a backup. Application cleanup, reinstall, or disk failure can remove both.

Keep copies in at least two places, for example:

- a local encrypted backup disk
- an encrypted cloud folder
- a private, encrypted archive on another machine

Do not commit private notes or repository access details to a public Git repository.

### 3. Keep a source snapshot only where it matters

Downloading every starred repository can consume hundreds of gigabytes and creates a new update problem. Use source snapshots selectively for:

- production dependencies
- repositories likely to disappear
- exact versions used in research or client work
- projects whose README is not enough to reproduce the finding

For everything else, preserve the canonical GitHub URL and enough metadata to identify the project again.

### 4. Test restoration

An untested backup is only a file.

Use a separate test profile or temporary database and verify:

1. the export parses successfully
2. repository identities remain correct
3. notes and tags return
4. status and collections return
5. importing twice does not create uncontrolled duplicates
6. missing or renamed repositories produce visible warnings

Test before replacing or uninstalling the original application.

## Exporting the public Star list directly from GitHub

If your manager does not provide an export, the GitHub CLI can preserve the public repository list. The exact pagination and fields depend on the API route and your token permissions, but the core request is conceptually:

```bash
gh api --paginate /user/starred \
  --header 'Accept: application/vnd.github.star+json' \
  > github-stars.json
```

Review the resulting JSON before relying on it. API media types and response shapes can evolve, private repositories require appropriate authorization, and this export still does not contain notes or tags created in another app.

Do not paste personal access tokens into scripts or export files. Let `gh` use its authenticated credential storage.

## Plan for repository transfers and deletion

Repository identity is messier than `owner/name` suggests:

- a repository can move to a new owner
- GitHub may redirect an old URL
- a private repository can become inaccessible
- a repository can be deleted and later recreated under the same name

If the tool records the GitHub repository ID, preserve it. IDs help distinguish a transfer from an unrelated recreation. Exports should also keep the last known URL and name so a human can understand the record without querying GitHub.

When a repository disappears, keep the personal note and status unless the user deliberately deletes them. “Rejected because the project was archived” is still useful knowledge.

## Choose a backup schedule based on change rate

Most people do not need daily exports. A practical schedule is:

- export monthly for a slowly changing library
- export weekly during a large organization project
- export immediately before migration, bulk AI tagging, or destructive cleanup
- keep several historical versions, not only the latest file

Storage is cheap; reconstructing years of private context is not.

## Starcat's boundary

Starcat treats repository cache as rebuildable and personal metadata as user-owned data. Its JSON import/export workflow is intended to move the library without requiring the original database, and it supports compatible migration paths for tools such as OhMyStar and Astral where the available fields can be mapped.

Export does not replace normal Mac backups, and it does not include Keychain secrets. It gives you a portable, inspectable copy of the library layer that matters most.

For the organization model behind the fields, read [How to Organize GitHub Stars](../how-to-organize-github-stars/). To compare backup and deployment approaches across products, see [Best GitHub Star Managers for macOS](../best-github-star-managers-for-macos/).
