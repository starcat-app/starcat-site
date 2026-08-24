---
title: From GitHub Stars to a Searchable AI Knowledge Base
date: 2026-07-18
updated: 2026-08-24
summary: A practical path from flat bookmarks to searchable evidence, private notes, and cited AI answers grounded in repositories you chose.
author: Starcat
---

A starred repository is a promise to your future self: this project may solve a problem, explain an idea, or become part of something you build.

GitHub preserves the public signal. It does not preserve the reason. Six months later, a list of names and descriptions rarely reconstructs the decision you made while reading the README.

Turning Stars into a knowledge base does not mean sending every repository to a model. It means building several layers of retrieval, each added only when the previous layer stops being enough.

## Layer 1: preserve the collection

Start with a reliable local representation of the starred list:

- stable repository identity
- owner and name
- canonical URL
- description, language, Topics, and license
- star timestamp when available
- enough sync metadata to update incrementally

The cache should be rebuildable from GitHub. Its job is to make browsing and exact search fast, not to become the only copy of personal work.

At this layer, the collection is already better than a web feed because it can be filtered and searched without walking every page of the GitHub API.

## Layer 2: add personal meaning

A knowledge base becomes personal when it records information that upstream cannot provide:

- a short private note
- personal tags
- status such as Reading or Adopted
- a pinned or custom collection
- the reason a project was rejected

The best note is not a generic summary. It is a decision:

> Useful architecture reference, but the runtime dependency is too heavy for our CLI.

That sentence can be searched later and prevents repeated evaluation.

Personal metadata also deserves stronger durability than the repository cache. It needs export, backup, and database migrations that preserve existing installations.

## Layer 3: index source documents

Names, descriptions, and Topics are compact. They do not contain installation steps, API names, limitations, or architecture details.

README indexing makes those details searchable. A good pipeline records:

- repository and document identity
- source URL or revision
- chunk boundaries
- content hash
- indexing status and failure reason

Content hashes allow unchanged chunks to keep their existing index. Failure metadata prevents “not indexed” from looking like “no match.”

Exact full-text retrieval should remain available because it is fast and explainable. If you remember `NSBackgroundActivityScheduler`, lexical search is the right tool.

## Layer 4: add semantic retrieval

Embeddings help when the query and the source use different vocabulary. “Tool for durable background jobs” can retrieve a README describing “at-least-once task execution.”

Semantic search needs explicit operational choices:

- which embedding model produced the vector
- whether the input is README text, summaries, notes, or all three
- how many chunks are retrieved
- which similarity threshold is used
- how vectors are rebuilt when the model changes

It should not silently replace full-text search. Hybrid retrieval often works better: keyword candidates provide precision, semantic candidates provide recall, and a fusion step combines rankings.

[How to Search GitHub Stars by README, Tags, Notes, and Meaning](../search-github-stars-by-readme-tags-notes/) covers when to use each path.

## Layer 5: synthesize answers with citations

RAG adds a model after retrieval. The model receives selected evidence and produces a response grounded in that context.

For a personal repository library, citations are the key product behavior. They let you answer:

- Which saved libraries support a particular API?
- How do three self-hosted tools differ in deployment?
- Which repository mentioned the migration constraint I remember?

Every substantive claim should lead back to the repository and evidence chunk. Without citations, the model may blend retrieved text with general knowledge and produce an answer that sounds useful but cannot be audited.

The workflow should expose:

1. the query
2. filters or selected repositories
3. retrieved evidence
4. model/provider used for synthesis
5. citations in the final answer

## Do not index every Star automatically

A public Star and a private knowledge-base entry are different commitments.

You may Star a project because it looks interesting, because a friend built it, or because you want to return once. Automatically downloading, chunking, and embedding every Star creates cost without improving the active library.

Use explicit ingestion:

- keep all Stars searchable as a collection
- promote selected repositories into the knowledge base
- allow bulk promotion for a deliberate project or topic
- make index deletion and rebuild visible

This boundary also improves relevance. Answers grounded in a curated set are usually more useful than answers drawn from thousands of barely reviewed bookmarks.

## Keep AI output separate from personal notes

A generated summary can help evaluate a repository. It should not overwrite the sentence you wrote after using the project in production.

Store different kinds of knowledge distinctly:

- source text from the repository
- generated summary and tags
- personal note and status
- retrieved answer and citations

That separation supports deletion, re-generation, and trust. If a model changes, generated content can be rebuilt without touching personal context.

## A practical adoption sequence

You do not need every layer on day one.

1. Sync the starred list locally.
2. Add notes and status to repositories you already use.
3. Enable full-text search across metadata and notes.
4. Index READMEs only for an active research set.
5. Add semantic retrieval when vocabulary mismatch becomes a real problem.
6. Add RAG when you need synthesis across several repositories.
7. Require citations before treating answers as knowledge.

Each step should remain useful if the next one is disabled.

## What Starcat implements

Starcat separates Stars from the knowledge base. The full starred collection can be browsed and organized locally, while explicit ingestion controls the default RAG corpus. SQLite and FTS5 provide local storage and lexical retrieval. Notes, tags, summaries, README chunks, and attachments can become knowledge sources; semantic retrieval and RRF improve recall; cited answers open back to the repository and matching evidence.

The knowledge workspace is read-only by default. It does not silently modify tags, notes, or library membership. AI can suggest, but personal writes remain a user decision.

For the broader architecture choice, read [Why GitHub Stars Need a Local-First Knowledge Base](../why-local-first/). To build the everyday workflow first, start with [How to Organize GitHub Stars](../how-to-organize-github-stars/).
