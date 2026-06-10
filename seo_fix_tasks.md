# SEO Fix Task List (from Screaming Frog report, 6-9)

This is an actionable backlog for a coding agent (Claude Code). Tasks are ordered by priority.
Each task says **what to fix**, **where to look**, and **done =** (acceptance criteria).

## ⚠️ Read this first
The source report gives issue counts and percentages but **NOT the specific URLs/files** affected.
For any task marked `[needs URL list]`, do ONE of these before fixing:
1. Have the agent grep/scan the codebase to locate the affected pages/templates, OR
2. Export the per-issue URL list from Screaming Frog (use the "Bulk Export" / "inlinks" exports
   named in each issue) and paste the URLs into the task.

Also: identify the stack first (Next.js / Astro / plain HTML / WordPress / etc.). Several fixes
(canonical tags, security headers, image attributes) are implemented differently per stack.
Confirm where the `<head>` is generated (a layout/template file vs. per-page) — most of these
fixes belong in a shared layout, not in 24 separate files.

---

## 🔴 HIGH PRIORITY

### 1. Fix internal 4xx broken links — 5 URLs `[needs URL list]`
- **What:** Internal links pointing to pages that return 400/403/404/410/429. Most are likely 404 broken links.
- **Where:** Find the linking pages (the source of the link), not just the dead target.
- **Do:**
  - Locate every internal `<a href>` / `Link` resolving to a 4xx URL.
  - For each: correct the href to the right live URL, OR remove the link, OR add a 301 redirect
    from the old target to its replacement.
- **Done =** All internal links resolve to 200. No internal link points to a 4xx URL. Redirects
  added where the old URL must keep working.

### 2. Resolve exact-duplicate content pages — 2 URLs `[needs URL list]`
- **What:** Two pages with byte-identical HTML (same MD5). Splits ranking signals.
- **Do:**
  - Pick ONE canonical URL to keep.
  - Add `<link rel="canonical">` on the duplicate(s) pointing to the kept version.
  - 301-redirect the duplicate URL to the canonical version and remove all internal links to the duplicate.
- **Done =** Only one canonical version is linked internally; the duplicate 301-redirects to it.

---

## 🟠 MEDIUM PRIORITY

### 3. Add missing canonical tags — 4 URLs (100% of crawled) — STRUCTURAL `[needs URL list]`
- **What:** Pages with no canonical URL (neither `<link rel="canonical">` nor HTTP header).
- **Do:** Add a self-referencing canonical to the shared page `<head>`/layout so every page emits
  `<link rel="canonical" href="<absolute-page-URL>">`. Use absolute URLs.
- **Done =** Every indexable page outputs exactly one valid self-referencing canonical.

### 4. Shorten over-length page titles — 3 URLs (>60 chars / >561px) — CONTENT `[needs URL list]`
- **What:** Titles exceed Google's pixel/char limit and get truncated.
- **Do:** Rewrite titles to ~50–60 characters, front-loading the important keywords.
- **Human input:** Approve/supply the rewritten titles — agent can propose, you confirm.
- **Done =** Each affected title ≤ ~60 chars / ~561px, keyword-leading, still unique.

### 5. De-duplicate page titles — 2 URLs — CONTENT `[needs URL list]`
- **What:** Multiple pages share the same `<title>`.
- **Do:** Give each page a unique, descriptive title. If the pages are actually duplicates,
  consolidate them (canonical + redirect) instead.
- **Human input:** Approve unique titles.
- **Done =** No two indexable pages share a title.

### 6. Add missing H1 — 1 URL — CONTENT/STRUCTURAL `[needs URL list]`
- **What:** A page has an empty/whitespace/missing `<h1>`.
- **Do:** Add a single, descriptive `<h1>` that states the page's main topic.
- **Done =** Page has exactly one non-empty, descriptive `<h1>`.

### 7. Optimize oversized image — 1 URL (>100 kB) — STRUCTURAL `[needs URL list]`
- **What:** Image file large enough to slow page load.
- **Do:** Compress and re-encode (prefer WebP/AVIF), scale to the actual rendered size, add
  `loading="lazy"` if offscreen. Replace the reference in code.
- **Done =** Image meaningfully reduced in size (target well under 100 kB where quality allows),
  served in a modern format.

---

## 🟡 LOW PRIORITY

### 8. Add `width` + `height` to all images — 3 URLs (100%) — STRUCTURAL `[needs URL list]`
- **What:** Images lack intrinsic dimensions → Cumulative Layout Shift (CLS).
- **Do:** Add native `width` and `height` attributes (or framework equivalents like `next/image`
  with width/height) to every `<img>`. Reserve space before load.
- **Done =** Every `<img>` declares width and height; no layout shift from images.

### 9. Add `rel="noopener"` to `target="_blank"` links — 3 URLs — STRUCTURAL `[needs URL list]`
- **What:** External links opening in a new tab without `rel="noopener"`/`noreferrer"`.
- **Do:** Add `rel="noopener noreferrer"` to every `<a target="_blank">` to an external site.
- **Done =** No `target="_blank"` external link lacks `rel="noopener"`.

### 10. Fix duplicate meta descriptions — 2 URLs — CONTENT `[needs URL list]`
- **What:** Pages share the same meta description.
- **Do:** Write a unique, benefit-driven description per page (or consolidate if truly duplicate pages).
- **Human input:** Approve descriptions.
- **Done =** No two pages share a meta description.

### 11. Add missing meta description — 1 URL — CONTENT `[needs URL list]`
- **What:** A page has no meta description.
- **Do:** Add a unique ~140–155 char description summarizing the page's value.
- **Done =** Page has a unique, in-length meta description.

### 12. Shorten over-length meta descriptions — 1 URL (>155 chars / >985px) — CONTENT `[needs URL list]`
- **Do:** Trim to ~150–155 chars so it isn't truncated.
- **Done =** Description within length, key message in the first part.

### 13. De-duplicate H1s — 2 URLs — CONTENT `[needs URL list]`
- **Do:** Make each page's `<h1>` unique and descriptive (or consolidate duplicate pages).
- **Done =** No two pages share an identical `<h1>`.

### 14. Review duplicate / multiple H2s — 3 + 2 URLs — CONTENT (review) `[needs URL list]`
- **What:** Multiple `<h2>`s (allowed) and duplicate `<h2>`s across pages.
- **Do:** Confirm the heading hierarchy is logical (h2 → h3 → h4...); make repeated H2s unique
  where they describe different content. Multiple H2s are fine if hierarchical — this is a review, not a forced rewrite.
- **Done =** Headings form a logical hierarchy; no accidental duplicate H2s.

### 15. Fix URL containing a space — 1 URL — STRUCTURAL `[needs URL list]`
- **What:** A URL/file/route contains a space.
- **Do:** Rename to use hyphens as word separators, update all internal links, and add a 301
  redirect from the old URL to the new one.
- **Done =** No URL contains a space; old URL 301s to the new hyphenated URL.

### 16. Review pages with high external outlinks — 3 URLs — REVIEW (manual) `[needs URL list]`
- **What:** Pages with many followed external links.
- **Do:** Confirm outbound links are to credible, relevant sites. Add `rel="nofollow"`/`sponsored"`
  only where appropriate (paid/untrusted). Usually no code change needed — this is a judgment review.
- **Done =** External outlinks reviewed; nofollow applied only where warranted.

---

## 🔒 SECURITY HEADERS (Low priority, but cheap to fix together)
These are **server/config level**, not per-page edits. Implement once in the right place for your
stack: `next.config.js` headers / middleware, `vercel.json`, `netlify.toml`, an nginx/Apache config,
or a `_headers` file. Apply across all pages.

### 17. Add the following response headers site-wide — 7 URLs each
- **Referrer-Policy:** `strict-origin-when-cross-origin`
- **Strict-Transport-Security (HSTS):** e.g. `max-age=31536000; includeSubDomains` (only enable
  once you're confident the whole site is HTTPS-only).
- **X-Frame-Options:** `SAMEORIGIN` (or `DENY`)
- **X-Content-Type-Options:** `nosniff`
- **Content-Security-Policy:** start with a sensible policy and tighten manually — do NOT ship an
  overly strict CSP blind, as it can break scripts/styles. Test in `Content-Security-Policy-Report-Only`
  first if unsure.
- **Done =** All five headers present on responses across the site; CSP verified not to break the app.

---

## Suggested execution order for the agent
1. Identify stack + locate the shared `<head>`/layout and the server/headers config.
2. Do the site-wide structural fixes once in shared files: canonicals (#3), security headers (#17),
   image dimensions (#8), `rel="noopener"` (#9).
3. Do investigate-then-fix tasks: 4xx links (#1), duplicate content (#2), URL with space (#15).
4. Do content tasks last, surfacing each proposed title/description/heading for human approval
   (#4, #5, #6, #10, #11, #12, #13, #14).
5. Re-crawl with Screaming Frog to confirm issues cleared.
