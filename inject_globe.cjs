const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const globeScript = `
<!-- ═══ HERO GLOBE ═══ -->
<script type="module">
import * as d3 from 'https://esm.sh/d3@7';
import * as topojson from 'https://esm.sh/topojson-client@3';

const DC = [-77.0369, 38.9072];

const HAGUE_CAPS = [
  { pos:[-77.0369,38.9072], name:"Washington D.C.", region:"origin" },
  { pos:[-0.1278,51.5074],  name:"London",          region:"europe", country:"United Kingdom" },
  { pos:[2.3522,48.8566],   name:"Paris",            region:"europe", country:"France" },
  { pos:[13.4050,52.5200],  name:"Berlin",           region:"europe", country:"Germany" },
  { pos:[12.4964,41.9028],  name:"Rome",             region:"europe", country:"Italy" },
  { pos:[-3.7038,40.4168],  name:"Madrid",           region:"europe", country:"Spain" },
  { pos:[4.3517,50.8503],   name:"Brussels",         region:"europe", country:"Belgium" },
  { pos:[16.3738,48.2082],  name:"Vienna",           region:"europe", country:"Austria" },
  { pos:[-9.1393,38.7223],  name:"Lisbon",           region:"europe", country:"Portugal" },
  { pos:[4.9041,52.3676],   name:"Amsterdam",        region:"europe", country:"Netherlands" },
  { pos:[10.7522,59.9139],  name:"Oslo",             region:"europe", country:"Norway" },
  { pos:[18.0686,59.3293],  name:"Stockholm",        region:"europe", country:"Sweden" },
  { pos:[24.9384,60.1699],  name:"Helsinki",         region:"europe", country:"Finland" },
  { pos:[7.4474,46.9480],   name:"Bern",             region:"europe", country:"Switzerland" },
  { pos:[21.0122,52.2297],  name:"Warsaw",           region:"europe", country:"Poland" },
  { pos:[14.4378,50.0755],  name:"Prague",           region:"europe", country:"Czech Republic" },
  { pos:[19.0402,47.4979],  name:"Budapest",         region:"europe", country:"Hungary" },
  { pos:[26.1025,44.4268],  name:"Bucharest",        region:"europe", country:"Romania" },
  { pos:[23.3219,42.6977],  name:"Sofia",            region:"europe", country:"Bulgaria" },
  { pos:[23.7275,37.9838],  name:"Athens",           region:"europe", country:"Greece" },
  { pos:[15.9819,45.8150],  name:"Zagreb",           region:"europe", country:"Croatia" },
  { pos:[20.4489,44.7866],  name:"Belgrade",         region:"europe", country:"Serbia" },
  { pos:[24.7536,59.4370],  name:"Tallinn",          region:"europe", country:"Estonia" },
  { pos:[24.1052,56.9496],  name:"Riga",             region:"europe", country:"Latvia" },
  { pos:[25.2797,54.6872],  name:"Vilnius",          region:"europe", country:"Lithuania" },
  { pos:[30.5234,50.4501],  name:"Kyiv",             region:"europe", country:"Ukraine" },
  { pos:[17.1077,48.1486],  name:"Bratislava",       region:"europe", country:"Slovakia" },
  { pos:[14.5058,46.0569],  name:"Ljubljana",        region:"europe", country:"Slovenia" },
  { pos:[37.6173,55.7558],  name:"Moscow",           region:"europe", country:"Russia" },
  { pos:[69.2401,41.2995],  name:"Tashkent",         region:"europe", country:"Uzbekistan" },
  { pos:[71.4460,51.1801],  name:"Astana",           region:"europe", country:"Kazakhstan" },
  { pos:[44.5152,40.1872],  name:"Yerevan",          region:"europe", country:"Armenia" },
  { pos:[44.8337,41.6941],  name:"Tbilisi",          region:"europe", country:"Georgia" },
  { pos:[-75.6972,45.4215], name:"Ottawa",           region:"americas", country:"Canada" },
  { pos:[-99.1332,19.4326], name:"Mexico City",      region:"americas", country:"Mexico" },
  { pos:[-47.8919,-15.7975],name:"Brasilia",         region:"americas", country:"Brazil" },
  { pos:[-58.3816,-34.6037],name:"Buenos Aires",     region:"americas", country:"Argentina" },
  { pos:[-77.0428,-12.0464],name:"Lima",             region:"americas", country:"Peru" },
  { pos:[-70.6483,-33.4569],name:"Santiago",         region:"americas", country:"Chile" },
  { pos:[-74.0721,4.7110],  name:"Bogota",           region:"americas", country:"Colombia" },
  { pos:[-66.9036,10.4806], name:"Caracas",          region:"americas", country:"Venezuela" },
  { pos:[-78.4678,-0.1807], name:"Quito",            region:"americas", country:"Ecuador" },
  { pos:[-84.0907,9.9281],  name:"San Jose",         region:"americas", country:"Costa Rica" },
  { pos:[-79.5197,8.9936],  name:"Panama City",      region:"americas", country:"Panama" },
  { pos:[-69.9312,18.4861], name:"Santo Domingo",    region:"americas", country:"Dominican Republic" },
  { pos:[-76.7936,17.9970], name:"Kingston",         region:"americas", country:"Jamaica" },
  { pos:[77.2090,28.6139],  name:"New Delhi",        region:"asia", country:"India" },
  { pos:[116.4074,39.9042], name:"Beijing",          region:"asia", country:"China" },
  { pos:[139.6503,35.6762], name:"Tokyo",            region:"asia", country:"Japan" },
  { pos:[126.9780,37.5665], name:"Seoul",            region:"asia", country:"South Korea" },
  { pos:[103.8198,1.3521],  name:"Singapore",        region:"asia", country:"Singapore" },
  { pos:[120.9842,14.5995], name:"Manila",           region:"asia", country:"Philippines" },
  { pos:[106.8456,-6.2088], name:"Jakarta",          region:"asia", country:"Indonesia" },
  { pos:[73.0931,33.7294],  name:"Islamabad",        region:"asia", country:"Pakistan" },
  { pos:[149.1300,-35.2809],name:"Canberra",         region:"asia", country:"Australia" },
  { pos:[174.7762,-41.2865],name:"Wellington",       region:"asia", country:"New Zealand" },
  { pos:[178.4419,-18.1416],name:"Suva",             region:"asia", country:"Fiji" },
  { pos:[28.2293,-25.7479], name:"Pretoria",         region:"africa", country:"South Africa" },
  { pos:[-17.4677,14.7167], name:"Dakar",            region:"africa", country:"Senegal" },
  { pos:[-6.8416,34.0209],  name:"Rabat",            region:"africa", country:"Morocco" },
  { pos:[30.0619,-1.9441],  name:"Kigali",           region:"africa", country:"Rwanda" },
  { pos:[10.1658,36.8190],  name:"Tunis",            region:"africa", country:"Tunisia" },
  { pos:[32.8597,39.9334],  name:"Ankara",           region:"africa", country:"Turkey" },
  { pos:[46.7219,24.6877],  name:"Riyadh",           region:"africa", country:"Saudi Arabia" },
  { pos:[35.2137,31.7683],  name:"Jerusalem",        region:"africa", country:"Israel" },
  { pos:[50.5876,26.2235],  name:"Manama",           region:"africa", country:"Bahrain" },
];

const ARC_TARGETS = [
  [-0.1278,51.5074],[2.3522,48.8566],[13.4050,52.5200],[12.4964,41.9028],
  [-3.7038,40.4168],[4.3517,50.8503],[16.3738,48.2082],[10.7522,59.9139],
  [18.0686,59.3293],[21.0122,52.2297],[23.7275,37.9838],[37.6173,55.7558],
  [30.5234,50.4501],[32.8597,39.9334],[46.7219,24.6877],[35.2137,31.7683],
  [77.2090,28.6139],[116.4074,39.9042],[139.6503,35.6762],[126.9780,37.5665],
  [103.8198,1.3521],[106.8456,-6.2088],[149.1300,-35.2809],[174.7762,-41.2865],
  [-75.6972,45.4215],[-99.1332,19.4326],[-47.8919,-15.7975],[-58.3816,-34.6037],
  [-74.0721,4.7110],[28.2293,-25.7479],[-17.4677,14.7167],[-6.8416,34.0209],
  [69.2401,41.2995],[44.5152,40.1872],[-77.0428,-12.0464],[-61.5019,10.6549],
];

const HAGUE_IDS = new Set([8,20,28,32,51,36,40,31,44,48,50,52,112,56,84,68,70,72,76,96,100,108,124,132,152,156,170,184,188,191,196,203,208,212,214,218,222,233,242,246,250,268,276,300,308,320,328,340,348,352,356,360,372,376,380,388,392,398,410,383,417,428,426,430,438,440,442,454,470,584,480,484,498,492,496,499,504,516,528,554,558,570,807,578,512,586,585,591,600,604,608,616,620,642,643,646,659,662,670,882,674,678,682,686,688,690,702,703,705,710,724,740,748,752,756,762,776,780,788,792,804,826,858,860,548,862,840]);

async function initHeroGlobe() {
  const canvas = document.getElementById('hero-globe-canvas');
  if (!canvas) return;
  const wrap = document.getElementById('hero-globe-wrap');
  const SIZE = wrap ? (wrap.clientWidth || 480) : 480;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = SIZE * DPR;
  canvas.height = SIZE * DPR;
  canvas.style.width = SIZE + 'px';
  canvas.style.height = SIZE + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);
  const R = Math.floor(SIZE * 0.46);
  const cx = SIZE / 2, cy = SIZE / 2;

  const world = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json());
  const land = topojson.feature(world, world.objects.land);
  const countriesGeo = topojson.feature(world, world.objects.countries);
  const allBorders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
  const hagueFeat = { type:'FeatureCollection', features: countriesGeo.features.filter(f => HAGUE_IDS.has(+f.id)) };
  const nonHagueFeat = { type:'FeatureCollection', features: countriesGeo.features.filter(f => !HAGUE_IDS.has(+f.id)) };
  const hagueBorders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b && (HAGUE_IDS.has(+a.id) || HAGUE_IDS.has(+b.id)));

  const DOT_W = 720, DOT_H = 360;
  const dotCvs = document.createElement('canvas');
  dotCvs.width = DOT_W; dotCvs.height = DOT_H;
  const dotCtx = dotCvs.getContext('2d', { willReadFrequently: true });
  const dotProj = d3.geoEquirectangular().scale(DOT_W / (2 * Math.PI)).translate([DOT_W / 2, DOT_H / 2]);
  const dotPath = d3.geoPath().projection(dotProj).context(dotCtx);
  dotCtx.fillStyle = '#000'; dotCtx.fillRect(0, 0, DOT_W, DOT_H);
  dotCtx.beginPath(); dotPath(land); dotCtx.fillStyle = '#fff'; dotCtx.fill();
  const imgData = dotCtx.getImageData(0, 0, DOT_W, DOT_H);
  const DOTS = [];
  const DOT_STEP = 3;
  for (let x = 0; x < DOT_W; x += DOT_STEP) {
    for (let y = 0; y < DOT_H; y += DOT_STEP) {
      if (imgData.data[(y * DOT_W + x) * 4] > 64) {
        DOTS.push([(x / DOT_W) * 360 - 180, 90 - (y / DOT_H) * 180]);
      }
    }
  }

  const arcInterps = ARC_TARGETS.map(dest => d3.geoInterpolate(DC, dest));
  const projection = d3.geoOrthographic().scale(R).translate([cx, cy]).clipAngle(90);
  const path = d3.geoPath().projection(projection).context(ctx);
  const graticule = d3.geoGraticule()();

  function getDepth(lngLat) {
    const p = projection(lngLat);
    if (!p) return -1;
    const dx = (p[0] - cx) / R, dy = (p[1] - cy) / R;
    return Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
  }

  let rot = [0, -22];
  let dragging = false, dragStart = null, rotStart = null;
  let velX = 0, velY = 0, lastDragX = 0, lastDragY = 0;
  let autoSpin = true, rafId = null, lastTime = null;

  canvas.addEventListener('pointerdown', e => {
    dragging = true; autoSpin = false;
    dragStart = [e.clientX, e.clientY]; rotStart = [...rot];
    lastDragX = e.clientX; lastDragY = e.clientY;
    velX = 0; velY = 0;
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    velX = (e.clientX - lastDragX) * 0.6;
    velY = (e.clientY - lastDragY) * 0.6;
    lastDragX = e.clientX; lastDragY = e.clientY;
    rot[0] = rotStart[0] + (e.clientX - dragStart[0]) * 0.38;
    rot[1] = Math.max(-80, Math.min(80, rotStart[1] - (e.clientY - dragStart[1]) * 0.38));
  });
  canvas.addEventListener('pointerup', () => {
    dragging = false;
    setTimeout(() => { autoSpin = true; }, 2500);
  });

  function drawFrame(ts) {
    if (lastTime === null) lastTime = ts;
    const dt = Math.min(ts - lastTime, 50);
    lastTime = ts;

    if (!dragging) {
      if (autoSpin) {
        rot[0] += dt * 0.014;
      } else if (Math.abs(velX) > 0.05 || Math.abs(velY) > 0.05) {
        rot[0] += velX * 0.28; velX *= 0.88;
        rot[1] = Math.max(-80, Math.min(80, rot[1] - velY * 0.28)); velY *= 0.88;
      }
    }

    const animPhase = (ts * 0.000038) % 1;
    projection.rotate([rot[0], rot[1], 0]);
    ctx.clearRect(0, 0, SIZE, SIZE);

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();

    ctx.fillStyle = '#020d1c';
    ctx.fillRect(0, 0, SIZE, SIZE);

    const spec = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, 0, cx, cy, R);
    spec.addColorStop(0, 'rgba(4,44,83,0.32)');
    spec.addColorStop(1, 'transparent');
    ctx.fillStyle = spec; ctx.fillRect(0, 0, SIZE, SIZE);

    const atm = ctx.createRadialGradient(cx, cy, R * 0.68, cx, cy, R);
    atm.addColorStop(0, 'transparent');
    atm.addColorStop(1, 'rgba(2,8,20,0.78)');
    ctx.fillStyle = atm; ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.beginPath(); path(graticule);
    ctx.strokeStyle = 'rgba(55,138,221,0.12)'; ctx.lineWidth = 0.4; ctx.stroke();

    ctx.fillStyle = '#0a2e52';
    nonHagueFeat.features.forEach(f => { ctx.beginPath(); path(f); ctx.fill(); });

    ctx.fillStyle = 'rgba(249,115,22,0.38)';
    hagueFeat.features.forEach(f => { ctx.beginPath(); path(f); ctx.fill(); });

    ctx.beginPath(); path(allBorders);
    ctx.strokeStyle = 'rgba(133,183,235,0.14)'; ctx.lineWidth = 0.5; ctx.stroke();

    ctx.beginPath(); path(hagueBorders);
    ctx.strokeStyle = 'rgba(249,115,22,0.6)'; ctx.lineWidth = 1.0; ctx.stroke();

    ctx.fillStyle = 'rgba(133,183,235,0.3)';
    DOTS.forEach(([lng, lat]) => {
      const p = projection([lng, lat]);
      if (!p) return;
      ctx.beginPath(); ctx.arc(p[0], p[1], 1.1, 0, Math.PI * 2); ctx.fill();
    });

    ARC_TARGETS.forEach((dest, i) => {
      const startFrac = (i / ARC_TARGETS.length) * 0.70;
      const arcSpan = 0.22;
      const raw = ((animPhase - startFrac) % 1 + 1) % 1 / arcSpan;
      const progress = Math.min(1, raw);
      const interp = arcInterps[i];

      ctx.beginPath();
      let penDown = false;
      for (let j = 0; j <= 64; j++) {
        const p = projection(interp(j / 64));
        if (!p) { penDown = false; continue; }
        if (!penDown) { ctx.moveTo(p[0], p[1]); penDown = true; }
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = 'rgba(249,115,22,0.12)'; ctx.lineWidth = 0.65; ctx.stroke();

      if (progress > 0.01) {
        ctx.beginPath(); penDown = false;
        const maxJ = Math.round(progress * 64);
        for (let j = 0; j <= maxJ; j++) {
          const p = projection(interp(j / 64));
          if (!p) { penDown = false; continue; }
          if (!penDown) { ctx.moveTo(p[0], p[1]); penDown = true; }
          else ctx.lineTo(p[0], p[1]);
        }
        ctx.strokeStyle = 'rgba(249,115,22,0.88)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    });

    ctx.restore();

    ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(249,115,22,0.18)'; ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(249,115,22,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();

    HAGUE_CAPS.forEach(cap => {
      const p = projection(cap.pos);
      if (!p) return;
      const depth = getDepth(cap.pos);
      if (depth < 0) return;
      const alpha = Math.min(1, depth * 2.8);
      const isOrigin = cap.region === 'origin';
      const r2 = isOrigin ? 5 : 2.2;

      if (isOrigin) {
        ctx.beginPath(); ctx.arc(p[0], p[1], r2 + 6, 0, Math.PI * 2);
        ctx.strokeStyle = \`rgba(249,115,22,\${alpha * 0.3})\`; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(p[0], p[1], r2 + 3, 0, Math.PI * 2);
        ctx.strokeStyle = \`rgba(249,115,22,\${alpha * 0.55})\`; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(p[0], p[1], r2 + 2.5, 0, Math.PI * 2);
      ctx.fillStyle = \`rgba(249,115,22,\${alpha * 0.15})\`; ctx.fill();
      ctx.beginPath(); ctx.arc(p[0], p[1], r2, 0, Math.PI * 2);
      ctx.fillStyle = \`rgba(249,115,22,\${alpha * (isOrigin ? 1 : 0.88)})\`; ctx.fill();
    });

    ctx.font = '600 8px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    HAGUE_CAPS.forEach(cap => {
      if (!cap.country) return;
      const p = projection(cap.pos);
      if (!p) return;
      const depth = getDepth(cap.pos);
      if (depth < 0.18) return;
      const alpha = Math.min(1, (depth - 0.18) * 5);
      const tw = ctx.measureText(cap.country).width;
      ctx.fillStyle = \`rgba(2,13,28,\${alpha * 0.82})\`;
      ctx.fillRect(p[0] - tw / 2 - 3, p[1] + 6, tw + 6, 12);
      ctx.fillStyle = \`rgba(249,115,22,\${alpha})\`;
      ctx.fillText(cap.country, p[0], p[1] + 15);
    });

    ctx.restore();
    rafId = requestAnimationFrame(drawFrame);
  }

  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity 1.3s ease';
  setTimeout(() => { canvas.style.opacity = '1'; }, 300);
  rafId = requestAnimationFrame(drawFrame);

  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (!rafId) { lastTime = null; rafId = requestAnimationFrame(drawFrame); }
    } else {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }
  }, { threshold: 0 }).observe(canvas);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroGlobe);
} else {
  initHeroGlobe();
}
<\/script>`;

// Append after the last </script> at end of file
const lastScript = html.lastIndexOf('</script>');
if (lastScript === -1) { console.error('no closing script tag'); process.exit(1); }
html = html.slice(0, lastScript + '</script>'.length) + '\n' + globeScript + html.slice(lastScript + '</script>'.length);
fs.writeFileSync('index.html', html);
console.log('Globe script injected, file size:', html.length);
