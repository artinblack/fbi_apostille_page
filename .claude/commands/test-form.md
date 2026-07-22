# /test-form

Run the Playwright order form test automation against the live form at https://apostilleagents.com/order-form.php.

## What I do when invoked

Read `workflows/test_order_form.md` first to get the full picture, then:

### If no arguments given → run all 6 default scenarios

1. Print the scenario list and expected totals from `tools/test_order_form.mjs`
2. Tell the user: "Ready to run 6 scenarios. Start your screen recording, then press ENTER in the terminal."
3. Run: `node tools/test_order_form.mjs`
4. After completion, read the generated HTML report from `scraper-reports/form_test_*.html` (most recent)
5. Report back a summary:
   - Overall: N/6 passed
   - Any pricing mismatches (displayed vs expected)
   - Whether n8n POST was intercepted per scenario
   - Improvement points from any failures

### If custom values are described → run a single custom scenario

Map the user's natural-language description to this object shape:
```json
{
  "plan": "economy|standard|express",
  "contact": { "firstName": "Test", "lastName": "User", "email": "test@example.com", "phoneCode": "+1", "phone": "5550000001" },
  "docs": [
    { "file": "1pg|3pg|5pg", "pages": 1, "translate": false, "language": "", "hasCoverPage": false, "scan": false }
  ],
  "destinationCountry": "United States",
  "mailing": {
    "noShipping": false,
    "name": "Test User", "address": "123 Main St", "city": "Springfield",
    "state": "VA", "postal": "22150", "country": "USA",
    "phoneCode": "+1", "phone": "5550000001",
    "shipping": "fedex_domestic|fedex_international"
  },
  "payment": "zelle|paypal",
  "signature": { "mode": "typed|drawn", "text": "Test User" }
}
```

For `noShipping: true` → omit the address/shipping fields, just pass `{ "noShipping": true }`.
Express plan → always set `scan: false` on all docs.

Then run: `node tools/test_order_form.mjs --scenario '<json>'`

### Flag: --allow-submit

If the user explicitly says "allow real submission" or "send to n8n", add `--allow-submit`:
```
node tools/test_order_form.mjs --allow-submit
```
This skips the intercept and sends real data to n8n — warn the user this creates actual orders.

## File locations
- Tool:     `tools/test_order_form.mjs`
- Workflow: `workflows/test_order_form.md`
- Reports:  `scraper-reports/form_test_<TIMESTAMP>.html`
- Test PDFs: `trial/test_1page.pdf`, `trial/test_3page.pdf`, `trial/test_5page.pdf`

## Pricing formula (quick reference)
```
plan_subtotal = plan_price × doc_count
translation   = $60 × (effective_pages + 1)  [effective = pages-1 if has_cover_page]
scan          = $10 flat  [Economy & Standard only]
shipping      = FedEx US $35 | FedEx International $85 | None $0
base_total    = plan_sub + addons + shipping
zelle_total   = base_total
paypal_total  = base_total × 1.04
```

## What to report back after a run
- Pass/fail per scenario with expected vs displayed total
- For any FAIL: exact assertion that failed + likely cause
- n8n payload summary (fields sent, any missing fields)
- Improvement recommendations (e.g. "pricing mismatch on Express with cover page suggests the effective_pages calculation may differ from expected")
