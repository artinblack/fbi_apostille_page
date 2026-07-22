# Website Test Report: usauthentication.com

**Date:** 2026-07-07
**Duration:** 57.9s
**Base URL:** https://usauthentication.com → redirects to https://www.usauthentication.com/
**Health Score:** 0/100 ⚠️ *(driven almost entirely by two systemic issues below — see note)*

---

## Executive Summary

| Metric | Value |
|---|---|
| Pages Crawled | 30 |
| Working (2xx) | 29 |
| Broken (4xx/5xx/unreachable) | 1 |
| Redirects (3xx) | 0 |
| Pages with Console Errors | 29 |
| Pages with Broken Images | 0 |
| Missing Page Titles | 0 |
| Missing Meta Descriptions | 0 |
| Missing H1 | 0 |
| Average Load Time | 1,533 ms |
| Slowest Page | https://usauthentication.com (4,866 ms) |

The site is **structurally healthy** — every crawled page returns 200 (except one broken PDF link), SEO fundamentals are excellent (100% have titles, meta descriptions, and H1s), and all navigation resolves. However, the health score is dragged to 0 by **two systemic problems**: (1) a site-wide `404` on a referenced `custom.js` file that produces a console error on nearly every page, and (2) — far more serious — the **WordPress blog is loading a script from a suspicious external `.sbs` domain**, which is a strong indicator of a **malware/SEO-spam injection**. The score is an aggregate penalty; the *content* is fine, but these two issues need attention, the second one urgently.

---

## 🚨 Priority Finding — Possible Malware Injection on Blog

All 5 crawled **blog** pages (`/document-authentication-blog/…`) attempt to load a resource from:

```
https://pace-draft.sbs/x9i32md/w1/la02   → net::ERR_ABORTED / HTTP 500
```

`pace-draft.sbs` is **not** a domain associated with US Authentication or any legitimate CDN/analytics provider. The `.sbs` TLD is heavily abused for malware and spam, and an injected call to a random external host on WordPress pages is a classic symptom of a **compromised WordPress install** (hacked plugin/theme or injected DB content). Affected pages:

- `/document-authentication-blog/`
- `/document-authentication-blog/document-authentication-services/`
- `/document-authentication-blog/about-us/`
- `/document-authentication-blog/page/2/`
- `/document-authentication-blog/do-you-need-an-apostille-service/`

**Recommended action (urgent):** scan the WordPress install for injected code (check active plugins/themes, `wp_options`, `.htaccess`, and recently modified PHP files), change all WP admin + hosting + DB passwords, and run a reputable malware scanner (Wordfence / Sucuri). Until cleaned, the blog could be harming visitors and your Google reputation.

---

## Site Discovery

- **Method:** Sitemap (`/sitemap.xml`)
- **Sitemap found:** Yes
- **Pages discovered:** 30 (capped at 30)
- **Canonical note:** `https://usauthentication.com` 301-redirects to `https://www.usauthentication.com/` (the `www` host). This is fine and consistent.

---

## Page Results

| URL | Status | Title | Meta | H1 | Load | Console | Notes |
|---|---|---|---|---|---|---|---|
| / (→ www) | 200 | ✓ | ✓ | ✓ | 4,866ms | 1 | custom.js 404 |
| /index.php | 200 | ✓ | ✓ | ✓ | 1,306ms | 1 | custom.js 404 |
| /payments/ | 200 | ✓ | ✓ | ✓ | 1,183ms | 1 | custom.js 404 |
| /us-authentication-services/ | 200 | ✓ | ✓ | ✓ | 1,115ms | 1 | custom.js 404 |
| …/apostille-service.php | 200 | ✓ | ✓ | ✓ | 1,119ms | 1 | custom.js 404 |
| …/apostille-documents.php | 200 | ✓ | ✓ | ✓ | 1,073ms | 1 | custom.js 404 |
| …/fbi-background-check.php | 200 | ✓ | ✓ | ✓ | 3,351ms | 0 | clean ✅ |
| …/authentication-services.php | 200 | ✓ | ✓ | ✓ | 1,066ms | 1 | custom.js 404 |
| …/document-authentication.php | 200 | ✓ | ✓ | ✓ | 1,079ms | 1 | custom.js 404 |
| …/document-attestation.php | 200 | ✓ | ✓ | ✓ | 1,223ms | 1 | custom.js 404 |
| …/visa-documentation.php | 200 | ✓ | ✓ | ✓ | 1,163ms | 1 | custom.js 404 |
| /rates-us-authentication/ | 200 | ✓ | ✓ | ✓ | 1,081ms | 1 | custom.js 404 |
| /countries-us-authentication/ | 200 | ✓ | ✓ | ✓ | 1,084ms | 1 | custom.js 404 |
| /order-document-authentication/ | 200 | ✓ | ✓ | ✓ | 1,072ms | 1 | custom.js 404 |
| /free-quote/ | 200 | ✓ | ✓ | ✓ | 1,068ms | 1 | custom.js 404 |
| /faq-document-authentication/ | 200 | ✓ | ✓ | ✓ | 1,079ms | 1 | custom.js 404 |
| /testimonials-us-authentication/ | 200 | ✓ | ✓ | ✓ | 1,166ms | 1 | custom.js 404 |
| /document-authentication-blog/ | 200 | ✓ | ✓ | ✓ | 4,807ms | 1 | ⚠️ pace-draft.sbs 500 |
| /contact/ | 200 | ✓ | ✓ | ✓ | 1,141ms | 1 | custom.js 404 |
| /documentation-authentication-services.php | 200 | ✓ | ✓ | ✓ | 1,112ms | 1 | custom.js 404 |
| /legal/ | 200 | ✓ | ✓ | ✓ | 1,152ms | 1 | custom.js 404 |
| /sitemap.php | 200 | ✓ | ✓ | ✓ | 1,085ms | 1 | custom.js 404 |
| /department-of-state-apostille.php | 200 | ✓ | ✓ | ✓ | 1,084ms | 1 | custom.js 404 |
| /apostille-service.php | 200 | ✓ | ✓ | ✓ | 1,071ms | 1 | custom.js 404 |
| /us-authentication-services.php | 200 | ✓ | ✓ | ✓ | 1,072ms | 1 | custom.js 404 |
| **/forms/US-Auth-Order-Form.pdf** | **404** | ✗ | ✗ | ✓ | 775ms | 1 | ❌ broken link (in sitemap) |
| /…-blog/document-authentication-services/ | 200 | ✓ | ✓ | ✓ | 1,647ms | 1 | ⚠️ pace-draft.sbs 500 |
| /…-blog/about-us/ | 200 | ✓ | ✓ | ✓ | 1,642ms | 1 | ⚠️ pace-draft.sbs 500 |
| /…-blog/page/2/ | 200 | ✓ | ✓ | ✓ | 1,745ms | 1 | ⚠️ pace-draft.sbs 500 |
| /…-blog/do-you-need-an-apostille-service/ | 200 | ✓ | ✓ | ✓ | 1,817ms | 1 | ⚠️ pace-draft.sbs 500 |

---

## Console Errors

Two distinct errors account for **all** 29 flagged pages:

**1. Missing `custom.js` (24 static/PHP pages)**
```
Failed to load resource: the server responded with a status of 404 ()
→ https://www.usauthentication.com/js/custom.js  (net::ERR_ABORTED)
```
Every non-blog page references `/js/custom.js`, which does not exist on the server. Harmless to rendering but pollutes the console and wastes a request on every page load.

**2. Suspicious external script (5 blog pages)** — see the Priority Finding above.
```
Failed to load resource: the server responded with a status of 500 ()
→ https://pace-draft.sbs/x9i32md/w1/la02  (net::ERR_ABORTED)
```

The `/us-authentication-services/fbi-background-check.php` page was the **only page with zero console errors** — it doesn't reference `custom.js`.

---

## Broken Images

None detected across all 30 pages. ✅

---

## Interactive Elements (homepage)

### Buttons (1 found)
| Button Text | Result | Error |
|---|---|---|
| Toggle navigation | skipped (hidden — mobile menu) | — |

### Forms (1 found)
| Form | Input Count | Status |
|---|---|---|
| Homepage quote/contact form | 5 | filled OK |

### Navigation Links (14 found, all resolve)
Home · About Our Authentication Services · Apostille · Types of Apostille · FBI Background Check · Authentication · Document Authentication · Document Attestation · Visa Services · Rates · Countries · How to Order · Free Quote · FAQ

---

## Feature Detection

| Feature | Detected | Notes |
|---|---|---|
| Search Box | No | — |
| Modal / Dialog | No | — |
| Dropdowns (`<select>`) | No | Nav uses CSS hover menus, not `<select>` |
| Accordion | No | — |
| Tabs | No | — |
| Calculator/Converter | No | — |
| Cookie Banner | No | No GDPR/consent banner present |
| Chat Widget | No | — |
| Dark-Mode Toggle | No | — |

Nothing anomalous — this is a content/marketing site, so the absence of app-like widgets is expected.

---

## Performance

| Metric | Value |
|---|---|
| Fastest Page | …/authentication-services.php (1,066 ms) |
| Slowest Page | homepage / (4,866 ms) |
| Pages > 3s | 3 (homepage 4.87s, blog index 4.81s, fbi-background-check.php 3.35s) |
| Pages > 1.5s | 7 |
| Average (working pages) | 1,533 ms |

Most pages are snappy (~1.1s). The three slow outliers are worth a look — the homepage and blog index in particular. The blog's slowness correlates with the failed `.sbs` request timing out.

---

## Recommendations

### 🔴 High Priority
1. **Investigate the blog for a malware/SEO-spam injection.** The `pace-draft.sbs` request on every blog page is the single most important finding — treat the WordPress install as potentially compromised: scan with Wordfence/Sucuri, audit recently modified files and `wp_options`, rotate all credentials. This can poison SEO and flag your domain as unsafe.
2. **Fix the broken order-form PDF.** `/forms/US-Auth-Order-Form.pdf` is in your sitemap but returns **404**. Either re-upload the file or remove the URL from the sitemap so it doesn't hurt crawl quality.

### 🟡 Medium Priority
3. **Resolve the site-wide `custom.js` 404.** 24 pages reference `/js/custom.js` which doesn't exist. Either upload the file or remove the `<script src="/js/custom.js">` tag from the template. Fixing this clears the console error on the overwhelming majority of the site.
4. **Speed up the homepage (4.9s).** It's your most important page and the slowest. Audit large images/render-blocking resources; the FBI page (3.35s) could also use a pass.

### 🟢 Low Priority
5. **Consider a cookie/consent banner** if you serve EU visitors (none detected) — relevant given the international apostille clientele.
6. **Blog `<title>` polish:** a couple of blog posts have trailing-dash titles ("Document Authentication -", "About Us -"), suggesting a missing site-name suffix in the WP title template.

---
*Generated by Claude Code `/test_website` skill · Playwright headless Chromium · 2026-07-07*
