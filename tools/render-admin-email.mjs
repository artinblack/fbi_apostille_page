// Renders the admin order-notification email (from the n8n function node)
// into a standalone HTML file using realistic sample data.
// Usage: node tools/render-admin-email.mjs  ->  writes tools/admin-email.html
import { writeFileSync } from 'node:fs';

// ── SAMPLE DATA (stand-ins for the n8n node inputs) ───────────
const orderref = { order_ref: 'USA-2026-04817' };
const folder = { id: '1A2b3C4d5E6f7G8h9I0jKlMnOpQrStUv' };
const folderLink = `https://drive.google.com/drive/folders/${folder.id}`;

const norm = {
  submitted_at: 'July 20, 2026 · 2:14 PM EST',
  first_name: 'Jonathan',
  last_name: 'Whitfield',
  email: 'jonathan.whitfield@example.com',
  phone: '+1 (202) 555-0193',
  plan_label: 'Standard — 5–6 Business Days',
  plan_price: '$89.00',
  doc_count: 2,
  plan_subtotal: '$178.00',
  destination_country: 'United Arab Emirates',
  doc_subtotal: '$130.00',
  order_base_total: '$343.00',
  order_total: '$356.72',
  payment_method: 'paypal',
  paypal_order_id: '8XJ29174KM3820145',
  paypal_transaction_id: '3RK88291LP7742019',
  paypal_payer: 'Jonathan Whitfield',
  paypal_payer_email: 'jonathan.whitfield@example.com',
  zelle_payment_to: '',
  zelle_payer_email: '',
  paypal_due: 'No',
  paypal_paid_now: '$356.72',
  paypal_due_amount: '$0.00',
  zelle_due: '',
  zelle_paid_now: '',
  zelle_due_amount: '',
  return_name: 'Jonathan Whitfield',
  return_company: 'Whitfield Consulting LLC',
  return_address: '4820 Massachusetts Ave NW, Suite 210',
  return_city: 'Washington',
  return_state: 'DC',
  return_postal: '20016',
  return_country: 'United States',
  return_phone: '+1 (202) 555-0193',
  return_mailing: 'FedEx US — Signature Required',
  return_mailing_label: 'FedEx US ($35.00)',
  fedex_signature: 'Yes',
  own_shipping_label: 'No',
  plan_subtotal_label: '$178.00',
  addons_subtotal: '$130.00',
  docs: [
    {
      index: 1,
      hasFile: true,
      originalFilename: 'FBI_Background_Check.pdf',
      pages: 2,
      translate: 'Yes',
      translateLang: 'Arabic',
      translationCost: '$60.00',
      scan: 'Yes',
      scanCost: '$10.00',
    },
    {
      index: 2,
      hasFile: true,
      originalFilename: 'Diploma_UMD.pdf',
      pages: 1,
      translate: 'Yes',
      translateLang: 'Arabic',
      translationCost: '$60.00',
      scan: 'No',
      scanCost: '$0.00',
    },
  ],
};

// Fake drive file links keyed by doc index
const fileLinks = {
  1: 'https://drive.google.com/file/d/1FILEaaaAAAbbbCCCddd111/view',
  2: 'https://drive.google.com/file/d/1FILEbbbBBBcccDDDeee222/view',
};

// ── ADMIN EMAIL (verbatim from the n8n node) ──────────────────
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
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:24px 0;">
<tr><td align="center">
<table width="720" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">

  <!-- COMPACT HEADER -->
  <tr><td style="background:#1a3c6e;padding:14px 18px;">
    <p style="margin:0;color:#a8c4e8;font-size:9px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">New Order Received</p>
    <h1 style="margin:3px 0 0;color:#fff;font-size:16px;font-weight:700;">${orderref.order_ref} — ${norm.first_name} ${norm.last_name}</h1>
    <p style="margin:3px 0 0;color:#a8c4e8;font-size:11px;">Submitted: ${norm.submitted_at}</p>
  </td></tr>

  <!-- TWO-COLUMN BODY -->
  <tr><td style="padding:16px 18px 0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <!-- LEFT COLUMN: Client Information + Payment -->
        <td width="50%" valign="top" style="padding-right:8px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e6f0;border-radius:6px;overflow:hidden;">
            ${section('Client Information', '#1a3c6e')}
            ${row('Full Name', norm.first_name + ' ' + norm.last_name)}
            ${row('Email', norm.email)}
            ${row('Phone', norm.phone)}
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e6f0;border-radius:6px;overflow:hidden;margin:14px 0 0;">
            ${section('Payment', '#1e5c3a')}
            ${row('Method', norm.payment_method.toUpperCase())}
            ${row('PayPal Order ID', norm.paypal_order_id)}
            ${row('PayPal Transaction ID', norm.paypal_transaction_id)}
            ${row('PayPal Payer Name', norm.paypal_payer)}
            ${row('PayPal Payer Email', norm.paypal_payer_email)}
            ${row('Zelle Payment To', norm.zelle_payment_to)}
            ${row('Zelle Payer Email / Phone', norm.zelle_payer_email)}
            ${row('PayPal Paid Now', norm.paypal_paid_now)}
            ${row('Zelle Paid Now', norm.zelle_paid_now)}
          </table>
        </td>

        <!-- RIGHT COLUMN: Order Details (top) + Return Address & Shipping -->
        <td width="50%" valign="top" style="padding-left:8px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e6f0;border-radius:6px;overflow:hidden;">
            ${section('Order Details', '#2d4a7a')}
            ${row('Service Plan', '<span style="font-size:15px;font-weight:700;color:#1a3c6e;">' + norm.plan_label + '</span>')}
            ${row('Plan Price', norm.plan_price)}
            ${row('Documents', norm.doc_count)}
            ${row('Plan Subtotal', norm.plan_subtotal)}
            ${row('Destination Country', norm.destination_country)}
            ${row('Document Subtotal', norm.doc_subtotal)}
            ${row('Base Total', norm.order_base_total)}
            ${row('Total Charged', '<strong>' + norm.order_total + '</strong>')}
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e6f0;border-radius:6px;overflow:hidden;margin:14px 0 0;">
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
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- DOCUMENTS TABLE (full-width bottom row) -->
  <tr><td style="padding:14px 18px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e6f0;border-radius:6px;overflow:hidden;">
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

  <!-- OPEN CLIENT DRIVE FOLDER (below Documents) -->
  <tr><td style="padding:16px 18px;text-align:center;">
    <a href="${folderLink}" style="display:inline-block;background:#1a3c6e;color:#fff;font-size:13px;font-weight:700;text-decoration:none;padding:11px 30px;border-radius:5px;">Open Client Drive Folder ↗</a>
  </td></tr>

  <tr><td style="background:#f0f4fa;padding:14px 18px;text-align:center;border-top:1px solid #e0e6f0;">
    <p style="margin:0;color:#aaa;font-size:12px;">US Authentication Services — Admin Notification</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

writeFileSync(new URL('./admin-email.html', import.meta.url), adminHtml);
console.log('admin_subject: [New Order] ' + orderref.order_ref + ' — ' + norm.first_name + ' ' + norm.last_name + ' (' + norm.payment_method.toUpperCase() + ')');
console.log('Wrote tools/admin-email.html');
