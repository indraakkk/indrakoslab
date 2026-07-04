---
title: Stop reaching for useEffect
date: 2025-12-09
tag: React
description: Most effects in review are derived state, event logic, or fetching in disguise. A field guide to what to use instead.
---

Placeholder post — swap in your real writing. useEffect is the goto statement of React: occasionally necessary, usually a sign the logic wants to live somewhere else. Most effects I see in code review fall into three buckets — derived state, event handling, and data fetching — and none of them need an effect.

Derived state is the easiest win: if you can compute it during render, compute it during render. A useMemo if it is expensive. Syncing two pieces of state with an effect is a race condition with extra steps.

> Effects synchronize with the outside world. If both sides of the sync are React state, you do not have an effect — you have a bug.

Event logic belongs in the handler that caused it. And fetching belongs in your framework loader or query library, which already solved caching, dedupe, and races — problems your effect has not met yet.
