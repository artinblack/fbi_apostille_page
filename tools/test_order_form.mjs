import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const TRIAL_DIR   = path.join(PROJECT_ROOT, 'trial');
const REPORT_DIR  = path.join(PROJECT_ROOT, 'scraper-reports');
const FORM_URL    = 'https://apostilleagents.com/order-form.php';

const PDF = {
  '1pg': path.join(TRIAL_DIR, 'test_1page.pdf'),
  '3pg': path.join(TRIAL_DIR, 'test_3page.pdf'),
  '5pg': path.join(TRIAL_DIR, 'test_5page.pdf'),
};

const PLAN_PRICES = { economy: 69, standard: 89, express: 109 };

// ── SCENARIOS ─────────────────────────────────────────────────────────────────

const contact = (n) => ({
  firstName: 'Test', lastName: `User${n}`,
  email: `testuser${n}@example.com`, phoneCode: '+1', phone: `555000000${n}`,
});

const address = (n) => ({
  name: `Test User${n}`, company: '', address: `${n * 100} Main Street`,
  city: 'Springfield', state: 'VA', postal: '22150', country: 'USA',
  phoneCode: '+1', phone: `555000000${n}`,
});

const SCENARIOS = [
  {
    id: 1,
    name: 'Economy | 1×1pg | No add-ons | No shipping | Zelle | Typed',
    plan: 'economy',
    contact: contact(1),
    docs: [{ file: '1pg', pages: 1, translate: false, hasCoverPage: false, scan: false }],
    destinationCountry: 'United States',
    mailing: { noShipping: true },
    payment: 'zelle',
    signature: { mode: 'typed', text: 'Test User One' },
  },
  {
    id: 2,
    name: 'Standard | 2×(3pg+5pg) | Doc1 Spanish no cover + Scan | FedEx US | Zelle | Typed',
    plan: 'standard',
    contact: contact(2),
    docs: [
      { file: '3pg', pages: 3, translate: true, language: 'Spanish', hasCoverPage: false, scan: true },
      { file: '5pg', pages: 5, translate: false, hasCoverPage: false, scan: false },
    ],
    destinationCountry: 'Spain',
    mailing: { ...address(2), shipping: 'fedex_domestic' },
    payment: 'zelle',
    signature: { mode: 'typed', text: 'Test User Two' },
  },
  {
    id: 3,
    name: 'Express | 1×5pg | French with cover page | FedEx International | Zelle | Typed',
    plan: 'express',
    contact: contact(3),
    docs: [
      { file: '5pg', pages: 5, translate: true, language: 'French', hasCoverPage: true, scan: false },
    ],
    destinationCountry: 'France',
    mailing: { ...address(3), shipping: 'fedex_international' },
    payment: 'zelle',
    signature: { mode: 'typed', text: 'Test User Three' },
  },
  {
    id: 4,
    name: 'Economy | 1×3pg | Spanish no cover + Scan | No shipping | Zelle | Drawn signature',
    plan: 'economy',
    contact: contact(4),
    docs: [
      { file: '3pg', pages: 3, translate: true, language: 'Spanish', hasCoverPage: false, scan: true },
    ],
    destinationCountry: 'Mexico',
    mailing: { noShipping: true },
    payment: 'zelle',
    signature: { mode: 'drawn' },
  },
  {
    id: 5,
    name: 'Standard | 3 docs | Doc2 Chinese no cover | Doc3 Scan | FedEx US | Zelle | Typed',
    plan: 'standard',
    contact: contact(5),
    docs: [
      { file: '1pg', pages: 1, translate: false, hasCoverPage: false, scan: false },
      { file: '1pg', pages: 1, translate: true, language: 'Chinese', hasCoverPage: false, scan: false },
      { file: '3pg', pages: 3, translate: false, hasCoverPage: false, scan: true },
    ],
    destinationCountry: 'China',
    mailing: { ...address(5), shipping: 'fedex_domestic' },
    payment: 'zelle',
    signature: { mode: 'typed', text: 'Test User Five' },
  },
  {
    id: 6,
    name: 'Express | 2 docs | No add-ons | FedEx International | PayPal (verify only) | Typed',
    plan: 'express',
    contact: contact(6),
    docs: [
      { file: '1pg', pages: 1, translate: false, hasCoverPage: false, scan: false },
      { file: '5pg', pages: 5, translate: false, hasCoverPage: false, scan: false },
    ],
    destinationCountry: 'Germany',
    mailing: { ...address(6), shipping: 'fedex_international' },
    payment: 'paypal',
    signature: { mode: 'typed', text: 'Test User Six' },
  },
];

// ── PRICING ───────────────────────────────────────────────────────────────────

function calcExpectedTotal(scenario) {
  const planPrice   = PLAN_PRICES[scenario.plan];
  const planSub     = planPrice * scenario.docs.length;
  let   addonsSub   = 0;

  for (const doc of scenario.docs) {
    const pages = doc.pages || 1;
    if (doc.translate) {
      const eff = doc.hasCoverPage ? Math.max(0, pages - 1) : pages;
      addonsSub += 60 * (eff + 1);
    }
    if (doc.scan && scenario.plan !== 'express') addonsSub += 10;
  }

  const shippingCost = scenario.mailing?.shipping === 'fedex_domestic'     ? 35
                     : scenario.mailing?.shipping === 'fedex_international' ? 85 : 0;

  const base = planSub + addonsSub + shippingCost;
  return { base, zelle: base, paypal: Math.round(base * 1.04 * 100) / 100, shipping: shippingCost };
}

// ── UTILITIES ─────────────────────────────────────────────────────────────────

async function waitForKeypress(msg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(msg, () => { rl.close(); resolve(); }));
}

function resolveDocFile(fileRef) {
  if (path.isAbsolute(fileRef)) return fileRef;
  if (PDF[fileRef])             return PDF[fileRef];
  return path.join(TRIAL_DIR, fileRef);
}

function parseAmount(text) {
  return parseFloat((text || '').replace(/[$,\s]/g, '')) || 0;
}

function assertPricing(displayedText, expected, payment) {
  const displayed   = parseAmount(displayedText);
  const expectedVal = payment === 'paypal' ? expected.base : expected.zelle;
  const pass        = Math.abs(displayed - expectedVal) < 0.02;
  return { pass, displayed, expected: expectedVal, diff: +(displayed - expectedVal).toFixed(2) };
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── N8N INTERCEPT ─────────────────────────────────────────────────────────────

async function interceptN8n(page) {
  let capturedPayload = null;
  await page.route(
    url => url.toString().includes('/webhook/'),
    async route => {
      const req = route.request();
      if (req.method() === 'POST') {
        capturedPayload = {
          url:      req.url(),
          postData: req.postData() || '(multipart binary — file attachments)',
        };
        await route.fulfill({
          status:      200,
          contentType: 'application/json',
          body:        JSON.stringify({ success: true, mocked: true }),
        });
      } else {
        await route.continue();
      }
    }
  );
  return () => capturedPayload;
}

// ── STEP 1 — CONTACT INFO ─────────────────────────────────────────────────────

async function fillStep1(page, c, assertions) {
  await page.waitForSelector('#panel-1.active', { timeout: 15000 });
  await page.fill('#first_name', c.firstName);
  await page.fill('#last_name',  c.lastName);
  await page.fill('#email',      c.email);
  try {
    await page.selectOption('#phone_code', c.phoneCode);
  } catch {
    // some builds expose phone_code as label; ignore if not found
  }
  await page.fill('#phone', c.phone);
  await page.click('button[onclick="goNext(1)"]');
  await page.waitForSelector('#panel-2.active', { timeout: 10000 });
  assertions.push({ name: 'Step 1 — Contact info completed', pass: true });
}

// ── STEP 2 — PLAN ─────────────────────────────────────────────────────────────

async function fillStep2(page, plan, assertions) {
  await page.waitForSelector('#panel-2.active', { timeout: 5000 });
  await page.click(`#plan-${plan}-card`);
  await page.waitForTimeout(300);
  await page.click('button[onclick="goNext(2)"]');
  await page.waitForSelector('#panel-3.active', { timeout: 10000 });
  assertions.push({ name: `Step 2 — Plan selected: ${plan} ($${PLAN_PRICES[plan]}/doc)`, pass: true });
}

// ── STEP 3 — DOCUMENTS ───────────────────────────────────────────────────────

async function fillStep3(page, scenario, assertions) {
  await page.waitForSelector('#panel-3.active', { timeout: 5000 });
  const docSpecs = scenario.docs;

  // Adjust doc count
  let current = parseInt(await page.textContent('#doc-count-display'), 10);
  while (current < docSpecs.length) {
    await page.click('button[onclick="changeDocCount(1)"]');
    await page.waitForTimeout(200);
    current = parseInt(await page.textContent('#doc-count-display'), 10);
  }
  while (current > docSpecs.length) {
    await page.click('button[onclick="changeDocCount(-1)"]');
    await page.waitForTimeout(200);
    current = parseInt(await page.textContent('#doc-count-display'), 10);
  }

  for (let i = 0; i < docSpecs.length; i++) {
    const spec     = docSpecs[i];
    const filePath = resolveDocFile(spec.file);

    // Upload file
    await page.locator(`#doc-card-${i} input[type="file"]`).setInputFiles(filePath);

    // Wait for upload-box to register the file
    const uploadOk = await page.waitForFunction(
      (idx) => {
        const box = document.getElementById(`upload-box-${idx}`);
        return box && box.classList.contains('has-file');
      },
      i,
      { timeout: 12000 }
    ).then(() => true).catch(() => false);

    assertions.push({ name: `Doc ${i + 1} — file uploaded (${spec.file})`, pass: uploadOk });
    await page.waitForTimeout(300); // let renderDocCards() settle

    // Cover page answer (ALWAYS rendered regardless of translation)
    try {
      const coverVal = spec.hasCoverPage ? 'yes' : 'no';
      await page.check(`input[name="cover_page_${i}"][value="${coverVal}"]`);
      await page.waitForTimeout(150);
    } catch {
      // Radio may not exist if form has not fully rendered — move on
    }

    // Translation toggle
    if (spec.translate) {
      const translateCB = page.locator(`#doc-card-${i} .doc-checks > label:first-child input[type="checkbox"]`);
      const checked = await translateCB.isChecked().catch(() => false);
      if (!checked) {
        await translateCB.check();
        await page.waitForTimeout(300); // wait for language input to render
      }
      await page.fill(`#translate-lang-${i}`, spec.language || '');
    }

    // Scan toggle (not available on Express plan)
    if (spec.scan && scenario.plan !== 'express') {
      const scanCB = page.locator(`#doc-card-${i} .doc-checks > label:last-child input[type="checkbox"]`);
      const checked = await scanCB.isChecked().catch(() => false);
      if (!checked) await scanCB.check();
    }
  }

  // Destination country (option value = country name)
  await page.selectOption('#destination_country', scenario.destinationCountry);

  await page.click('button[onclick="goNext(3)"]');
  await page.waitForSelector('#panel-4.active', { timeout: 15000 });
  assertions.push({ name: `Step 3 — ${docSpecs.length} doc(s) configured`, pass: true });
}

// ── STEP 4 — RETURN MAILING ──────────────────────────────────────────────────

async function fillStep4(page, mailing, assertions) {
  await page.waitForSelector('#panel-4.active', { timeout: 5000 });

  if (mailing.noShipping) {
    await page.check('#chk_no_shipping');
    await page.waitForTimeout(200);
    assertions.push({ name: 'Step 4 — No shipping selected', pass: true });
  } else {
    await page.fill('#return_name',    mailing.name    || '');
    if (mailing.company) await page.fill('#return_company', mailing.company);
    await page.fill('#return_address', mailing.address || '');
    await page.fill('#return_city',    mailing.city    || '');
    await page.fill('#return_state',   mailing.state   || '');
    await page.fill('#return_postal',  mailing.postal  || '');
    await page.fill('#return_country', mailing.country || '');
    try { await page.selectOption('#return_phone_code', mailing.phoneCode || '+1'); } catch { /**/ }
    if (mailing.phone) await page.fill('#return_phone', mailing.phone);

    if (mailing.shipping === 'fedex_domestic') {
      await page.check('#chk_fedex_domestic');
    } else if (mailing.shipping === 'fedex_international') {
      await page.check('#chk_fedex_international');
    }

    const shippingLabel = mailing.shipping === 'fedex_domestic' ? 'FedEx US ($35)'
                        : mailing.shipping === 'fedex_international' ? 'FedEx International ($85)' : 'None';
    assertions.push({ name: `Step 4 — Mailing address + shipping: ${shippingLabel}`, pass: true });
  }

  // Capture live total from sidebar before moving on
  const step4Total = await page.textContent('#order-total-display').catch(() => '?');
  assertions.push({ name: `Step 4 sidebar total: ${step4Total.trim()}`, pass: true, meta: { note: 'informational' } });

  await page.click('button[onclick="goNext(4)"]');
  await page.waitForSelector('#panel-5.active', { timeout: 10000 });
}

// ── STEP 5 — REVIEW & SIGN ───────────────────────────────────────────────────

async function fillStep5AndSubmit(page, scenario, expected, assertions, getPayload, allowSubmit) {
  await page.waitForSelector('#panel-5.active', { timeout: 5000 });

  // Pricing assertion — review total banner
  const reviewTotalText = await page.textContent('#review-total').catch(() => '$0.00');
  const priceResult     = assertPricing(reviewTotalText, expected, scenario.payment);
  const expectedStr     = scenario.payment === 'paypal'
    ? `$${expected.base} (base, PayPal adds 4% at checkout)`
    : `$${expected.zelle}`;
  assertions.push({
    name: `Pricing — displayed ${reviewTotalText.trim()} | expected ${expectedStr}`,
    pass: priceResult.pass,
    meta: priceResult,
  });

  // Signature
  if (scenario.signature.mode === 'drawn') {
    await page.click('#tab-draw');
    await page.waitForSelector('#signature-canvas', { timeout: 5000 });
    await page.waitForTimeout(500); // let switchSignMode('draw') call initSignPad() and size the canvas

    // Dispatch MouseEvents directly on the canvas element to reliably trigger
    // signPadDrawing and signPadHasContent inside the form's own event listeners.
    const drawn = await page.evaluate(() => {
      const canvas = document.getElementById('signature-canvas');
      if (!canvas) return false;
      const rect = canvas.getBoundingClientRect();
      const startX = rect.left + 20;
      const endX   = rect.left + rect.width - 20;
      const midY   = rect.top  + rect.height / 2;

      canvas.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: startX, clientY: midY }));
      for (let x = startX; x <= endX; x += 8) {
        canvas.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: x, clientY: midY }));
      }
      canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: endX, clientY: midY }));

      // Second stroke for a more realistic signature
      const s2x = rect.left + 30;
      const s2y = rect.top  + rect.height / 2 - 12;
      canvas.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: s2x, clientY: s2y }));
      for (let i = 0; i <= 20; i++) {
        canvas.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true,
          clientX: s2x + (rect.width / 2 - 30) * (i / 20),
          clientY: s2y + 24 * (i / 20) }));
      }
      canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));

      return true;
    });
    assertions.push({ name: 'Step 5 — Drawn signature applied on canvas', pass: drawn });
  } else {
    await page.click('#tab-type');
    await page.fill('#signature', scenario.signature.text || 'Test Signature');
    assertions.push({ name: `Step 5 — Typed signature: "${scenario.signature.text}"`, pass: true });
  }

  // PayPal scenario — verify button is present, do NOT click (avoids external popup)
  if (scenario.payment === 'paypal') {
    let ppRendered = false;
    try {
      await page.waitForFunction(
        () => (document.querySelector('#paypal-button-container')?.children.length || 0) > 0,
        { timeout: 20000 }
      );
      ppRendered = true;
    } catch { /**/ }
    assertions.push({
      name: 'Step 5 — PayPal button rendered in #paypal-button-container',
      pass: ppRendered,
      meta: { note: 'PayPal click skipped — would open external popup' },
    });
    await page.waitForTimeout(1500);
    return { skippedPayPalClick: true, payload: null };
  }

  // Zelle submit
  await page.fill('#zelle-payer-email', scenario.contact.email);
  await page.waitForTimeout(200);
  await page.click('#zelle-submit-btn');

  let successShown = false;
  try {
    await page.waitForSelector('#panel-success.active', { timeout: 20000 });
    successShown = true;
  } catch { /**/ }

  const payload = getPayload();
  assertions.push({
    name: allowSubmit
      ? 'n8n POST sent (--allow-submit mode, real submission)'
      : `n8n POST intercepted (${payload ? 'payload captured' : 'no payload — check webhook URL pattern'})`,
    pass: allowSubmit || !!payload,
    meta: payload ? { url: payload.url } : null,
  });
  assertions.push({ name: 'Success panel shown', pass: successShown });

  await page.waitForTimeout(1500);
  return { payload };
}

// ── SCENARIO ORCHESTRATOR ─────────────────────────────────────────────────────

async function runScenario(browser, scenario, allowSubmit) {
  const t0         = Date.now();
  const assertions = [];
  let   payload    = null;

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page    = await context.newPage();

  let getPayload = () => null;
  if (!allowSubmit) getPayload = await interceptN8n(page);

  try {
    await page.goto(FORM_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const expected = calcExpectedTotal(scenario);

    await fillStep1(page, scenario.contact, assertions);
    await fillStep2(page, scenario.plan, assertions);
    await fillStep3(page, scenario, assertions);
    await fillStep4(page, scenario.mailing, assertions);
    const result = await fillStep5AndSubmit(page, scenario, expected, assertions, getPayload, allowSubmit);
    payload = result?.payload;
  } catch (err) {
    assertions.push({ name: `FATAL: ${err.message}`, pass: false, meta: { stack: err.stack?.slice(0, 300) } });
    // Screenshot on error
    const errShot = path.join(REPORT_DIR, `error_s${scenario.id}_${Date.now()}.png`);
    await page.screenshot({ path: errShot, fullPage: false }).catch(() => {});
    console.error(`    ↳ error screenshot: ${path.relative(PROJECT_ROOT, errShot)}`);
  } finally {
    await context.close();
  }

  const pass = assertions.filter(a => !a.meta?.note).every(a => a.pass);
  return { scenario, pass, assertions, payload, durationMs: Date.now() - t0, expected: calcExpectedTotal(scenario) };
}

// ── HTML REPORT ───────────────────────────────────────────────────────────────

function generateHtmlReport(results, timestamp) {
  const total  = results.length;
  const passed = results.filter(r => r.pass).length;

  const cards = results.map(r => {
    const exp    = r.expected;
    const expStr = r.scenario.payment === 'paypal'
      ? `$${exp.base} base · $${exp.paypal} w/ PayPal 4%`
      : `$${exp.zelle}`;

    const rows = r.assertions.map(a => {
      const icon  = a.pass ? '✓' : '✗';
      const cls   = a.pass ? 'pass' : (a.meta?.note === 'informational' ? 'info' : 'fail');
      const meta  = a.meta ? `<span class="meta">${escHtml(JSON.stringify(a.meta))}</span>` : '';
      return `<tr class="${cls}"><td class="icon">${icon}</td><td>${escHtml(a.name)}${meta}</td></tr>`;
    }).join('');

    const payloadBlock = r.payload
      ? `<details><summary>n8n POST payload</summary><pre>${escHtml(JSON.stringify(r.payload, null, 2))}</pre></details>`
      : r.scenario.payment === 'paypal'
        ? `<p class="pp-note">PayPal scenario — submission skipped. PayPal button presence verified above.</p>`
        : '';

    return `
<div class="card ${r.pass ? 'pass' : 'fail'}">
  <div class="card-head">
    <span class="badge ${r.pass ? 'pass' : 'fail'}">${r.pass ? 'PASS' : 'FAIL'}</span>
    <span class="card-title">${escHtml(r.scenario.name)}</span>
    <span class="dur">${(r.durationMs / 1000).toFixed(1)}s</span>
  </div>
  <div class="expected">Expected total: <strong>${expStr}</strong></div>
  <table class="checks"><tbody>${rows}</tbody></table>
  ${payloadBlock}
</div>`;
  }).join('\n');

  const improvementItems = results
    .filter(r => !r.pass)
    .flatMap(r =>
      r.assertions
        .filter(a => !a.pass && a.meta?.note !== 'informational')
        .map(a => `<li><strong>Scenario ${r.scenario.id}:</strong> ${escHtml(a.name)}</li>`)
    ).join('');

  const improvementBlock = improvementItems
    ? `<div class="improvements"><h2>Improvement Points</h2><ul>${improvementItems}</ul></div>`
    : `<div class="all-good">All scenarios passed. No issues found.</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Order Form Test Report — ${timestamp}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',system-ui,sans-serif;background:#f4f7fb;color:#1a2236;padding:28px;line-height:1.5}
  h1{color:#042c53;font-size:1.45rem;margin-bottom:4px}
  .meta-line{font-size:12px;color:#6b7694;margin-bottom:22px}
  code{background:#e8edf4;padding:2px 7px;border-radius:4px;font-size:11px}
  .summary{display:flex;gap:16px;margin-bottom:22px}
  .sum-box{background:white;border-radius:10px;padding:14px 22px;text-align:center;box-shadow:0 2px 12px rgba(4,44,83,.07)}
  .sum-box .n{font-size:2.2rem;font-weight:800;line-height:1}
  .sum-box .n.pass{color:#1a9e75} .sum-box .n.fail{color:#d94040} .sum-box .n.neu{color:#185fa5}
  .sum-box .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#6b7694;margin-top:3px}
  .improvements{background:#fff8f0;border:2px solid #f97316;border-radius:10px;padding:16px 20px;margin-bottom:20px}
  .improvements h2{color:#ea580c;font-size:13.5px;margin-bottom:8px}
  .improvements ul{padding-left:18px;font-size:13px} .improvements li{margin-bottom:4px}
  .all-good{background:#f0faf6;border:2px solid #1a9e75;border-radius:10px;padding:14px 20px;margin-bottom:20px;font-size:13px;color:#1a9e75;font-weight:600}
  .card{background:white;border-radius:10px;border:2px solid;margin-bottom:14px;overflow:hidden;box-shadow:0 2px 10px rgba(4,44,83,.06)}
  .card.pass{border-color:#1a9e75} .card.fail{border-color:#d94040}
  .card-head{display:flex;align-items:center;gap:10px;padding:13px 18px;border-bottom:1px solid #edf0f5}
  .card-title{flex:1;font-size:13.5px;font-weight:600} .dur{font-size:11px;color:#6b7694}
  .badge{padding:3px 10px;border-radius:20px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;flex-shrink:0}
  .badge.pass{background:#e1f5ee;color:#1a9e75} .badge.fail{background:#fde8e8;color:#d94040}
  .expected{padding:8px 18px;font-size:12px;color:#6b7694;background:#f8fafc;border-bottom:1px solid #edf0f5}
  .checks{width:100%;border-collapse:collapse;font-size:12.5px}
  .checks tr{border-bottom:1px solid #f0f4f8} .checks tr:last-child{border:none}
  .checks td{padding:7px 18px;vertical-align:top}
  .checks .icon{width:22px;font-weight:700;padding-right:4px}
  .checks tr.pass .icon{color:#1a9e75} .checks tr.fail .icon{color:#d94040} .checks tr.info .icon{color:#6b7694}
  .meta{display:block;font-size:10.5px;color:#6b7694;margin-top:2px;word-break:break-all}
  details{padding:12px 18px;border-top:1px solid #edf0f5}
  summary{font-size:12px;font-weight:600;color:#042c53;cursor:pointer;user-select:none}
  pre{background:#1a2236;color:#e2e8f0;border-radius:8px;padding:14px;font-size:10.5px;overflow:auto;max-height:280px;margin-top:8px}
  .pp-note{padding:10px 18px;font-size:12px;color:#6b7694;font-style:italic;border-top:1px solid #edf0f5}
</style>
</head>
<body>
<h1>Order Form Test Report</h1>
<p class="meta-line">Run: ${timestamp} &nbsp;·&nbsp; URL: <a href="${FORM_URL}">${FORM_URL}</a> &nbsp;·&nbsp; Re-run: <code>node tools/test_order_form.mjs</code></p>
<div class="summary">
  <div class="sum-box"><div class="n pass">${passed}</div><div class="lbl">Passed</div></div>
  <div class="sum-box"><div class="n ${total - passed > 0 ? 'fail' : 'pass'}">${total - passed}</div><div class="lbl">Failed</div></div>
  <div class="sum-box"><div class="n neu">${total}</div><div class="lbl">Total</div></div>
</div>
${improvementBlock}
${cards}
</body>
</html>`;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  const args        = process.argv.slice(2);
  const allowSubmit = args.includes('--allow-submit');
  const scenIdx     = args.indexOf('--scenario');
  let   scenarios   = SCENARIOS;

  if (scenIdx !== -1 && args[scenIdx + 1]) {
    try {
      const custom = JSON.parse(args[scenIdx + 1]);
      scenarios = [{ id: 0, name: 'Custom scenario', ...custom }];
      console.log('Running custom scenario:', custom.name || '(unnamed)');
    } catch (e) {
      console.error('Invalid --scenario JSON:', e.message);
      process.exit(1);
    }
  }

  // Verify test PDFs exist
  for (const [key, p] of Object.entries(PDF)) {
    if (!fs.existsSync(p)) {
      console.error(`Missing test PDF (${key}): ${p}`);
      process.exit(1);
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       US Authentication — Order Form Test Suite         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\n  Target  : ${FORM_URL}`);
  console.log(`  Scenarios: ${scenarios.length}`);
  console.log(`  n8n     : ${allowSubmit ? 'REAL submissions (--allow-submit)' : 'INTERCEPTED (no real orders created)'}`);

  console.log('\n  Expected totals:');
  for (const s of scenarios) {
    const exp = calcExpectedTotal(s);
    const tot = s.payment === 'paypal' ? `$${exp.base} base / $${exp.paypal} PayPal` : `$${exp.zelle}`;
    console.log(`    [${s.id}] ${s.name.padEnd(55)} → ${tot}`);
  }

  await waitForKeypress('\n▶  Set up your screen recording, then press ENTER to start...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo:   150,
    args:     ['--no-sandbox'],
  });

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const results = [];

  for (const scenario of scenarios) {
    console.log(`\n[${scenario.id}/${scenarios.length}] Starting: ${scenario.name}`);
    const result = await runScenario(browser, scenario, allowSubmit);
    results.push(result);

    const failCount = result.assertions.filter(a => !a.pass && a.meta?.note !== 'informational').length;
    const status    = result.pass ? '✓ PASS' : `✗ FAIL (${failCount} check${failCount !== 1 ? 's' : ''} failed)`;
    console.log(`    ${status} · ${(result.durationMs / 1000).toFixed(1)}s`);
    if (!result.pass) {
      result.assertions.filter(a => !a.pass).forEach(a => console.log(`      ✗ ${a.name}`));
    }
  }

  await browser.close();

  const timestamp  = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportPath = path.join(REPORT_DIR, `form_test_${timestamp}.html`);
  fs.writeFileSync(reportPath, generateHtmlReport(results, timestamp));

  const passCount = results.filter(r => r.pass).length;
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log(`║  Results : ${passCount}/${results.length} passed${' '.repeat(36 - String(passCount).length)}║`);
  console.log(`║  Report  : ${path.relative(PROJECT_ROOT, reportPath)}${' '.repeat(Math.max(0, 36 - path.relative(PROJECT_ROOT, reportPath).length))}║`);
  console.log('╚══════════════════════════════════════════════════╝\n');
}

main().catch(err => { console.error('\nFatal error:', err.message); process.exit(1); });
