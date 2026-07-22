# Workflow: test_order_form

## Objective
Run end-to-end Playwright tests against the live order form, verify all pricing calculations, capture the n8n webhook payload, and produce an HTML report — without creating real orders.

## Trigger
Manual. Run before releases, after any form or pricing changes, or on demand via `/test-form`.

## Prerequisites
- Node.js with Playwright installed (`node_modules/` present)
- Test PDFs in `trial/`: `test_1page.pdf`, `test_3page.pdf`, `test_5page.pdf`
- Live site reachable: `https://apostilleagents.com/order-form.php`

## Command

```bash
# Default — all 6 scenarios, n8n intercepted (no real orders)
node tools/test_order_form.mjs

# Allow real n8n submissions (creates actual orders)
node tools/test_order_form.mjs --allow-submit

# Single custom scenario (JSON string)
node tools/test_order_form.mjs --scenario '{"plan":"economy","docs":[{"file":"1pg","pages":1,"translate":false,"hasCoverPage":false,"scan":false}],"destinationCountry":"United States","mailing":{"noShipping":true},"payment":"zelle","signature":{"mode":"typed","text":"Test"},"contact":{"firstName":"Test","lastName":"User","email":"t@t.com","phoneCode":"+1","phone":"5550000001"}}'
```

## Steps (automated by the tool)

1. **Startup** — Print scenario list with expected totals, wait for ENTER keypress (gives time to start screen recording)
2. **Browser launch** — Chromium, `headless: false`, `slowMo: 150ms` — fully visible
3. **For each of 6 scenarios** (own browser context, sequential):
   - Register n8n POST intercept on `url.includes('/webhook/')`
   - Navigate to form
   - Step 1: Fill contact info
   - Step 2: Select plan card
   - Step 3: Set doc count, upload files (wait for `has-file` class), set cover page, translation + language, scan
   - Step 4: Fill mailing address and shipping checkbox, capture sidebar total
   - Step 5: Assert `#review-total` against expected, apply signature (typed or drawn), submit via Zelle or verify PayPal button
   - Capture n8n intercepted payload
4. **After all scenarios** — Close browser, write HTML report to `scraper-reports/`

## Output
- Console: per-scenario PASS/FAIL with timing
- HTML report: `scraper-reports/form_test_YYYY-MM-DDTHH-MM-SS.html`
  - Summary bar (N/6 passed)
  - Per-scenario: assertions table, captured n8n payload, improvement points for failures

## Pricing Formulas (verified against form source)

```
plan_subtotal   = plan_price × doc_count
effective_pages = has_cover_page ? pages - 1 : pages
translation     = $60 × (effective_pages + 1) per doc
scan            = $10 flat per doc  [Economy & Standard only, not Express]
shipping        = FedEx US $35 | FedEx International $85 | None $0
base_total      = plan_subtotal + Σ(translation + scan) + shipping
zelle_total     = base_total
paypal_total    = base_total × 1.04
```

## Default Scenario Matrix

| # | Plan | Docs | Translation | Scan | Shipping | Payment | Signature | Expected |
|---|------|------|-------------|------|----------|---------|-----------|----------|
| 1 | Economy $69 | 1×1pg | — | — | None | Zelle | Typed | $69 |
| 2 | Standard $89 | 2×(3pg+5pg) | Doc1 Spanish no cover | Doc1 | FedEx US | Zelle | Typed | $463 |
| 3 | Express $109 | 1×5pg | French has cover → 4 eff | — | FedEx Intl | Zelle | Typed | $494 |
| 4 | Economy $69 | 1×3pg | Spanish no cover | Yes | None | Zelle | **Drawn** | $319 |
| 5 | Standard $89 | 3 docs | Doc2 Chinese no cover | Doc3 | FedEx US | Zelle | Typed | $432 |
| 6 | Express $109 | 2 docs | — | — | FedEx Intl | **PayPal** | Typed | $303 base / $315.12 |

### Calculation breakdown
- S1: `69×1 = $69`
- S2: `89×2 + (60×4) + 10 + 35 = 178 + 240 + 10 + 35 = $463`
- S3: `109×1 + (60×5) + 85 = 109 + 300 + 85 = $494` *(5pg with cover → 4 eff → 60×(4+1)=300)*
- S4: `69×1 + (60×4) + 10 = 69 + 240 + 10 = $319`
- S5: `89×3 + (60×2) + 10 + 35 = 267 + 120 + 10 + 35 = $432`
- S6: `109×2 + 85 = 218 + 85 = $303` *(PayPal: 303×1.04 = $315.12)*

## Known Behaviors & Edge Cases

**Express plan:** The scan checkbox is never rendered for Express plan docs. The tool skips scan interaction for Express scenarios.

**Cover page radios:** Always rendered for every document slot, not conditional on translation. The tool always answers cover page (yes/no) for every doc.

**Translation language input `#translate-lang-N`:** Only inserted into DOM after the translation checkbox is checked. The tool waits 300ms after checking before filling.

**PayPal button:** The PayPal SDK loads async and renders into `#paypal-button-container`. Clicking it opens an external popup (new browser window). Scenario 6 verifies the button is present but does NOT click it.

**n8n route pattern:** `url.includes('/webhook/')` catches the n8n URL. If the webhook URL ever changes to a path not containing `/webhook/`, update the intercept pattern in `tools/test_order_form.mjs → interceptN8n()`.

**`--allow-submit` flag:** Disables the route intercept entirely. The POST reaches the real n8n. Use only when you want to test the full n8n workflow — this creates actual order entries.

**Canvas signature:** `switchSignMode('draw')` must be triggered (via `#tab-draw` click) before the canvas is sized. The tool waits 400ms after the tab click before drawing.

**File upload:** `input[type="file"]` is `opacity:0` overlay. Playwright's `setInputFiles()` targets it directly — no need for `force: true`.

## Updating This Workflow

When you find selector changes, new validation rules, or timing quirks:
1. Fix the tool (`tools/test_order_form.mjs`)
2. Verify the fix works by re-running
3. Document the change in the "Known Behaviors" section above
