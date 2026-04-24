const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ── 1. CSS: replace hiw-header, remove arrows, fix carousel to centered grid ──
const cssOld =
`.hiw-header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:40px;padding:0 max(36px,calc((100vw - 1100px)/2 + 36px))}
.hiw-header-left{display:flex;flex-direction:column;gap:10px}
.hiw-arrows{display:flex;gap:8px;flex-shrink:0;padding-bottom:4px}
.hiw-arrow{width:42px;height:42px;border-radius:50%;border:1.5px solid var(--gray-bd);background:var(--white);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s,border-color .2s,opacity .2s;color:var(--text);flex-shrink:0}
.hiw-arrow:hover:not([disabled]){background:var(--off-white);border-color:rgba(4,44,83,.3)}
.hiw-arrow[disabled]{opacity:.28;cursor:not-allowed}
.hiw-carousel{display:flex;overflow-x:scroll;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none;gap:20px;padding-left:max(36px,calc((100vw - 1100px)/2 + 36px));padding-right:max(36px,calc((100vw - 1100px)/2 + 36px))}
.hiw-carousel::-webkit-scrollbar{display:none}
.hiw-card{scroll-snap-align:start;flex-shrink:0;width:480px;min-height:480px;border-radius:20px;overflow:hidden;position:relative;cursor:grab;user-select:none}
.hiw-card:active{cursor:grabbing}`;

const cssNew =
`.hiw-header{text-align:center;margin-bottom:48px;padding:0 max(36px,calc((100vw - 1100px)/2 + 36px))}
.hiw-header-left{display:flex;flex-direction:column;align-items:center;gap:14px}
.hiw-section-eyebrow{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--navy-lt);display:inline-flex;align-items:center;justify-content:center;gap:8px}
.hiw-section-eyebrow::before,.hiw-section-eyebrow::after{content:'';width:28px;height:1.5px;background:var(--navy-lt);border-radius:2px;opacity:.5}
.hiw-section-title{font-size:clamp(30px,4vw,52px);font-weight:800;color:var(--navy);line-height:1.1;letter-spacing:-.04em;margin:0}
.hiw-section-title .blue{color:var(--navy-lt)}
.hiw-section-sub{font-size:15.5px;color:var(--text-lt);line-height:1.75;max-width:520px;margin:0 auto}
.hiw-carousel{display:flex;gap:20px;padding:0 max(36px,calc((100vw - 1100px)/2 + 36px));justify-content:center}
.hiw-card{flex:1;min-width:0;max-width:360px;min-height:460px;border-radius:20px;overflow:hidden;position:relative}`;

html = html.replace(cssOld, cssNew);

// ── 2. CSS: hide dots since no carousel scroll ──
html = html.replace(
  '.hiw-dots{display:flex;justify-content:center;gap:8px;margin-top:28px}',
  '.hiw-dots{display:none}'
);

// ── 3. HTML: replace header block (remove arrows, use new centered heading) ──
const headerOld =
`  <!-- Header row: title left, arrows right -->
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
  </div>`;

const headerNew =
`  <!-- Header — centered -->
  <div class="hiw-header">
    <div class="hiw-header-left">
      <span class="hiw-section-eyebrow">How It Works</span>
      <h2 class="hiw-section-title">Three steps. <span class="blue">We handle everything.</span></h2>
      <p class="hiw-section-sub">100% online for most clients — submit your PDF electronically, we do the rest. No trips to DC, no mailing required in most cases.</p>
    </div>
  </div>`;

html = html.replace(headerOld, headerNew);

// ── 4. HTML: remove carousel JS (no longer needed) ──
const jsOld =
`  <!-- Carousel JS -->
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
  </script>`;

html = html.replace(jsOld, '');

fs.writeFileSync('index.html', html);
console.log('Done — arrows removed, cards centered, heading upgraded.');
