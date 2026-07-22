// Test harness for the n8n "Build Emails" Code node — ADMIN email only.
// Mocks the n8n node data, runs the exact admin HTML logic, writes a preview
// file, and (if SMTP creds are provided) emails it to you.
//
// Usage:
//   Preview only (writes tools/admin-preview.html):
//     node tools/test-admin-email.mjs
//   Preview + send to your inbox:
//     GMAIL_USER=aashray.bhagtani@gmail.com GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx \
//       node tools/test-admin-email.mjs
//
// GMAIL_APP_PASSWORD = a 16-char Gmail App Password (myaccount.google.com/apppasswords),
// NOT your normal Gmail password.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── SAMPLE DATA (stands in for the n8n nodes) ─────────────────
const norm = {
  submitted_at: 'Jul 20, 2026, 2:14 PM EST',
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane.doe@example.com',
  phone: '+1 (202) 555-0142',
  plan_label: 'Standard — 8-9 Business Days',
  plan_price: '$89.00',
  doc_count: 2,
  plan_subtotal: '$178.00',
  destination_country: 'Germany',
  doc_subtotal: '$130.00',
  addons_subtotal: '$130.00',
  order_base_total: '$343.00',
  order_total: '$343.00',
  payment_method: 'zelle',
  paypal_order_id: '',
  paypal_transaction_id: '',
  paypal_payer: '',
  paypal_payer_email: '',
  zelle_payment_to: 'payments@usauthentication.com',
  zelle_payer_email: 'jane.doe@example.com',
  paypal_due: '',
  paypal_paid_now: '',
  paypal_due_amount: '',
  zelle_due: 'No',
  zelle_paid_now: '$343.00',
  zelle_due_amount: '$0.00',
  return_name: 'Jane Doe',
  return_company: 'Doe Consulting LLC',
  return_address: '1600 Pennsylvania Ave NW',
  return_city: 'Washington',
  return_state: 'DC',
  return_postal: '20500',
  return_country: 'United States',
  return_phone: '+1 (202) 555-0142',
  return_mailing: 'FedEx US — Standard Overnight',
  return_mailing_label: 'FedEx US ($35.00)',
  fedex_signature: 'Yes',
  own_shipping_label: 'No',
  docs: [
    { index: 1, hasFile: true, originalFilename: 'fbi-background-check.pdf', pages: 1, translate: 'Yes', translateLang: 'German', translationCost: '$120.00', scan: 'Yes', scanCost: '$10.00' },
    { index: 2, hasFile: true, originalFilename: 'diploma.pdf', pages: 1, translate: 'No', translateLang: '—', translationCost: '$0.00', scan: 'No', scanCost: '$0.00' },
  ],
};

const folder = { id: '1AbCdEfGhIjKlMnOpQrStUvWxYz' };
const files = [
  { id: '1file_aaaaaaaaaaaaaaaaaaaa' },
  { id: '1file_bbbbbbbbbbbbbbbbbbbb' },
];
const orderref = { order_ref: 'USA-20260720-0042' };

// ── BEGIN: logic copied verbatim from the n8n Code node ───────
const folderLink = `https://drive.google.com/drive/folders/${folder.id}`;

const docsWithFiles = norm.docs.filter(d => d.hasFile);
const fileLinks = {};
for (let i = 0; i < docsWithFiles.length; i++) {
  const file = files[i];
  if (file && file.id) {
    fileLinks[docsWithFiles[i].index] = `https://drive.google.com/file/d/${file.id}/view`;
  }
}

const row = (label, value) => `
  <tr style="border-bottom:1px solid #f0f0f0;">
    <td style="padding:8px 16px;color:#888;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;width:42%;background:#fafafa;">${label}</td>
    <td style="padding:8px 16px;color:#222;font-size:13px;">${value !== undefined && value !== null && value !== '' ? value : '—'}</td>
  </tr>`;

const section = (title, color) => `
  <tr><td colspan="2" style="background:${color};padding:9px 16px;">
    <p style="margin:0;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">${title}</p>
  </td></tr>`;

const docRows = norm.docs.map(doc => `
  <tr style="border-bottom:1px solid #eee;">
    <td style="padding:7px 10px;color:#333;font-size:12px;text-align:center;">${doc.index}</td>
    <td style="padding:7px 10px;color:#333;font-size:12px;">${doc.originalFilename}</td>
    <td style="padding:7px 10px;color:#333;font-size:12px;text-align:center;">${doc.pages}</td>
    <td style="padding:7px 10px;color:#333;font-size:12px;text-align:center;">${doc.translate}</td>
    <td style="padding:7px 10px;color:#333;font-size:12px;">${doc.translateLang}</td>
    <td style="padding:7px 10px;color:#333;font-size:12px;">${doc.translationCost}</td>
    <td style="padding:7px 10px;color:#333;font-size:12px;text-align:center;">${doc.scan}</td>
    <td style="padding:7px 10px;color:#333;font-size:12px;">${doc.scanCost}</td>
    <td style="padding:7px 10px;font-size:12px;">
      ${fileLinks[doc.index] ? `<a href="${fileLinks[doc.index]}" style="color:#1a3c6e;font-weight:600;text-decoration:none;">View ↗</a>` : '—'}
    </td>
  </tr>`).join('');

const adminHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:30px 0;">
<tr><td align="center">
<table width="700" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
  <tr><td style="background:#1a3c6e;padding:24px 32px;">
    <p style="margin:0;color:#a8c4e8;font-size:11px;text-transform:uppercase;letter-spacing:1px;">New Order Received</p>
    <h1 style="margin:6px 0 0;color:#fff;font-size:20px;">${orderref.order_ref} — ${norm.first_name} ${norm.last_name}</h1>
    <p style="margin:6px 0 0;color:#a8c4e8;font-size:13px;">Submitted: ${norm.submitted_at}</p>
  </td></tr>
  <tr><td style="padding:18px 32px;background:#f8f9fc;border-bottom:1px solid #e0e6f0;text-align:center;">
    <a href="${folderLink}" style="display:inline-block;background:#1a3c6e;color:#fff;font-size:13px;font-weight:700;text-decoration:none;padding:10px 28px;border-radius:5px;">Open Client Drive Folder ↗</a>
  </td></tr>
  <tr><td style="padding:0 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e6f0;border-radius:6px;overflow:hidden;margin:20px 0 0;">
      ${section('Client Information', '#1a3c6e')}
      ${row('Full Name', norm.first_name + ' ' + norm.last_name)}
      ${row('Email', norm.email)}
      ${row('Phone', norm.phone)}
    </table>
  </td></tr>
  <tr><td style="padding:0 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e6f0;border-radius:6px;overflow:hidden;margin:16px 0 0;">
      ${section('Order Details', '#2d4a7a')}
      ${row('Service Plan', norm.plan_label)}
      ${row('Plan Price', norm.plan_price)}
      ${row('Documents', norm.doc_count)}
      ${row('Plan Subtotal', norm.plan_subtotal)}
      ${row('Destination Country', norm.destination_country)}
      ${row('Document Subtotal', norm.doc_subtotal)}
      ${row('Base Total', norm.order_base_total)}
      ${row('Total Charged', '<strong>' + norm.order_total + '</strong>')}
    </table>
  </td></tr>
  <tr><td style="padding:0 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e6f0;border-radius:6px;overflow:hidden;margin:16px 0 0;">
      ${section('Payment', '#1e5c3a')}
      ${row('Method', norm.payment_method.toUpperCase())}
      ${row('PayPal Order ID', norm.paypal_order_id)}
      ${row('PayPal Transaction ID', norm.paypal_transaction_id)}
      ${row('PayPal Payer Name', norm.paypal_payer)}
      ${row('PayPal Payer Email', norm.paypal_payer_email)}
      ${row('Zelle Payment To', norm.zelle_payment_to)}
      ${row('Zelle Payer Email / Phone', norm.zelle_payer_email)}
      ${row('Partial Payment (PayPal)', norm.paypal_due)}
      ${row('PayPal Paid Now', norm.paypal_paid_now)}
      ${row('PayPal Balance Due', norm.paypal_due_amount)}
      ${row('Partial Payment (Zelle)', norm.zelle_due)}
      ${row('Zelle Paid Now', norm.zelle_paid_now)}
      ${row('Zelle Balance Due', norm.zelle_due_amount)}
    </table>
  </td></tr>
  <tr><td style="padding:0 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e6f0;border-radius:6px;overflow:hidden;margin:16px 0 0;">
      ${section('Return Address & Shipping', '#5c3a1e')}
      ${row('Name', norm.return_name)}
      ${row('Company', norm.return_company)}
      ${row('Address', norm.return_address)}
      ${row('City', norm.return_city)}
      ${row('State', norm.return_state)}
      ${row('Postal Code', norm.return_postal)}
      ${row('Country', norm.return_country)}
      ${row('Phone', norm.return_phone)}
      ${row('Mailing Instructions', norm.return_mailing)}
      ${row('FedEx Signature Required', norm.fedex_signature)}
      ${row('Own Shipping Label', norm.own_shipping_label)}
    </table>
  </td></tr>
  <tr><td style="padding:0 32px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e6f0;border-radius:6px;overflow:hidden;margin:16px 0 0;">
      <tr><td colspan="9" style="background:#3a1a6e;padding:9px 16px;">
        <p style="margin:0;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Documents</p>
      </td></tr>
      <tr style="background:#f0f4fa;">
        <td style="padding:7px 10px;color:#555;font-size:11px;font-weight:700;text-transform:uppercase;text-align:center;">#</td>
        <td style="padding:7px 10px;color:#555;font-size:11px;font-weight:700;text-transform:uppercase;">Filename</td>
        <td style="padding:7px 10px;color:#555;font-size:11px;font-weight:700;text-transform:uppercase;text-align:center;">Pages</td>
        <td style="padding:7px 10px;color:#555;font-size:11px;font-weight:700;text-transform:uppercase;text-align:center;">Translate</td>
        <td style="padding:7px 10px;color:#555;font-size:11px;font-weight:700;text-transform:uppercase;">Language</td>
        <td style="padding:7px 10px;color:#555;font-size:11px;font-weight:700;text-transform:uppercase;">Trans. Cost</td>
        <td style="padding:7px 10px;color:#555;font-size:11px;font-weight:700;text-transform:uppercase;text-align:center;">Scan</td>
        <td style="padding:7px 10px;color:#555;font-size:11px;font-weight:700;text-transform:uppercase;">Scan Cost</td>
        <td style="padding:7px 10px;color:#555;font-size:11px;font-weight:700;text-transform:uppercase;">File</td>
      </tr>
      ${docRows}
    </table>
  </td></tr>
  <tr><td style="background:#f0f4fa;padding:16px 32px;text-align:center;border-top:1px solid #e0e6f0;">
    <p style="margin:0;color:#aaa;font-size:12px;">US Authentication Services — Admin Notification</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

const admin_subject = `[New Order] ${orderref.order_ref} — ${norm.first_name} ${norm.last_name} (${norm.payment_method.toUpperCase()})`;
// ── END: n8n logic ───────────────────────────────────────────

// Write a local preview you can open in a browser.
const previewPath = path.join(__dirname, 'admin-preview.html');
fs.writeFileSync(previewPath, adminHtml);
console.log('✓ Preview written to', previewPath);

// Send only if creds are present.
const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;
const to = process.env.MAIL_TO || 'aashray.bhagtani@gmail.com';

if (!user || !pass) {
  console.log('\nℹ  No GMAIL_USER / GMAIL_APP_PASSWORD set — skipped sending.');
  console.log('   Open the preview file above, or re-run with creds to send.');
  process.exit(0);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass },
});

const info = await transporter.sendMail({
  from: `US Authentication (Test) <${user}>`,
  to,
  subject: admin_subject,
  html: adminHtml,
});

console.log('\n✓ Email sent:', info.messageId);
console.log('  To:', to);
