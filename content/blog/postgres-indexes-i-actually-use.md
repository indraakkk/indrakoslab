---
title: Postgres indexes I actually use
date: 2026-04-14
tag: Database
description: B-tree covers 90% of cases. This is about the other 10% — partial, covering, and GIN indexes that saved real queries.
---

Placeholder post — swap in your real writing. Most slow queries do not need exotic solutions; they need someone to read the EXPLAIN plan. But a few patterns come up often enough that knowing the right index shape ahead of time pays for itself.

Partial indexes are my favourite underused tool: if 95% of your queries touch rows `WHERE status = 'active'`, indexing only those rows makes the index smaller, hotter in cache, and cheaper to maintain.

> An index is a bet about your query patterns. Make the bet explicit.

Covering indexes (INCLUDE columns) turn index scans into index-only scans — the difference between touching the heap a million times and never touching it at all. And for jsonb or arrays, GIN is the answer to queries you thought Postgres could not do fast.
