# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Always Do First
- **Start the dev server** at the beginning of every session before doing anything else:
  ```
  node serve.mjs
  ```
  Primary port: `http://localhost:3000`. If port 3000 is already in use, kill the existing process first (find it with `netstat -ano | grep :3000`, then `taskkill //F //PID <pid>`), then restart. Backup port 4000 can be used by editing the `PORT` constant in `serve.mjs` if 3000 is unavailable for another reason.
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Project Overview

Static PHP website for **US Authentication Services** — specifically the FBI Background Check Apostille service page and its order form. There is no build system, bundler, or framework: all pages are single PHP files with embedded CSS and JavaScript.

**Live site:** https://usauth.basenincorp.com

**Key files:**
- `index.php` — FBI apostille landing page (marketing copy, pricing, HIW, testimonials, order form sidebar)
- `order-form.php` — Full multi-step order form with client-side pricing engine
- `config.php` — PHP constants for API keys and n8n webhook URLs (**not committed to git**; copy from `config.example.php`)
- `serve.mjs` — Local dev server (Node) at `http://localhost:3000`
- `screenshot.mjs` — Puppeteer screenshot utility

**Archived folders (do not edit):**
- `temp/` — superseded HTML versions, draft reports, reference documents
- `trial/` — one-off patch scripts and test assets from past tasks
- `design_ideas/` — experimental design prototypes, not production

## Local Server & Screenshots

Start the dev server (background):
```
node serve.mjs
```
Serves project root at `http://localhost:3000`. Do not start a second instance if one is already running.

Take a screenshot:
```
node screenshot.mjs http://localhost:3000
node screenshot.mjs http://localhost:3000 label   # saves as screenshot-N-label.png
```

- Chrome binary: `C:/Users/AB/.cache/puppeteer/chrome/win64-147.0.7727.57/chrome-win64/chrome.exe`
- Screenshots auto-increment into `./temporary screenshots/` (never overwritten)
- **Always screenshot from localhost**, never from a `file:///` URL
- After screenshotting, read the PNG with the Read tool to compare visually
- Do at least 2 screenshot/compare rounds; stop only when no visible differences remain

## Brand Assets

Always check `brand_assets/` before designing:
- `logo.jpeg` — primary logo used in both pages
- `header.png`, `image.png`, `logotop.png` — supplementary brand images
- `us_authentication_brand_guidelines.html` — color palette and brand rules
- `content.txt` — site content summary (navigation structure, copy, stats)

Use real assets; do not use placeholders where real assets exist.

## Design System (CSS Variables)

Both `index.php` and `order-form.php` share the same token names. Defined in `:root`:

| Token | Value | Use |
|---|---|---|
| `--navy` | `#042C53` | Dark headings, footer bg |
| `--navy-lt` | `#185FA5` | Links, eyebrows, accents |
| `--blue` | `#378ADD` | Highlights |
| `--orange` | `#f97316` | Primary CTA buttons |
| `--orange-dk` | `#ea580c` | Button hover |
| `--off-white` | `#f8fafc` | Section backgrounds |
| `--gray-bd` | `#e2e8f0` | Borders, dividers |

Fonts: **Inter** (body), **Georgia / Instrument Serif** (headings in `index.php`); **DM Sans** (body in `order-form.php`), **Franklin Gothic** (nav/header).

## Architecture: index.php

Single-file page. Structure (top to bottom):
1. `<?php include config.php ?>` — pulls in API constants
2. Embedded `<style>` block — all CSS, no external stylesheet
3. Site header (logo, nav with mega-dropdown, phone/email)
4. Breadcrumb
5. Page title strip with trust badges
6. Trust bar
7. 2-column layout: main content left (about, HIW carousel, pricing cards, who-needs-it, testimonials) + sidebar right (quote form, contact card)
8. Footer
9. Sticky CTA bar (appears on scroll)
10. Inline `<script>` — scroll-triggered sticky CTA only

The HIW section uses a 3-card centered grid (dark cards with SVG icons). Previous carousel version and all patch scripts are archived in `trial/`.

## Architecture: order-form.php

Multi-step form with **all pricing calculated client-side** in JavaScript. Steps:
1. Plan selection (Economy $69 / Standard $89 / Express $109 per doc)
2. Document slots (1–10 docs; each has file upload, page count, translate toggle, scan toggle, cover-page question)
3. Shipping (no shipping / FedEx US $35 / FedEx Intl $85)
4. Payment (Zelle — no fee; PayPal — +4%)
5. Signature (typed text or drawn HTML5 canvas → base64 PNG)
6. Review & submit

**Pricing formula:**
```
plan_subtotal    = plan_price × doc_count
translation_cost = $60 × (effectivePages + 1)   [effectivePages = pages - 1 if has_cover_page]
scan_cost        = $10 flat (unavailable on Express)
order_base_total = plan_subtotal + Σ(translation + scan) + shipping_cost
order_total      = order_base_total              [Zelle]
               OR = order_base_total × 1.04      [PayPal]
```

On submit, the form POSTs multipart/form-data to `N8N_UPLOAD_FORM` (defined in `config.php`). The n8n workflow creates a Gmail thread per order. Known limitation: **all pricing fields are client-side only** — n8n does no server-side verification.

## config.php

Contains four n8n webhook URLs and PayPal/FedEx credentials. The file is gitignored; `config.example.php` (in `trial/`) is the template.

```php
define('N8N_UPLOAD_FORM',        '...webhook/upload_form');   // use /webhook/ (production) not /webhook-test/
define('N8N_ADMIN_CANCEL_ORDER', '...webhook/cancel_order');
define('N8N_ADMIN_CONFIRM_PAY',  '...webhook/confirm_payment');
define('N8N_ADMIN_FETCH_ORDERS', '...webhook/fetch_orders');
define('PAYPAL_CLIENT_ID',       '...');
define('FEDEX_ENV',              'sandbox'); // change to 'production' when ready
```

`N8N_UPLOAD_FORM` must point to `/webhook/upload_form` (not `/webhook-test/`) for real orders to process. The n8n workflow must also be toggled **Active** in the n8n editor.

## Screenshot Workflow (Comparison)

When comparing against a reference image, be specific:
- "heading is 32px but reference shows ~24px"
- "card gap is 16px but should be 24px"

Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing.

## Anti-Generic Design Guardrails

- **Colors:** Never use default Tailwind palette (indigo-500, blue-600). Use brand tokens above.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states.
- **Depth:** Surfaces should have a layering system (base → elevated → floating).

## Hard Rules

- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
