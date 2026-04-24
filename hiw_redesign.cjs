const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ── 1. REPLACE CSS ──────────────────────────────────────────────
const cssStart = html.indexOf('.steps-section{');
const cssEnd   = html.indexOf('\n\n/* ── WHY US');
if (cssStart === -1 || cssEnd === -1) { console.error('CSS markers not found'); process.exit(1); }

const newCSS =
`.hiw-section{background:var(--white);padding:72px 0 80px;border-bottom:0.5px solid var(--gray-bd)}
.hiw-header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:40px;padding:0 max(36px,calc((100vw - 1100px)/2 + 36px))}
.hiw-header-left{display:flex;flex-direction:column;gap:10px}
.hiw-arrows{display:flex;gap:8px;flex-shrink:0;padding-bottom:4px}
.hiw-arrow{width:42px;height:42px;border-radius:50%;border:1.5px solid var(--gray-bd);background:var(--white);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s,border-color .2s,opacity .2s;color:var(--text);flex-shrink:0}
.hiw-arrow:hover:not([disabled]){background:var(--off-white);border-color:rgba(4,44,83,.3)}
.hiw-arrow[disabled]{opacity:.28;cursor:not-allowed}
.hiw-carousel{display:flex;overflow-x:scroll;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none;gap:20px;padding-left:max(36px,calc((100vw - 1100px)/2 + 36px));padding-right:max(36px,calc((100vw - 1100px)/2 + 36px))}
.hiw-carousel::-webkit-scrollbar{display:none}
.hiw-card{scroll-snap-align:start;flex-shrink:0;width:480px;min-height:480px;border-radius:20px;overflow:hidden;position:relative;cursor:grab;user-select:none}
.hiw-card:active{cursor:grabbing}
.hiw-card-icon{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:center;padding-top:40px;pointer-events:none;z-index:1}
.hiw-card-glow{position:absolute;width:260px;height:260px;border-radius:50%;top:-30px;left:50%;transform:translateX(-50%);pointer-events:none}
.hiw-card-overlay{position:absolute;inset:0;z-index:2}
.hiw-card-content{position:absolute;bottom:0;left:0;right:0;padding:22px 28px 28px;display:flex;flex-direction:column;z-index:3}
.hiw-step-badge{display:inline-flex;align-items:center;font-size:10px;font-weight:800;letter-spacing:.12em;color:var(--orange);background:rgba(249,115,22,0.14);border:1px solid rgba(249,115,22,0.28);border-radius:6px;padding:3px 10px;margin-bottom:11px;width:fit-content}
.hiw-card-title{font-size:19px;font-weight:700;color:var(--white);line-height:1.28;letter-spacing:-.025em;margin-bottom:9px}
.hiw-card-body{font-size:13px;color:rgba(255,255,255,.52);line-height:1.68;margin-bottom:14px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.hiw-card-tag{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:5px 12px;border-radius:var(--r-pill);width:fit-content}
.hiw-card-tag.green{background:rgba(22,163,74,.22);color:#6ee7b7;border:1px solid rgba(22,163,74,.18)}
.hiw-card-tag.blue{background:rgba(55,138,221,.2);color:rgba(133,183,235,1);border:1px solid rgba(55,138,221,.15)}
.hiw-card-tag.orange{background:rgba(249,115,22,.18);color:var(--orange);border:1px solid rgba(249,115,22,.2)}
.hiw-dots{display:flex;justify-content:center;gap:8px;margin-top:28px}
.hiw-dot{height:8px;border-radius:4px;background:rgba(4,44,83,.15);border:none;cursor:pointer;padding:0;transition:background .25s,width .25s;width:8px}
.hiw-dot.active{background:var(--navy);width:24px}
.hiw-submit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 max(36px,calc((100vw - 1100px)/2 + 36px));margin-top:24px}
.hiw-submit-card{border-radius:var(--r-lg);padding:16px 20px;display:flex;align-items:center;gap:14px;border:0.5px solid var(--gray-bd);background:var(--off-white);transition:background .15s;text-decoration:none;cursor:pointer}
.hiw-submit-card.accent{background:var(--blue-pale);border-color:rgba(55,138,221,.25)}
.hiw-submit-card:hover{background:rgba(218,225,234,.6)}
.hiw-submit-card.accent:hover{background:rgba(55,138,221,.12)}
.hiw-submit-icon{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.hiw-submit-label{font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:2px;line-height:1.2}
.hiw-submit-card.accent .hiw-submit-label{color:var(--navy-lt)}
.hiw-submit-value{font-size:11.5px;color:var(--text-lt);line-height:1.3}
.hiw-submit-card.accent .hiw-submit-value{color:var(--navy-lt);opacity:.7}`;

html = html.slice(0, cssStart) + newCSS + html.slice(cssEnd);

// ── 2. REPLACE HTML ─────────────────────────────────────────────
const htmlStart = html.indexOf('<!-- HOW IT WORKS -->');
const htmlEnd   = html.indexOf('\n<!-- PRICING -->');
if (htmlStart === -1 || htmlEnd === -1) { console.error('HTML markers not found'); process.exit(1); }

const newHTML =
`<!-- HOW IT WORKS -->
<section class="hiw-section">

  <!-- Header row: title left, arrows right -->
  <div class="hiw-header">
    <div class="hiw-header-left">
      <div class="eyebrow" style="justify-content:flex-start">How It Works</div>
      <h2 class="sh" style="margin-bottom:6px">Three steps. <span class="blue">We handle everything.</span></h2>
      <p class="sp" style="max-width:520px">100% online for most clients — submit your PDF electronically, we do the rest. No trips to DC, no mailing required in most cases.</p>
    </div>
    <div class="hiw-arrows">
      <button class="hiw-arrow" id="hiw-prev" disabled aria-label="Previous step">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button class="hiw-arrow" id="hiw-next" aria-label="Next step">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  </div>

  <!-- Carousel -->
  <div class="hiw-carousel" id="hiw-carousel">

    <!-- CARD 1: Submit -->
    <div class="hiw-card" style="background:linear-gradient(150deg,#0b2240 0%,#020d1c 100%)">
      <div class="hiw-card-glow" style="background:radial-gradient(circle,rgba(249,115,22,0.18) 0%,transparent 70%)"></div>
      <div class="hiw-card-icon">
        <svg width="210" height="210" viewBox="0 0 24 24" fill="none" stroke="rgba(249,115,22,0.22)" stroke-width="0.45" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <polyline points="9 16 12 13 15 16"/>
          <line x1="12" y1="13" x2="12" y2="20"/>
        </svg>
      </div>
      <div class="hiw-card-overlay" style="background:linear-gradient(to bottom,transparent 30%,rgba(2,13,28,0.8) 58%,rgba(2,13,28,0.98) 100%)"></div>
      <div class="hiw-card-content">
        <span class="hiw-step-badge">STEP 01</span>
        <div class="hiw-card-title">Submit your document — free review</div>
        <div class="hiw-card-body">Email, WhatsApp, or upload your PDF directly through our order form. We review it at no cost, confirm the service needed, and give you an exact quote and timeline. No obligation to proceed.</div>
        <span class="hiw-card-tag green">&#10003; 100% free &middot; no obligation</span>
      </div>
    </div>

    <!-- CARD 2: Process -->
    <div class="hiw-card" style="background:linear-gradient(150deg,#0d2d4e 0%,#020d1c 100%)">
      <div class="hiw-card-glow" style="background:radial-gradient(circle,rgba(55,138,221,0.18) 0%,transparent 70%)"></div>
      <div class="hiw-card-icon">
        <svg width="210" height="210" viewBox="0 0 24 24" fill="none" stroke="rgba(55,138,221,0.28)" stroke-width="0.45" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </div>
      <div class="hiw-card-overlay" style="background:linear-gradient(to bottom,transparent 30%,rgba(2,13,28,0.8) 58%,rgba(2,13,28,0.98) 100%)"></div>
      <div class="hiw-card-content">
        <span class="hiw-step-badge">STEP 02</span>
        <div class="hiw-card-title">We place your order &amp; process it</div>
        <div class="hiw-card-body">Once confirmed, we handle everything on your behalf — including daily hand-delivery to the US Dept. of State. Most FBI background checks are obtained electronically and submitted directly.</div>
        <span class="hiw-card-tag blue">Most customers never need to mail anything</span>
      </div>
    </div>

    <!-- CARD 3: Receive -->
    <div class="hiw-card" style="background:linear-gradient(150deg,#061a30 0%,#020d1c 100%)">
      <div class="hiw-card-glow" style="background:radial-gradient(circle,rgba(249,115,22,0.14) 0%,transparent 70%)"></div>
      <div class="hiw-card-icon">
        <svg width="210" height="210" viewBox="0 0 24 24" fill="none" stroke="rgba(249,115,22,0.22)" stroke-width="0.45" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="6"/>
          <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/>
        </svg>
      </div>
      <div class="hiw-card-overlay" style="background:linear-gradient(to bottom,transparent 30%,rgba(2,13,28,0.8) 58%,rgba(2,13,28,0.98) 100%)"></div>
      <div class="hiw-card-content">
        <span class="hiw-step-badge">STEP 03</span>
        <div class="hiw-card-title">Receive your certified document</div>
        <div class="hiw-card-body">Your apostilled document is delivered as a certified digital scan — fast, secure, and internationally accepted. If a physical copy is needed, we ship worldwide via FedEx or DHL.</div>
        <span class="hiw-card-tag orange">&#9889; Expedited: 8&ndash;9 business days</span>
      </div>
    </div>

  </div><!-- /.hiw-carousel -->

  <!-- Dot indicators -->
  <div class="hiw-dots">
    <button class="hiw-dot active" data-idx="0" aria-label="Step 1"></button>
    <button class="hiw-dot" data-idx="1" aria-label="Step 2"></button>
    <button class="hiw-dot" data-idx="2" aria-label="Step 3"></button>
  </div>

  <!-- Submission options -->
  <div class="hiw-submit-grid">
    <div class="hiw-submit-card">
      <div class="hiw-submit-icon" style="background:rgba(249,115,22,.1)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
      </div>
      <div>
        <div class="hiw-submit-label">Email your PDF</div>
        <div class="hiw-submit-value">apostille@fbi-apostille.com</div>
      </div>
    </div>
    <div class="hiw-submit-card">
      <div class="hiw-submit-icon" style="background:rgba(37,211,102,.1)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#25d366" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
        </svg>
      </div>
      <div>
        <div class="hiw-submit-label">WhatsApp your document</div>
        <div class="hiw-submit-value">202-552-9489</div>
      </div>
    </div>
    <div class="hiw-submit-card accent">
      <div class="hiw-submit-icon" style="background:rgba(55,138,221,.15)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy-lt)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>
        </svg>
      </div>
      <div>
        <div class="hiw-submit-label">Submit via order form</div>
        <div class="hiw-submit-value">Upload PDF directly online</div>
      </div>
    </div>
  </div>

  <!-- Carousel JS -->
  <script>
  (function() {
    var carousel = document.getElementById('hiw-carousel');
    var prev = document.getElementById('hiw-prev');
    var next = document.getElementById('hiw-next');
    var dots = document.querySelectorAll('.hiw-dot');
    if (!carousel) return;

    var cardW = 480 + 20;

    function updateState() {
      var sl = carousel.scrollLeft;
      var maxSl = carousel.scrollWidth - carousel.clientWidth;
      prev.disabled = sl < 5;
      next.disabled = sl > maxSl - 5;
      var idx = Math.round(sl / cardW);
      dots.forEach(function(d, i) { d.classList.toggle('active', i === idx); });
    }

    prev.addEventListener('click', function() { carousel.scrollBy({ left: -cardW, behavior: 'smooth' }); });
    next.addEventListener('click', function() { carousel.scrollBy({ left: cardW, behavior: 'smooth' }); });
    dots.forEach(function(d, i) {
      d.addEventListener('click', function() { carousel.scrollTo({ left: cardW * i, behavior: 'smooth' }); });
    });
    carousel.addEventListener('scroll', updateState);
    updateState();

    // Drag scroll
    var dragging = false, startX, scrollStart;
    carousel.addEventListener('mousedown', function(e) {
      dragging = true; startX = e.clientX; scrollStart = carousel.scrollLeft;
      carousel.style.cursor = 'grabbing'; e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      carousel.scrollLeft = scrollStart - (e.clientX - startX);
    });
    document.addEventListener('mouseup', function() {
      dragging = false; carousel.style.cursor = '';
    });
  })();
  </script>

</section>`;

html = html.slice(0, htmlStart) + newHTML + html.slice(htmlEnd);

fs.writeFileSync('index.html', html);
console.log('HOW IT WORKS redesign complete.');
