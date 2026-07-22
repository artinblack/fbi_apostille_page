const norm   = $('Normalize Form Data').first().json;
const folder = $('Create Client Folder').first().json;
const files  = $('Collect Upload Results').first().json.uploaded_files || [];
const folderLink = `https://drive.google.com/drive/folders/${folder.id}`;
const orderref = $('Build Order Ref').first().json;

const docsWithFiles = norm.docs.filter(d => d.hasFile);
const fileLinks = {};
for (let i = 0; i < docsWithFiles.length; i++) {
  const file = files[i];
  if (file && file.id) {
    fileLinks[docsWithFiles[i].index] = `https://drive.google.com/file/d/${file.id}/view`;
  }
}

const LOGO = 'https://www.usauthentication.com/us-authentication-services/brand_assets/logo.webp';

// ── SHARED HELPERS ────────────────────────────────────────────
const detailRow = (label, value, isTotal = false) => `
  <tr>
    <td style="padding:${isTotal ? '16px' : '12px'} 0;border-bottom:1px solid rgba(10,22,40,0.07);color:#7A8BA0;font-size:${isTotal ? '13px' : '12px'};font-weight:500;width:50%;vertical-align:middle;">${label}</td>
    <td style="padding:${isTotal ? '16px' : '12px'} 0;border-bottom:1px solid rgba(10,22,40,0.07);color:${isTotal ? '#C9963A' : '#0A1628'};font-size:${isTotal ? '18px' : '13px'};font-weight:${isTotal ? '700' : '600'};text-align:right;vertical-align:middle;">${value || '—'}</td>
  </tr>`;

const stepCard = (num, title, desc, active) => `
  <tr><td style="padding:0 0 10px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid ${active ? 'rgba(201,150,58,0.30)' : 'rgba(10,22,40,0.08)'};border-radius:10px;overflow:hidden;">
      <tr>
        <td width="52" style="padding:16px 0 16px 16px;vertical-align:top;">
          <div style="width:26px;height:26px;border-radius:50%;background:${active ? '#C9963A' : '#EEF1F7'};text-align:center;line-height:26px;font-size:11px;font-weight:700;color:${active ? '#0A1628' : '#9AAAC0'};">${num}</div>
        </td>
        <td style="padding:16px 16px 16px 6px;vertical-align:top;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;font-weight:700;color:#0A1628;padding-right:10px;vertical-align:middle;">${title}</td>
              <td style="vertical-align:middle;"><span style="font-size:9px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;padding:2px 8px;border-radius:20px;background:${active ? 'rgba(201,150,58,0.13)' : 'rgba(10,22,40,0.05)'};color:${active ? '#C9963A' : '#9AAAC0'};">${active ? 'In Progress' : 'Pending'}</span></td>
            </tr>
          </table>
          <div style="font-size:12px;color:#5A6E88;line-height:1.65;margin-top:4px;">${desc}</div>
        </td>
      </tr>
    </table>
  </td></tr>`;

// ── CLIENT EMAIL — UNIFIED "UNDER REVIEW" ─────────────────────
const clientHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#F0EDE8;font-family:'DM Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EDE8;min-height:100vh;">
<tr><td style="padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;">

  <!-- LOGO HEADER -->
  <tr><td style="background:#FFFFFF;padding:26px 44px 22px;border-bottom:1px solid rgba(10,22,40,0.08);">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:middle;">
          <img src="${LOGO}" alt="US Authentication Services" style="height:52px;width:auto;display:block;" />
        </td>
        <td align="right" style="vertical-align:middle;">
          <span style="font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#7A8BA0;">${norm.submitted_at}</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- STATUS BANNER -->
  <tr><td style="background:#1C2E4A;padding:20px 44px;">
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:middle;padding-right:14px;">
          <div style="width:36px;height:36px;border-radius:50%;background:rgba(201,150,58,0.20);border:1.5px solid rgba(201,150,58,0.50);text-align:center;line-height:34px;font-size:17px;">⏱</div>
        </td>
        <td style="vertical-align:middle;">
          <div style="font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#C9963A;margin-bottom:2px;">Payment &amp; Order Under Review</div>
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:18px;font-weight:700;color:#FFFFFF;line-height:1.2;">Your Order Has Been Received</div>
        </td>
        <td align="right" style="vertical-align:middle;">
          <div style="background:rgba(201,150,58,0.15);border:1px solid rgba(201,150,58,0.35);border-radius:20px;padding:6px 14px;">
            <span style="font-size:11px;font-weight:700;color:#C9963A;letter-spacing:0.05em;">${orderref.order_ref}</span>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- BODY -->
  <tr><td style="padding:36px 44px;background:#FAFBFD;">

    <!-- Greeting -->
    <p style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:600;color:#0A1628;line-height:1.3;">Dear ${norm.first_name} ${norm.last_name},</p>
    <p style="margin:0 0 24px;font-size:14px;color:#5A6E88;line-height:1.8;">
      Thank you for placing your order with US Authentication Services. We have successfully received your request and your uploaded documents are securely on file. Our team is currently reviewing your payment — you do not need to take any further action at this time.
    </p>

    <!-- Review Time Notice -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="padding:16px 20px;background:rgba(201,150,58,0.07);border-left:3px solid #C9963A;border-radius:0 10px 10px 0;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#C9963A;margin-bottom:5px;">Estimated Review Time</div>
        <div style="font-size:13px;color:#5A6E88;line-height:1.7;">We typically verify the order during business hours the same business day (submitted by 3:30 PM EST). Business hours are Mon–Fri, 9 AM – 5 PM EST. You will receive a confirmation email as soon as your payment is approved and processing begins.</div>
      </td></tr>
    </table>

    <!-- Order Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid rgba(10,22,40,0.09);border-radius:12px;overflow:hidden;margin-bottom:28px;box-shadow:0 2px 12px rgba(10,22,40,0.06);">
      <tr><td colspan="2" style="background:#0A1628;padding:13px 22px;">
        <span style="font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#C9963A;">Order Summary</span>
      </td></tr>
      <tr><td style="padding:4px 22px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${detailRow('Order Reference', orderref.order_ref)}
          ${detailRow('Service Plan', norm.plan_label)}
          ${detailRow('Number of Documents', norm.doc_count + ' document(s)')}
          ${detailRow('Destination Country', norm.destination_country)}
          ${detailRow('Payment Method', norm.payment_method.toUpperCase())}
          ${detailRow('Plan Subtotal', norm.plan_subtotal)}
          ${detailRow('Add-ons Subtotal', norm.addons_subtotal)}
          ${detailRow('Shipping', norm.return_mailing_label)}
          ${detailRow('Amount Due', norm.order_total, true)}
        </table>
      </td></tr>
    </table>

    <!-- Return Address Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid rgba(10,22,40,0.09);border-radius:12px;overflow:hidden;margin-bottom:28px;box-shadow:0 2px 12px rgba(10,22,40,0.06);">
      <tr><td colspan="2" style="background:#1C2E4A;padding:13px 22px;">
        <span style="font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#C9963A;">Return Address</span>
      </td></tr>
      <tr><td style="padding:4px 22px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${detailRow('Name', norm.return_name)}
          ${detailRow('Company', norm.return_company)}
          ${detailRow('Address', norm.return_address)}
          ${detailRow('City / State / ZIP', [norm.return_city, norm.return_state, norm.return_postal].filter(Boolean).join(', '))}
          ${detailRow('Country', norm.return_country)}
          ${detailRow('Phone', norm.return_phone)}
          ${detailRow('Shipping Method', norm.return_mailing_label)}
        </table>
      </td></tr>
    </table>

    <!-- What Happens Next -->
    <div style="margin-bottom:18px;">
      <span style="font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#C9963A;">What Happens Next</span>
      <div style="width:32px;height:2px;background:#C9963A;margin-top:8px;border-radius:2px;"></div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background:#F4F6FA;border-radius:12px;padding:12px;border:1px solid rgba(10,22,40,0.06);">
      <tr><td style="padding:12px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${stepCard(1, 'Payment Verification', 'Our team verifies your payment against the details submitted with your order. This step is currently in progress.', true)}
          ${stepCard(2, 'Confirmation Email', 'Once your payment is verified, you will receive a separate order confirmation email with full processing details.', false)}
          ${stepCard(3, 'Document Processing', 'Your apostille request enters our processing queue immediately after payment is confirmed.', false)}
        </table>
      </td></tr>
    </table>

    <!-- Sign-off -->
    <p style="margin:0 0 24px;font-size:13px;color:#5A6E88;line-height:1.8;">
      If you have any questions, please contact us at
      <a href="mailto:info@usauthentication.com" style="color:#C9963A;font-weight:600;text-decoration:none;">info@usauthentication.com</a>
      and reference order <strong style="color:#0A1628;">${orderref.order_ref}</strong>.
    </p>
    <p style="margin:0 0 3px;font-size:13px;color:#5A6E88;">Warm regards,</p>
    <p style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:15px;font-weight:600;color:#0A1628;">US Authentication Services</p>
    <p style="margin:2px 0 0;font-size:11px;color:#9AAAC0;letter-spacing:0.03em;">Document Apostille · Authentication · Embassy Legalization</p>

  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#0A1628;padding:22px 44px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:middle;">
          <img src="${LOGO}" alt="US Authentication Services" style="height:32px;width:auto;display:block;opacity:0.75;" />
        </td>
        <td align="right" style="vertical-align:middle;">
          <div style="font-size:10px;color:rgba(255,255,255,0.28);text-align:right;line-height:1.7;">
            Washington DC &bull; usauthentication.com<br>
            This is an automated message — please do not reply.
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;

// ── ADMIN EMAIL ───────────────────────────────────────────────
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

return [{
  json: {
    client_email:   norm.email,
    client_name:    norm.first_name + ' ' + norm.last_name,
    order_ref:      orderref.order_ref,
    client_subject: `Payment & Order Under Review — ${orderref.order_ref} | US Authentication Services`,
    admin_subject:  `[New Order] ${orderref.order_ref} — ${norm.first_name} ${norm.last_name} (${norm.payment_method.toUpperCase()})`,
    client_html:    clientHtml,
    admin_html:     adminHtml,
  }
}];
