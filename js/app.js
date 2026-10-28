/* Saryarqa Compass — page logic */
(function () {
  'use strict';
  const D = window.SC_DATA, I = window.SC_I18N, MAP = window.SC_MAP;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = window.gsap || null;
  const ST = window.ScrollTrigger || null;
  if (G && ST) G.registerPlugin(ST);
  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id, cls) => `<svg aria-hidden="true"${cls ? ` class="${cls}"` : ''}><use href="#${id}"/></svg>`;
  const clampInt = (v, a, b, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d; };

  /* ---------------- state ---------------- */
  const S = {
    lang: 'en', chatLang: 'en', trip: 'lakes', scene: 'charyn-castles', day: 0,
    fDe: false, fRegion: 'all',
    cart: { trip: 'lakes', plan: null, dep: 0, priv: '', n: 2, single: false, xferOn: false, xfer: 'sedan', guide: '', pay: 'card', consent: false },
    w: 0, pass: null, home: 'FRA', wTrip: 'lakes', xfer: 'sedan', signName: '', arrTime: '', xferAdded: false
  };

  /* ---------------- i18n helpers ---------------- */
  const tx = (v, lang) => v == null ? '' : (typeof v === 'string' ? v : (v[lang || S.lang] != null ? v[lang || S.lang] : v.en));
  const T = (k, vars, lang) => {
    const e = I.t[k]; let s = e ? e[(lang || S.lang) === 'de' ? 1 : 0] : k;
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.split('{' + a + '}').join(b);
    return s;
  };
  const loc = lang => (lang || S.lang) === 'de' ? 'de-DE' : 'en-GB';
  const eur = (n, lang, cents) => new Intl.NumberFormat(loc(lang), { style: 'currency', currency: 'EUR', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(n);
  const num = (n, lang) => Number(n).toLocaleString(loc(lang));
  const num1 = (n, lang) => Number(n).toLocaleString(loc(lang), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const dur = (min, lang) => {
    const h = Math.floor(min / 60), m = Math.round(min % 60), de = (lang || S.lang) === 'de';
    if (!h) return de ? `${m} Min.` : `${m} min`;
    return de ? `${h} Std.${m ? ' ' + m + ' Min.' : ''}` : `${h} h${m ? ' ' + m + ' min' : ''}`;
  };
  const hrs = (h, lang) => (lang || S.lang) === 'de' ? `${num(h, 'de')} Std.` : `${h} h`;
  const fdate = (d, lang, opts) => d.toLocaleDateString(loc(lang), Object.assign({ day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }, opts || {}));
  const xp = (p, lang) => p == null ? '' : Array.isArray(p) ? ((lang || S.lang) === 'de' ? `${p[0]}–${p[1]} €` : `€${p[0]}–${p[1]}`) : eur(p, lang);
  const isoDate = (iso, lang) => fdate(new Date(iso + 'T00:00:00Z'), lang);
  const monthName = (m, lang) => I.months[(lang || S.lang) === 'de' ? 'de' : 'en'][m - 1];

  /* ---------------- trip helpers ---------------- */
  const tripById = id => D.TRIPS.find(t => t.id === id) || D.TRIPS[0];
  const modsOf = ids => ids.map(id => Object.assign({ id }, D.MODULES[id]));
  const LV = { easy: 0, moderate: 1, demanding: 2 };
  const LVN = ['easy', 'moderate', 'demanding'];
  const baseOf = ids => ids.reduce((a, id) => a + D.MODULES[id].price, 0);
  const levelOf = (ids, gentle) => LVN[Math.max(...ids.map(id => { const m = D.MODULES[id]; return LV[gentle && m.gentle ? m.gentle.level : m.level]; }))];
  const nightsOf = ids => ids.filter(id => D.MODULES[id].sleep).length;
  const factor = n => n <= 1 ? D.PRICING.solo : n <= 2 ? 1 : n <= 4 ? D.PRICING.group34 : D.PRICING.group56;
  const perPerson = (base, n) => Math.round(base * factor(n));
  const stopName = (id, lang) => tx(D.STOPS[id].name, lang);
  const MINOR = ['kolsai2', 'okzhetpes', 'kokshe'];
  const SHORT = { kolsai1: { en: 'Kolsai', de: 'Kolsai' }, kaindy: { en: 'Kaindy', de: 'Kaindy' }, ala: { en: 'ALA', de: 'ALA' }, nqz: { en: 'Astana (NQZ)', de: 'Astana (NQZ)' }, hsa: { en: 'Airport', de: 'Flughafen' }, bal: { en: 'Big Almaty Lake', de: 'Gr. Almaty-See' } };
  const routeStops = ids => {
    const out = [];
    ids.forEach(id => D.MODULES[id].legs.forEach(l => { [l[0], l[1]].forEach(s => { if (!MINOR.includes(s) && out[out.length - 1] !== s) out.push(s); }); }));
    return out;
  };
  const CITY = { ala: 'almaty', nqz: 'astana', hsa: 'turkestan' };
  const routeLine = ids => {
    const st = []; routeStops(ids).forEach(x => { const c = CITY[x] || x; if (st[st.length - 1] !== c) st.push(c); });
    return st.filter((x, i) => st.indexOf(x) === i || i === st.length - 1);
  };
  const depCache = {};
  function departures(trip) {
    if (depCache[trip.id]) return depCache[trip.id];
    const out = [];
    trip.months.forEach(mo => {
      const first = new Date(Date.UTC(2027, mo - 1, 1));
      const d0 = (trip.weekday - first.getUTCDay() + 7) % 7 + 1;
      [0, 2].forEach(k => {
        const day = d0 + k * 7;
        out.push({ date: new Date(Date.UTC(2027, mo - 1, day)), seats: 2 + ((day + mo * 3 + trip.id.length) % 5), month: mo });
      });
    });
    return (depCache[trip.id] = out);
  }

  /* ---------------- toast ---------------- */
  let toastTimer = 0;
  function toast(msg) {
    $('#toastText').textContent = msg;
    const el = $('#toast'); el.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('is-on'), 2800);
  }

  /* ================= LANGUAGE ================= */
  const EN = new Map();
  function applyLang(lang, first) {
    S.lang = lang === 'de' ? 'de' : 'en';
    document.documentElement.lang = S.lang;
    const de = S.lang === 'de';
    $$('[data-i18n]').forEach(el => { if (!EN.has(el)) EN.set(el, el.textContent); const k = el.dataset.i18n; el.textContent = de && I.de[k] ? I.de[k] : EN.get(el); });
    $$('[data-i18n-html]').forEach(el => { if (!EN.has(el)) EN.set(el, el.innerHTML); const k = el.dataset.i18nHtml; el.innerHTML = de && I.de[k] ? I.de[k] : EN.get(el); });
    $$('[data-i18n-ph]').forEach(el => { if (!EN.has(el)) EN.set(el, el.placeholder); const k = el.dataset.i18nPh; el.placeholder = de && I.de[k] ? I.de[k] : EN.get(el); });
    $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === S.lang)));
    $('#themeBtn').setAttribute('aria-label', T('langTheme'));
    store.set('sc-lang', S.lang);
    if (first) return;
    renderCompassList(); pointTo(compassCur, false);
    renderGuides(false);
    if (!Chat.touched) seedChat(S.lang); else setChatLang(S.lang);
    renderSuggest();
    renderTabs(); renderPreview(false); rebuildPano();
    const hint = $('#panoHint span'); if (hint) hint.textContent = S.lang === 'de' ? 'Ziehen zum Umsehen' : 'Drag to look around';
    renderTrips(); renderWizard(); renderMVP(); updateClock(); setEngineLabel();
    if ($('#drawer').open) renderDrawer();
    if ($('#profile').open && pf.g) { renderProfileBody(); pf.line = -1; renderVideo(); }
  }

  /* ================= THEME ================= */
  const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; };
  function syncThemeIcon() { $$('#themeBtn use, #mmTheme use').forEach(u => u.setAttribute('href', isDark() ? '#i-sun' : '#i-moon')); }
  function initTheme() {
    const saved = store.get('sc-theme');
    if (saved === 'dark' || saved === 'light') document.documentElement.dataset.theme = saved;
    syncThemeIcon();
    const flip = () => {
      const next = isDark() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next; store.set('sc-theme', next); syncThemeIcon();
    };
    $('#themeBtn').addEventListener('click', flip);
    $('#mmTheme').addEventListener('click', flip);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncThemeIcon);
  }

  /* ================= NAV ================= */
  function initNav() {
    const nav = $('#nav'), hero = $('.hero'), bar = $('#navProgress');
    let ticking = false;
    const update = () => {
      ticking = false;
      nav.classList.toggle('is-solid', hero.getBoundingClientRect().bottom < 90);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
    const map = { guides: 'guides', planner: 'planner', preview: 'preview', trips: 'preview', arrival: 'arrival' };
    const links = $$('.nav__steps a');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const step = map[e.target.id];
        links.forEach(a => a.classList.toggle('is-current', a.dataset.step === step));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['guides', 'planner', 'preview', 'trips', 'arrival', 'booking', 'faq', 'mvp'].forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
    const ioTop = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.remove('is-current')); }), { rootMargin: '-45% 0px -50% 0px' });
    ['booking', 'faq', 'mvp'].forEach(id => ioTop.observe(document.getElementById(id)));
    ioTop.observe(hero);
    // mobile menu
    const mm = $('#mobileMenu'), mb = $('#menuBtn');
    const close = () => { mm.hidden = true; mb.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
    mb.addEventListener('click', () => {
      mm.hidden = false; mb.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden';
      if (G && !RM) G.from('#mobileMenu li', { y: 24, opacity: 0, duration: .45, stagger: .05, ease: 'power3.out' });
      $('#menuClose').focus();
    });
    $('#menuClose').addEventListener('click', close);
    $$('#mobileMenu a, #mobileMenu [data-book]').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mm.hidden) close(); });
  }

  /* ================= HERO COMPASS ================= */
  let compassCur = 'charyn', compassRot = 0, compassTouched = false, compassTimer = 0;
  const readObj = { v: 0 };
  function buildCompass() {
    const svg = $('#compassSvg');
    let h = '<circle r="118" fill="none" stroke="rgba(234,241,239,.22)"/><circle r="40" fill="none" stroke="rgba(234,241,239,.14)"/>';
    for (let a = 0; a < 360; a += 5) {
      const long = a % 30 === 0, r1 = long ? 103 : 109, rad = (a - 90) * Math.PI / 180;
      h += `<line class="tick" x1="${(r1 * Math.cos(rad)).toFixed(1)}" y1="${(r1 * Math.sin(rad)).toFixed(1)}" x2="${(117 * Math.cos(rad)).toFixed(1)}" y2="${(117 * Math.sin(rad)).toFixed(1)}" stroke="rgba(234,241,239,${long ? .75 : .3})" stroke-width="${long ? 1.6 : 1}"/>`;
    }
    h += '<g id="cardinals" font-family="Archivo, sans-serif" font-size="12" font-weight="700" fill="rgba(234,241,239,.72)" text-anchor="middle" dominant-baseline="central"></g>';
    D.COMPASS.forEach(c => {
      const b = MAP.brg[c.id].deg, rad = (b - 90) * Math.PI / 180;
      h += `<circle class="dm" data-id="${c.id}" cx="${(124 * Math.cos(rad)).toFixed(1)}" cy="${(124 * Math.sin(rad)).toFixed(1)}" r="3.4" fill="rgba(234,241,239,.45)"/>`;
    });
    h += '<g id="needle"><line y1="-44" y2="-88" stroke="#e2a51a" stroke-width="2.2" stroke-linecap="round"/><path d="M0,-101 L7.5,-87 L-7.5,-87Z" fill="#e2a51a"/><line y1="44" y2="62" stroke="rgba(234,241,239,.45)" stroke-width="2" stroke-linecap="round"/></g>';
    svg.innerHTML = h;
  }
  function renderCompassList() {
    const de = S.lang === 'de';
    $('#cardinals').innerHTML = [['N', 0], [de ? 'O' : 'E', 90], ['S', 180], [de ? 'W' : 'W', 270]].map(([l, a]) => {
      const rad = (a - 90) * Math.PI / 180; return `<text x="${(88 * Math.cos(rad)).toFixed(1)}" y="${(88 * Math.sin(rad)).toFixed(1)}">${l}</text>`;
    }).join('');
    $('#destList').innerHTML = D.COMPASS.map(c => {
      const b = MAP.brg[c.id];
      return `<li><button type="button" data-dest="${c.id}" aria-pressed="${c.id === compassCur}"><span class="dest-name">${esc(tx(c.n))}</span><span class="data">${b.deg}°</span><span class="data">${num(b.km)} km</span></button></li>`;
    }).join('');
  }
  function pointTo(id, animate) {
    compassCur = id;
    const b = MAP.brg[id];
    const delta = ((b.deg - compassRot) % 360 + 540) % 360 - 180;
    compassRot += delta;
    const needle = $('#needle'), deg = $('#compassDeg');
    if (G && animate !== false && !RM) {
      G.to(needle, { rotation: compassRot, svgOrigin: '0 0', duration: 1.5, ease: 'elastic.out(1, 0.55)', overwrite: true });
      G.to(readObj, { v: b.deg, duration: .9, ease: 'power3.out', overwrite: true, onUpdate: () => { deg.textContent = Math.round(readObj.v) + '°'; } });
    } else {
      if (G) G.set(needle, { rotation: compassRot, svgOrigin: '0 0' }); else needle.setAttribute('transform', `rotate(${compassRot})`);
      readObj.v = b.deg; deg.textContent = b.deg + '°';
    }
    const c = D.COMPASS.find(x => x.id === id);
    $('#compassTo').textContent = tx(c.n);
    $$('#destList button').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.dest === id)));
    $$('#compassSvg .dm').forEach(dm => dm.setAttribute('fill', dm.dataset.id === id ? '#e2a51a' : 'rgba(234,241,239,.45)'));
  }
  function initCompass() {
    buildCompass(); renderCompassList(); pointTo('charyn', false);
    const list = $('#destList');
    const pick = e => { const b = e.target.closest('[data-dest]'); if (!b) return; compassTouched = true; if (b.dataset.dest !== compassCur) pointTo(b.dataset.dest); };
    list.addEventListener('mouseover', pick); list.addEventListener('focusin', pick); list.addEventListener('click', pick);
    if (RM) return;
    let heroVisible = true;
    new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }).observe($('.hero'));
    const order = D.COMPASS.map(c => c.id);
    compassTimer = setInterval(() => {
      if (compassTouched || !heroVisible || document.hidden) return;
      pointTo(order[(order.indexOf(compassCur) + 1) % order.length]);
    }, 3600);
  }
  function heroIntro() {
    if (!G || RM) return;
    const tl = G.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('#heroImg', { scale: 1.14, duration: 2.4, ease: 'power2.out' }, 0)
      .from('.hero h1 .ln > span', { yPercent: 110, duration: 1.05, stagger: .1, ease: 'power4.out' }, .15)
      .from('.hero__kicker', { y: 14, opacity: 0, duration: .6 }, .1)
      .from(['.hero .lede', '.hero__cta', '.hero__proof'], { y: 22, opacity: 0, duration: .8, stagger: .09 }, .6)
      .from('.compass-card', { y: 34, opacity: 0, duration: 1 }, .5)
      .from('#compassSvg .tick', { opacity: 0, duration: .01, stagger: { each: .006 } }, .7)
      .add(() => { readObj.v = 0; compassRot = 0; G.set('#needle', { rotation: 0, svgOrigin: '0 0' }); pointTo('charyn'); }, 1.05);
    if (ST) G.to('#heroImg', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ================= GUIDES ================= */
  const deOK = g => g.langs.some(([c, l]) => c === 'de' && ['B1', 'B2', 'C1', 'C2', 'N'].includes(l));
  const lvlLabel = l => l === 'N' ? T('native') : l;
  function guideCard(g) {
    const langs = g.langs.slice(0, 4).map(([c, l]) => `<span class="lang${c === 'de' ? ' lang--de' : ''}" title="${esc(tx(D.LANGS[c]))}">${c.toUpperCase()} <b>${esc(lvlLabel(l))}</b></span>`).join('');
    return `<article class="guide" data-g="${g.id}">
      <div class="guide__media"><img src="${g.img}" alt="" loading="lazy" width="640" height="480">
        <span class="guide__play"><i>${icon('i-play')}</i>${esc(T('watch'))}</span>
        <div class="guide__mono"><span class="guide__initials" aria-hidden="true">${g.ini}</span></div></div>
      <div class="guide__body">
        <div class="guide__row"><h3 class="guide__name"><button class="guide__open" type="button" data-guide="${g.id}">${esc(g.name)}</button></h3><span class="verified" title="${esc(T('checkedOn', { d: isoDate(g.checked) }))}">${icon('i-badge')}${esc(T('verified'))}</span></div>
        <p class="guide__base">${esc(tx(g.base))} · ${esc(tx(g.spec))}</p>
        <div class="langs">${langs}</div>
        <div class="guide__meta"><span><span class="data">${g.years}</span> ${esc(T('yearsGuiding'))}</span><span><span class="stars" aria-hidden="true">★</span> <span class="data">${num1(g.rating)}</span> · ${g.reviews} ${esc(T('reviews'))}</span></div>
      </div></article>`;
  }
  function renderGuides(animate) {
    const list = D.GUIDES.filter(g => (S.fRegion === 'all' || g.region === S.fRegion) && (!S.fDe || deOK(g)));
    $('#guideGrid').innerHTML = list.length ? list.map(guideCard).join('') : `<p class="muted">${esc(T('noGuides'))}</p>`;
    $('#guideCount').textContent = T('guidesCount', { n: list.length });
    if (animate && G && !RM) G.from('#guideGrid .guide', { y: 26, opacity: 0, duration: .5, stagger: .05, ease: 'power3.out', clearProps: 'transform,opacity' });
  }
  function initGuides() {
    renderGuides(false);
    $('#fGerman').addEventListener('click', e => { S.fDe = !S.fDe; e.currentTarget.setAttribute('aria-pressed', String(S.fDe)); renderGuides(true); });
    $$('[data-region]').forEach(b => b.addEventListener('click', () => {
      S.fRegion = b.dataset.region; $$('[data-region]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderGuides(true);
    }));
    $('#guideGrid').addEventListener('click', e => { const card = e.target.closest('.guide'); if (card) openProfile(card.dataset.g); });
    initProfile();
  }

  /* profile + video intro */
  const LINE_MS = 3900;
  const pf = { g: null, t: 0, dur: 0, playing: false, last: 0, raf: 0, line: -1, slide: -1 };
  const vLines = () => pf.g.intro[S.lang] || pf.g.intro.en;
  const mmss = ms => { const s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function renderProfileBody() {
    const g = pf.g;
    const langs = g.langs.map(([c, l]) => `<div class="lvl"><span>${esc(tx(D.LANGS[c]))}</span><span class="lvl__bar"><i style="width:${D.LEVEL_PCT[l]}%"></i></span><span class="data">${esc(l === 'N' ? (S.lang === 'de' ? 'MS' : 'N') : l)}</span></div>`).join('');
    const trips = g.trips.map(id => `<button class="chip" type="button" data-pftrip="${id}">${esc(tx(tripById(id).name))}</button>`).join('');
    const revs = g.revs.map(r => `<article class="review"><span class="stars" aria-label="${r.r} / 5">${'★'.repeat(r.r)}${'☆'.repeat(5 - r.r)}</span><p>${esc(tx(r.t))}</p><footer><span>${esc(r.n)}, ${esc(r.c)}</span><span>${esc(r.m)}</span></footer></article>`).join('');
    $('#pfBody').innerHTML = `
      <div class="profile__head" style="display:grid;gap:.5rem">
        <div style="display:flex;gap:.7rem;align-items:center;flex-wrap:wrap"><span class="verified">${icon('i-badge')}${esc(T('checkedOn', { d: isoDate(g.checked) }))}</span><span class="sample-tag">${S.lang === 'de' ? 'Beispielprofil' : 'Sample profile'}</span></div>
        <h3 id="pfName">${esc(g.name)}</h3><p class="muted">${esc(tx(g.base))} · ${esc(tx(g.spec))}</p>
      </div>
      <div class="facts"><div><span class="data">${g.years}</span><span>${esc(T('yearsGuiding'))}</span></div><div><span class="data">${num1(g.rating)}</span><span>${g.reviews} ${esc(T('reviews'))}</span></div><div><span class="data">${g.langs.length}</span><span>${esc(T('languages'))}</span></div></div>
      <div><p class="sublabel">${esc(T('languages'))}</p><div style="display:grid;gap:.5rem">${langs}</div></div>
      <div><p class="sublabel">${esc(T('certs'))}</p><ul class="certs">${g.certs.map(c => `<li>${icon('i-check')}<span>${esc(tx(c))}</span></li>`).join('')}</ul></div>
      <div><p class="sublabel">${esc(T('leads'))}</p><div style="display:flex;gap:.4rem;flex-wrap:wrap">${trips}</div></div>
      <div><p class="sublabel"><span>${esc(T('reviewsH'))}</span><span class="sample-tag">${S.lang === 'de' ? 'Beispiele' : 'Samples'}</span></p><div style="display:grid;gap:.6rem">${revs}</div></div>
      <button class="btn btn--sun" type="button" id="pfRequest">${esc(T('request', { name: g.name.split(' ')[0] }))}</button>`;
  }
  function openProfile(id) {
    const g = D.GUIDES.find(x => x.id === id); if (!g) return;
    pf.g = g;
    $('#pfSlides').innerHTML = g.slides.map(s => `<img src="${s}" alt="">`).join('');
    renderProfileBody();
    const dlg = $('#profile');
    dlg.showModal();
    startVideo();
  }
  function setPlayIcon() {
    const b = $('#pfPlay'), done = !pf.playing && pf.t >= pf.dur;
    b.innerHTML = icon(pf.playing ? 'i-pause' : done ? 'i-replay' : 'i-play');
    b.setAttribute('aria-label', T(pf.playing ? 'pause' : done ? 'replay' : 'play'));
  }
  function startVideo() { pf.t = 0; pf.dur = vLines().length * LINE_MS; pf.line = -1; pf.slide = -1; pf.playing = true; pf.last = performance.now(); setPlayIcon(); cancelAnimationFrame(pf.raf); pf.raf = requestAnimationFrame(tick); }
  function tick(now) {
    if (!pf.playing) return;
    pf.t += now - pf.last; pf.last = now;
    if (pf.t >= pf.dur) { pf.t = pf.dur; pf.playing = false; setPlayIcon(); }
    renderVideo();
    if (pf.playing) pf.raf = requestAnimationFrame(tick);
  }
  function renderVideo() {
    const lines = vLines();
    pf.dur = lines.length * LINE_MS;
    const li = Math.min(lines.length - 1, Math.floor(pf.t / LINE_MS));
    const cap = $('#pfCaption');
    if (li !== pf.line) {
      pf.line = li; cap.textContent = lines[li];
      if (G && !RM) G.fromTo(cap, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: 'power3.out' });
    }
    const imgs = $$('#pfSlides img'), n = imgs.length, si = Math.min(n - 1, Math.floor(pf.t / (pf.dur / n)));
    if (si !== pf.slide) {
      pf.slide = si;
      imgs.forEach((im, i) => {
        const on = i === si;
        if (G && !RM) {
          G.to(im, { opacity: on ? 1 : 0, duration: 1, ease: 'power1.inOut' });
          if (on) G.fromTo(im, { scale: 1.14, xPercent: i % 2 ? 2 : -2 }, { scale: 1.02, xPercent: i % 2 ? -2 : 2, duration: pf.dur / n / 1000 + 1.2, ease: 'none' });
        } else im.classList.toggle('is-on', on);
      });
    }
    $('#pfBar').style.width = (pf.t / pf.dur * 100).toFixed(2) + '%';
    $('#pfTime').textContent = mmss(pf.t) + ' / ' + mmss(pf.dur);
  }
  function initProfile() {
    const dlg = $('#profile');
    $('#pfPlay').addEventListener('click', () => {
      if (pf.playing) { pf.playing = false; cancelAnimationFrame(pf.raf); }
      else if (pf.t >= pf.dur) { startVideo(); return; }
      else { pf.playing = true; pf.last = performance.now(); pf.raf = requestAnimationFrame(tick); }
      setPlayIcon();
    });
    const close = () => dlg.close();
    $('#pfClose').addEventListener('click', close);
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    dlg.addEventListener('close', () => { pf.playing = false; cancelAnimationFrame(pf.raf); });
    $('#pfBody').addEventListener('click', e => {
      if (e.target.closest('#pfRequest')) {
        const g = pf.g; close();
        toast(T('toastGuide', { name: g.name }));
        openDrawer({ trip: g.trips[0], guide: g.id });
      }
      const t = e.target.closest('[data-pftrip]');
      if (t) { close(); selectTrip(t.dataset.pftrip, true); document.getElementById('preview').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); }
    });
  }

  /* ================= TRIP BUILDER (chat) ================= */
  const Chat = { turns: [], plan: null, plans: {}, busy: false, sample: undefined, off: false, touched: false, seq: 0 };
  function setEngineLabel() {
    const useClaude = Chat.sample && !Chat.off;
    $('#chatEngine').textContent = T(useClaude ? 'engineClaude' : 'engineLocal');
  }
  function setChatLang(l) {
    S.chatLang = l === 'de' ? 'de' : 'en';
    $$('[data-chatlang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.chatlang === S.chatLang)));
    renderSuggest();
  }
  function renderSuggest() {
    $('#chatSuggest').innerHTML = I.suggest[S.chatLang].map(s => `<button class="chip" type="button" data-say="${esc(s)}">${esc(s)}</button>`).join('');
  }
  const log = () => $('#chatLog');
  const scrollLog = () => { const l = log(); l.scrollTop = l.scrollHeight; };
  function addMsg(cls, html, anim) {
    const el = document.createElement('div');
    el.className = 'msg ' + cls; el.innerHTML = html;
    log().appendChild(el); scrollLog();
    if (anim && G && !RM) G.from(el, { y: 12, opacity: 0, duration: .38, ease: 'power3.out' });
    return el;
  }
  const addUser = (text, anim) => addMsg('msg--user', `<div class="msg__b">${esc(text)}</div>`, anim);
  function showTyping(viaClaude) {
    const el = document.createElement('div'); el.className = 'typing'; el.id = 'typing';
    el.innerHTML = `<i></i><i></i><i></i><span>${esc(T(viaClaude ? 'claudeThinking' : 'thinking', null, S.chatLang))}</span>`;
    log().appendChild(el); scrollLog();
  }
  const hideTyping = () => { const t = $('#typing'); if (t) t.remove(); };

  /* passport scrubbing: never keep passport-like numbers */
  function scrubPassport(text) {
    let removed = false;
    const rep = S.chatLang === 'de' ? '[entfernt]' : '[removed]';
    let out = text;
    out = out.replace(/\b(?=[A-Z0-9]{8,10}\b)(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{8,10}\b/g, () => { removed = true; return rep; });
    if (/pass(port|nummer|-?nr)?\b|reisepass|\bid\b|ausweis/i.test(text)) out = out.replace(/\b(?=[a-z0-9]{6,10}\b)(?=[a-z0-9]*\d)(?=[a-z0-9]*[a-z])[a-z0-9]{6,10}\b/gi, () => { removed = true; return rep; });
    return { text: out, removed };
  }
  function detectLang(s) {
    const de = (s.match(/\b(ich|und|mit|meiner|meinem|meine|tage|tagen|wandern|wochenende|mutter|vater|kinder|ist|das|im|ab|leicht|sportlich|kostet|inklusive|darf|wie|was|für|nicht|bitte|danke|hallo|reise|zwei|drei|vier|fünf|sechs|seen|leichte)\b/gi) || []).length;
    const en = (s.match(/\b(the|and|with|my|days?|is|what|how|for|in|from|can|i|it|does|travelling|traveling|hiking|lakes|easy|cost)\b/gi) || []).length;
    if (de > en && de >= 1) return 'de';
    if (en > de && en >= 1) return 'en';
    return null;
  }
  const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, ein: 1, eine: 1, einen: 1, zwei: 2, drei: 3, vier: 4, 'fünf': 5, fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10 };
  function parseDays(s) {
    let m = s.match(/(\d{1,2})\s*-?\s*(?:days?|tage?n?|nights?|nächte|naechte)\b/i); if (m) return +m[1];
    m = s.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eine?n?|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn)\s*-?\s*(?:days?|tage?n?|nights?|nächte)\b/i); if (m) return NUMW[m[1].toLowerCase()];
    if (/weekend|wochenende/i.test(s)) return 3;
    if (/\b(a|one|eine)\s+(week|woche)\b/i.test(s)) return 7;
    return null;
  }
  const MONTHS = [['jan', 'januar', 'january'], ['feb', 'februar', 'february'], ['march', 'märz', 'maerz'], ['apr', 'april'], ['mai'], ['jun', 'juni', 'june'], ['jul', 'juli', 'july'], ['aug', 'august'], ['sep', 'sept', 'september'], ['oct', 'okt', 'october', 'oktober'], ['nov', 'november'], ['dec', 'dez', 'december', 'dezember']];
  function parseMonth(s) {
    const toks = s.toLowerCase().split(/[^a-zäöüß]+/);
    for (let i = 0; i < 12; i++) if (MONTHS[i].some(n => toks.includes(n))) return i + 1;
    if (/\b(in|for|during|early|late|mid|end of|this|next)\s+may\b|\bmay\s+\d{4}\b/i.test(s)) return 5;
    return null;
  }
  function parseTravellers(s) {
    let m = s.match(/(\d)\s*(?:people|persons?|personen|travell?ers?|reisende|hikers?|wanderer|adults?|erwachsene)\b/i); if (m) return clampInt(m[1], 1, 6, 2);
    m = s.match(/\b(two|three|four|five|six|zwei|drei|vier|fünf|sechs)\s+(?:people|persons|personen|travell?ers|reisende|hikers|wanderer|adults|erwachsene|of us|friends|freunde)\b/i); if (m) return NUMW[m[1].toLowerCase()];
    if (/\b(alone|solo|by myself|allein|alleine)\b/i.test(s)) return 1;
    if (/(zu zweit|couple|\bpaar\b|partner|wife|husband|\bfrau\b|\bmann\b|freundin|girlfriend|boyfriend|mother|\bmom\b|\bmum\b|mutter|\bmama\b|father|\bdad\b|vater|\bpapa\b|friend)/i.test(s)) return 2;
    return null;
  }
  const RX = {
    gentle: /(mother|\bmom\b|\bmum\b|mutter|\bmama\b|father|\bdad\b|vater|\bpapa\b|parents|eltern|grand|\boma\b|\bopa\b|kids?\b|children|kinder|senior|older|ältere|knee|knie|\beasy\b|gentle|relaxed|leicht|sanft|ruhig|gemütlich|entspannt|not too hard|nicht zu anstrengend)/i,
    hard: /(\bfit\b|sportlich|challeng|anspruchsvoll|\bhard\b|demanding|long hikes?|lange wanderung|steil|summit|gipfel)/i,
    turk: /(turkestan|turkistan|silk|seiden|culture|kultur|history|geschichte|mausoleum|yasawi|yasavi|otrar|sauran|architektur|architecture)/i,
    bura: /(burabay|borovoe|borowoje|astana|nur-sultan|forest|\bwald\b|pine|kiefer|weekend|wochenende|north|norden)/i,
    alm: /(almaty|charyn|canyon|schlucht|kolsai|kaindy|\blakes?\b|\bseen\b|bergsee|tian ?shan|mountains?|\bberge?\b|gebirge)/i,
    price: /(price|cost|how much|kost|preis|wie viel|wieviel|€|euro)/i,
    incl: /(includ|inklusive|inbegriffen|enthalten|inkl\.)/i,
    hello: /^\s*(hi|hello|hey|hallo|servus|moin|guten (tag|morgen|abend)|salem)\b/i,
    thanks: /(thanks|thank you|danke)/i
  };
  const CH = {
    alm: { 2: ['ala-charyn-saty', 'kaindy-almaty'], 3: ['ala-charyn-saty', 'kolsai-lakes', 'kaindy-almaty'], 4: ['ala-charyn-saty', 'kolsai-lakes', 'kaindy-saty', 'saty-almaty'], 5: ['ala-charyn-saty', 'kolsai-lakes', 'kaindy-saty', 'saty-almaty', 'bal-airport'] },
    bura: { 2: ['nqz-burabay', 'burabay-nqz'], 3: ['nqz-burabay', 'burabay-kokshe', 'burabay-nqz'] },
    turk: { 2: ['hsa-turkestan', 'karatau-hsa'], 3: ['hsa-turkestan', 'sauran-otrar', 'karatau-hsa'] },
    combo: { 4: ['nqz-burabay', 'burabay-fly-ala', 'ala-charyn-saty', 'kaindy-almaty'], 5: ['nqz-burabay', 'burabay-fly-ala', 'ala-charyn-saty', 'kolsai-lakes', 'kaindy-almaty'], 6: ['nqz-burabay', 'burabay-kokshe', 'burabay-fly-ala', 'ala-charyn-saty', 'kolsai-lakes', 'kaindy-almaty'], 7: ['nqz-burabay', 'burabay-fly-ala', 'ala-charyn-saty', 'kolsai-lakes', 'kaindy-saty', 'saty-almaty', 'bal-airport'], 8: ['nqz-burabay', 'burabay-kokshe', 'burabay-fly-ala', 'ala-charyn-saty', 'kolsai-lakes', 'kaindy-saty', 'saty-almaty', 'bal-airport'] }
  };
  const SEASON = { almaty: [5, 6, 7, 8, 9, 10], burabay: [5, 6, 7, 8, 9], turkestan: [4, 5, 6, 9, 10] };
  const pickChain = (tbl, d) => { const ks = Object.keys(tbl).map(Number); const k = Math.max(Math.min(...ks), Math.min(Math.max(...ks), d)); return { mods: tbl[k], capped: d > Math.max(...ks), raised: d < Math.min(...ks) }; };
  function makePlan(ids, o) {
    o = o || {};
    const trip = D.TRIPS.find(t => t.modules.join() === ids.join()) || null;
    const best = trip || D.TRIPS.slice().sort((a, b) => b.modules.filter(x => ids.includes(x)).length - a.modules.filter(x => ids.includes(x)).length)[0];
    const regions = [...new Set(ids.map(id => D.MODULES[id].region))];
    const season = regions.reduce((acc, r) => acc.filter(m => SEASON[r].includes(m)), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const p = { key: 'p' + (++Chat.seq), ids, mods: modsOf(ids), pace: o.pace || 'standard', n: o.n || 2, month: o.month || null, tripId: trip ? trip.id : null, nearest: best.id, regions, season, notes: o.notes || [] };
    p.base = baseOf(ids);
    p.title = trip ? trip.name : composeTitle(regions, ids.length);
    Chat.plans[p.key] = p;
    return p;
  }
  function composeTitle(regions, days) {
    const names = { almaty: { en: 'Charyn & Kolsai', de: 'Charyn & Kolsai' }, burabay: { en: 'Burabay', de: 'Burabay' }, turkestan: { en: 'Turkestan', de: 'Turkestan' } };
    const parts = regions.map(r => names[r]);
    return { en: parts.map(x => x.en).join(' + ') + ` · ${days} days`, de: parts.map(x => x.de).join(' + ') + ` · ${days} Tage` };
  }
  function regionPhrase(regions, lang) {
    const de = lang === 'de';
    const key = regions.join('+');
    const P = {
      'burabay+almaty': de ? 'zuerst Kiefernwald und Granit in Burabay, dann ein Flug in den Süden zum Charyn-Canyon und zu den Kolsai-Seen' : "Burabay's pine forest and granite first, then a flight south to Charyn Canyon and the Kolsai Lakes",
      'almaty': de ? 'der Charyn-Canyon, danach die Kolsai-Seen und Kaindy' : 'Charyn Canyon, then the Kolsai Lakes and Kaindy',
      'burabay': de ? 'die Seen und Kiefernwälder von Burabay' : "Burabay's lakes and pine forest",
      'turkestan': de ? 'Turkistan, Sauran und Otrar an der Seidenstraße' : 'Turkistan, Sauran and Otrar on the Silk Road'
    };
    return P[key] || regions.join(', ');
  }
  function localAnswer(text, lang) {
    const de = lang === 'de';
    if (RX.hello.test(text) && text.length < 30) return { lang, reply: de ? 'Hallo! Sag mir, wie viele Tage du hast, wer mitkommt und was du sehen möchtest. Ich baue dir einen Plan aus unseren echten Reisen.' : "Hi! Tell me how many days you have, who's coming and what you'd like to see, and I'll build a plan from our real trips." };
    if (RX.thanks.test(text) && text.length < 40) return { lang, reply: de ? 'Gern! Wenn du buchen möchtest, nimm den Button am Plan. Bei Fragen hilft ein Manager auf WhatsApp.' : "You're welcome. Use the button on the plan when you're ready to book, or ask a manager on WhatsApp." };
    if (RX.incl.test(text)) return answerInclusion(text, lang);
    const days = parseDays(text), month = parseMonth(text), n = parseTravellers(text);
    const f = { turk: RX.turk.test(text), bura: RX.bura.test(text), alm: RX.alm.test(text) };
    const hike = /(hik|wander|trek|walk|spazier)/i.test(text);
    if (RX.price.test(text) && !days) return answerPrice(text, lang, f, month, n);
    if (!(days || month || n || f.turk || f.bura || f.alm || hike || RX.gentle.test(text))) return handoff(lang);
    const d = days || 5;
    const notes = [];
    let ch;
    if (f.turk && !f.alm && !f.bura) { ch = pickChain(CH.turk, d); if (ch.capped) notes.push(de ? 'Turkestan-Reisen dauern bei uns bis zu 3 Tage. Ein Manager kann sie mit den Bergen kombinieren (Inlandsflug).' : 'Our Turkestan trips run up to 3 days. A manager can combine them with the mountains via a domestic flight.'); }
    else if (f.bura && !f.alm) { ch = d <= 3 ? pickChain(CH.bura, d) : pickChain(CH.combo, d); if (d > 3) notes.push(de ? 'Für mehr als 3 Tage kombiniere ich Burabay mit den Bergen im Süden.' : 'For more than 3 days I combine Burabay with the mountains in the south.'); }
    else if (f.alm && !f.bura) { ch = d <= 5 ? pickChain(CH.alm, d) : pickChain(CH.combo, d); if (d > 5) notes.push(de ? 'Für mehr als 5 Tage beginnt der Plan in Burabay im Norden.' : 'For more than 5 days the plan starts in Burabay in the north.'); }
    else if (f.alm && f.bura) { ch = pickChain(CH.combo, Math.max(4, d)); if (d < 4) notes.push(de ? 'Beide Regionen brauchen mindestens 4 Tage.' : 'Both regions need at least 4 days.'); }
    else { ch = d >= 5 ? pickChain(CH.combo, d) : pickChain(CH.alm, d); }
    if (ch.capped) notes.push(de ? `Unser längster Plan hat ${ch.mods.length} Tage. Freie Tage in Almaty plant ein Manager gern dazu.` : `Our longest plan is ${ch.mods.length} days. A manager can add free days in Almaty.`);
    if (ch.raised) notes.push(de ? `Die kürzeste passende Reise hat ${ch.mods.length} Tage.` : `The shortest matching trip is ${ch.mods.length} days.`);
    const pace = RX.gentle.test(text) && !RX.hard.test(text) ? 'gentle' : 'standard';
    const plan = makePlan(ch.mods, { pace, n: n || 2, month, notes });
    Chat.plan = plan;
    const who = plan.n === 1 ? (de ? 'für dich allein' : 'for one traveller') : (de ? `für ${plan.n} Personen` : `for ${plan.n} travellers`);
    let r = de ? `Hier ist ein Plan über ${plan.ids.length} Tage${pace === 'gentle' ? ' in ruhigem Tempo' : ''} ${who}: ${regionPhrase(plan.regions, 'de')}.` : `Here's a ${plan.ids.length}-day plan${pace === 'gentle' ? ' at a gentle pace' : ''} ${who}: ${regionPhrase(plan.regions, 'en')}.`;
    if (pace === 'gentle' && plan.mods.some(m => m.gentle)) r += de ? ' Jeder Wandertag hat eine leichte Variante, du entscheidest vor Ort. Am Kolsai geht z. B. der Uferweg statt des Aufstiegs zum See 2.' : ' Every walking day has an easy option you can choose on the day, for example the lakeshore path at Kolsai instead of the climb to Lake 2.';
    if (month) {
      if (plan.season.includes(month)) r += de ? ` Der ${monthName(month, 'de')} liegt für alle Stationen in der Saison.` : ` ${monthName(month, 'en')} is in season for every stop.`;
      else {
        const alt = SEASON.turkestan.includes(month) && !plan.regions.includes('turkestan');
        r += de ? ` Im ${monthName(month, 'de')} laufen hier keine Gruppenreisen${alt ? '; Turkestan wäre dann ideal' : ''}.` : ` We don't run these trips in ${monthName(month, 'en')}${alt ? '; Turkestan is a good choice that month' : ''}.`;
      }
    }
    if (notes.length) r += ' ' + notes.join(' ');
    r += de ? ' Preis und Leistungen pro Tag siehst du unten.' : ' Price and daily inclusions are below.';
    return { lang, reply: r, plan };
  }
  function answerInclusion(text, lang) {
    const de = lang === 'de';
    const plan = Chat.plan || makePlan(D.TRIPS[0].modules, {});
    const dm = text.match(/(?:day|tag)\s*(\d)/i);
    const di = dm ? clampInt(dm[1], 1, plan.mods.length, 1) - 1 : null;
    const W = [
      [/(lunch|mittag)/i, ['l'], null], [/(breakfast|frühstück|fruehstueck)/i, ['b'], null], [/(dinner|abendessen|abends essen)/i, ['d'], null],
      [/(entrance|eintritt|park|fee|gebühr|ticket)/i, ['parkfee', 'tickets'], null], [/(transport|transfer|car|auto|fahrt|bus|4x4|4×4)/i, ['transport', 'x4', 'pickup', 'dropoff'], null],
      [/(hotel|room|zimmer|unterkunft|guesthouse|gästehaus|night|nacht|übernacht)/i, ['guesthouse', 'hotel'], null], [/(guide|führer)/i, ['guide'], null], [/(water|wasser|snack)/i, ['water'], null],
      [/(horse|pferd|reiten)/i, [], ['horse2', 'horseK']], [/(kayak|kajak)/i, [], ['kayak']], [/(flight|flug)/i, [], ['flight']], [/(sauna|banya|banja)/i, [], ['banya']], [/(tip|trinkgeld)/i, [], ['tips']]
    ];
    const hit = W.find(w => w[0].test(text));
    const days = di == null ? plan.mods.map((m, i) => i) : [di];
    const dayLabel = i => `${de ? 'Tag' : 'Day'} ${i + 1} (${tx(plan.mods[i].title, lang)})`;
    if (!hit) {
      if (di == null) return handoff(lang);
      const m = plan.mods[di];
      return { lang, reply: (de ? `${dayLabel(di)} enthält: ` : `${dayLabel(di)} includes: `) + m.inc.map(k => tx(D.INC[k], lang)).join(', ') + '.' + (m.extra.length ? (de ? ' Selbst zahlst du: ' : ' You pay yourself: ') + m.extra.map(k => tx(D.EXTRA[k].n, lang) + (D.EXTRA[k].p ? ' ' + xp(D.EXTRA[k].p, lang) : '')).join(', ') + '.' : '') };
    }
    const [, keys, extras] = hit;
    if (extras) {
      const e = days.map(i => plan.mods[i].extra.find(x => extras.includes(x))).find(Boolean);
      if (e) return { lang, reply: de ? `${tx(D.EXTRA[e].n, lang)} ist nicht inklusive. Du zahlst ${D.EXTRA[e].p ? xp(D.EXTRA[e].p, lang) : 'nach Wunsch'} direkt vor Ort.` : `${tx(D.EXTRA[e].n, lang)} isn't included. You pay ${D.EXTRA[e].p ? xp(D.EXTRA[e].p, lang) : 'what you like'} on the spot.` };
      return handoff(lang);
    }
    const yes = days.filter(i => plan.mods[i].inc.some(k => keys.includes(k)));
    const what = tx(D.INC[keys.find(k => days.some(i => plan.mods[i].inc.includes(k))) || keys[0]], lang);
    if (di != null) {
      return yes.length
        ? { lang, reply: de ? `Ja. ${dayLabel(di)} enthält ${what}. Alle Leistungen des Tages: ${plan.mods[di].inc.map(k => tx(D.INC[k], lang)).join(', ')}.` : `Yes. ${dayLabel(di)} includes ${what.toLowerCase()}. Everything that day: ${plan.mods[di].inc.map(k => tx(D.INC[k], lang)).join(', ')}.` }
        : { lang, reply: de ? `Nein, an ${dayLabel(di)} ist ${what} nicht enthalten. Dein Guide zeigt dir gute Orte dafür.` : `No, ${what.toLowerCase()} isn't included on ${dayLabel(di)}. Your guide will show you a good place for it.` };
    }
    return { lang, reply: de ? `${what}: an ${yes.length ? yes.map(i => 'Tag ' + (i + 1)).join(', ') : 'keinem Tag'} inklusive.` : `${what}: included on ${yes.length ? yes.map(i => 'day ' + (i + 1)).join(', ') : 'no day'} of your plan.` };
  }
  function answerPrice(text, lang, f, month, n) {
    const de = lang === 'de';
    const trip = f.turk ? tripById('silk') : (f.bura && f.alm) ? tripById('loop') : f.bura ? tripById('burabay') : f.alm ? tripById('lakes') : (Chat.plan && Chat.plan.tripId ? tripById(Chat.plan.tripId) : null);
    if (!trip && Chat.plan) {
      const p = Chat.plan, pp = perPerson(p.base, p.n);
      return { lang, reply: de ? `Dein Plan kostet ${eur(pp, 'de')} pro Person bei ${p.n} Reisenden, zusammen ${eur(pp * p.n, 'de')}. Internationale Flüge sind nicht enthalten.` : `Your plan costs ${eur(pp, 'en')} per person for ${p.n} travellers, ${eur(pp * p.n, 'en')} in total. International flights aren't included.` };
    }
    if (!trip) return handoff(lang);
    const nn = n || 2, pp = perPerson(baseOf(trip.modules), nn);
    const deps = departures(trip).filter(d => !month || d.month === month).slice(0, 3);
    let r = de ? `${tx(trip.name, 'de')} (${trip.modules.length} Tage) kostet ${eur(pp, 'de')} pro Person bei ${nn} Reisenden, zusammen ${eur(pp * nn, 'de')}.` : `${tx(trip.name, 'en')} (${trip.modules.length} days) costs ${eur(pp, 'en')} per person for ${nn} travellers, ${eur(pp * nn, 'en')} in total.`;
    if (month && !deps.length) r += de ? ` Im ${monthName(month, 'de')} gibt es keine Gruppentermine; private Termine sind möglich.` : ` There are no group departures in ${monthName(month, 'en')}; private dates are possible.`;
    else if (deps.length) r += (de ? ' Nächste Termine: ' : ' Next departures: ') + deps.map(d => fdate(d.date, lang, { year: undefined })).join(', ') + ' 2027.';
    Chat.plan = makePlan(trip.modules, { n: nn, month });
    return { lang, reply: r, plan: Chat.plan };
  }
  function handoff(lang) {
    const de = lang === 'de';
    return { lang, handoff: true, reply: de ? 'Das steht nicht in unseren Reisedaten, deshalb rate ich nicht. Ein Manager beantwortet es auf WhatsApp, Mo–Fr 09:00–18:00 Uhr Astana-Zeit. Tippe unten, um ihm diesen Chat zu schicken.' : "That isn't in our trip data, so I won't guess. A manager can answer on WhatsApp, Monday to Friday 09:00–18:00 Astana time. Tap below to send them this chat." };
  }
  function waLink(lang) {
    const de = lang === 'de';
    const lastQ = Chat.turns.filter(t => t.role === 'user').slice(-1)[0];
    let msg = de ? 'Hallo Saryarqa Routes! ' : 'Hello Saryarqa Routes! ';
    if (Chat.plan) msg += (de ? 'Mein Plan aus dem Trip Builder: ' : 'My Trip Builder plan: ') + `${tx(Chat.plan.title, lang)}, ${Chat.plan.n} ${de ? 'Reisende' : 'travellers'}${Chat.plan.month ? ', ' + monthName(Chat.plan.month, lang) : ''}. `;
    if (lastQ) msg += (de ? 'Frage: ' : 'Question: ') + lastQ.content;
    return 'https://wa.me/?text=' + encodeURIComponent(msg);
  }
  function planCard(p, lang) {
    const de = lang === 'de';
    const pp = perPerson(p.base, p.n);
    const stops = routeLine(p.ids).map(s => esc(tx(SHORT[s] || D.STOPS[s].name, lang)));
    const rows = p.mods.map((m, i) => {
      const g = p.pace === 'gentle' && m.gentle; const h = g ? m.gentle.hike : m.hike; const lv = g ? m.gentle.level : m.level;
      return `<li><span class="data">${T('day', null, lang)} ${i + 1}</span><span><b>${esc(tx(m.title, lang))}</b><br><span class="muted">${num(h.km, lang)} km · +${num(h.up, lang)} m · ${hrs(h.h, lang)}${g ? ' · ' + esc(T('gentleOpt', null, lang)) : ''}</span></span><span class="pill pill--${lv}">${esc(T(lv, null, lang))}</span></li>`;
    }).join('');
    const incKeys = Object.keys(D.INC).filter(k => p.mods.some(m => m.inc.includes(k)));
    const exKeys = [...new Set(p.mods.flatMap(m => m.extra))].filter(k => k !== 'tips');
    let deps = '';
    if (p.tripId) {
      const all = departures(tripById(p.tripId));
      const list = (p.month ? all.filter(d => d.month === p.month) : all).slice(0, 3);
      deps = list.length ? list.map(d => fdate(d.date, lang)).join(', ') : esc(T('privateDate', null, lang));
    } else deps = esc(T('privateDate', null, lang));
    return `<div class="plan" data-plan="${p.key}">
      <div class="plan__top"><div class="plan__title">${esc(tx(p.title, lang))}</div>
        <div class="plan__price"><span class="data">${eur(pp, lang)}</span><small>${esc(T('estPrice', null, lang))}, ${esc(p.n === 1 ? T('forOne', null, lang) : T('forN', { n: p.n }, lang))}</small></div>
        <div class="plan__route">${stops.join(icon('i-chev'))}${p.pace === 'gentle' ? ` <span class="pill pill--easy">${esc(T('gentle', null, lang))}</span>` : ''}</div></div>
      <ol class="plan__days">${rows}</ol>
      <div class="plan__inc"><div><span class="k">${esc(T('incl', null, lang))}:</span>${incKeys.map(k => `<span class="pill pill--easy">${esc(tx(D.INC[k], lang))}</span>`).join('')}</div>
        <div><span class="k">${esc(T('notIncl', null, lang))}:</span><span class="pill pill--demanding">${de ? 'Internationale Flüge' : 'International flights'}</span>${exKeys.map(k => `<span class="pill pill--demanding">${esc(tx(D.EXTRA[k].n, lang))} ${esc(xp(D.EXTRA[k].p, lang))}</span>`).join('')}</div>
        <div><span class="k">${esc(T('departures', null, lang))}:</span><span>${deps}</span></div></div>
      <div class="plan__foot"><button class="btn btn--sm btn--ghost" type="button" data-act="preview">${esc(T('seePreview', null, lang))}</button><button class="btn btn--sm btn--sun" type="button" data-act="book">${esc(T('bookPlan', null, lang))}</button><a class="btn btn--sm btn--ghost" data-act="wa" href="${esc(waLink(lang))}" target="_blank" rel="noopener">${icon('i-whats')}${esc(T('askManager', null, lang))}</a></div>
    </div>`;
  }
  function renderBot(res, viaClaude, anim) {
    const lang = res.lang;
    let html = `<div class="msg__b">${esc(res.reply)}</div>`;
    if (res.plan) html += planCard(res.plan, lang);
    if (res.handoff) html += `<div><a class="btn btn--sm btn--ghost" href="${esc(waLink(lang))}" target="_blank" rel="noopener">${icon('i-whats')}${esc(T('openWA', null, lang))}</a></div>`;
    html += `<span class="msg__src">${icon('i-db')}${esc(T(viaClaude ? 'srcClaude' : 'src', { d: isoDate(D.UPDATED, lang) }, lang))}</span>`;
    const el = addMsg('msg--bot', html, anim);
    if (anim && G && !RM) G.from(el.querySelectorAll('.plan__days li'), { x: -10, opacity: 0, duration: .35, stagger: .05, ease: 'power3.out', delay: .15 });
  }
  function rules() {
    const data = {
      today: '2026-10-25 (next season departures are in 2027)',
      pricing: { note: 'Module prices are EUR per person for 2 travellers sharing. Group factor: 1 traveller x1.4, 3-4 travellers x0.92, 5-6 x0.88. Single room +28 EUR per night. Deposit 20%, balance 30 days before, free cancellation until 45 days before. Max group 6.' },
      office: 'Managers on WhatsApp Mon-Fri 09:00-18:00 Astana time (UTC+5).',
      modules: Object.fromEntries(Object.entries(D.MODULES).map(([id, m]) => [id, { region: m.region, title: m.title.en, start: m.legs[0][0], end: m.legs[m.legs.length - 1][1], price_eur: m.price, hike: m.hike, level: m.level, gentle_option: m.gentle ? { hike: m.gentle.hike, note: m.gentle.note.en } : null, max_altitude_m: m.maxAlt, included: m.inc.map(k => D.INC[k].en), pay_separately: m.extra.map(k => D.EXTRA[k].n.en + (D.EXTRA[k].p ? ' EUR ' + [].concat(D.EXTRA[k].p).join('-') : '')), night: m.sleep }])),
      trips: D.TRIPS.map(t => ({ id: t.id, name: t.name.en, modules: t.modules, season_months: t.months, fly_in: t.airIn, fly_out: t.airOut, guides: t.guides })),
      chains_that_work: CH,
      guides: D.GUIDES.map(g => ({ name: g.name, region: g.region, languages: g.langs.map(l => l.join(' ')).join(', '), years: g.years, trips: g.trips }))
    };
    const cur = Chat.plan ? Chat.plan.ids : null;
    return 'You are the Trip Builder for Saryarqa Routes, a small hiking tour company in Astana, Kazakhstan. You talk to independent travellers, mostly from Germany.\n'
      + 'Rules:\n- Use ONLY facts in DATA. Never invent trips, places, prices, dates, inclusions, visa rules, gear, weather or anything else.\n'
      + '- If the answer is not in DATA, say briefly that it is not in the trip data and set "handoff": true so a manager on WhatsApp answers.\n'
      + '- Never ask for or repeat passport numbers or other ID numbers.\n'
      + '- Reply in the language of the latest user message: German with informal "du", otherwise English. Plain text, no markdown, at most 80 words.\n'
      + '- To suggest a trip, return module ids in travel order (prefer a list from chains_that_work). Use "gentle" pace for older parents, children or anyone asking for easy walks. In that reply do NOT state prices, dates or inclusion lists: the page computes them from your ids.\n'
      + '- For direct questions about price or inclusions, answer exactly from DATA (CURRENT_PLAN is the plan on screen; "day 2" means its second module).\n'
      + 'Return only JSON: {"lang":"en"|"de","reply":string,"plan":null|{"modules":[string],"pace":"gentle"|"standard","travelers":number,"month":number|null},"handoff":boolean}\n'
      + 'CURRENT_PLAN: ' + JSON.stringify(cur) + '\nDATA: ' + JSON.stringify(data);
  }
  async function askClaude() {
    const turns = Chat.turns.slice(-8);
    while (turns.length && turns[0].role !== 'user') turns.shift();
    const out = await Chat.sample.json([{ role: 'user', content: rules() }, ...turns], { modelTier: 'quick', cache: false });
    if (!out || typeof out.reply !== 'string' || !out.reply.trim()) throw { code: 'invalid_json' };
    const lang = out.lang === 'de' ? 'de' : 'en';
    let plan = null;
    if (out.plan && Array.isArray(out.plan.modules)) {
      const ids = out.plan.modules.map(String).filter(id => D.MODULES[id]).slice(0, 10);
      if (ids.length) { plan = makePlan(ids, { pace: out.plan.pace === 'gentle' ? 'gentle' : 'standard', n: clampInt(out.plan.travelers, 1, 6, 2), month: clampInt(out.plan.month, 1, 12, null) }); Chat.plan = plan; }
    }
    return { lang, reply: out.reply.trim().slice(0, 900), plan, handoff: !!out.handoff };
  }
  async function send(text) {
    text = String(text || '').trim();
    if (!text || Chat.busy) return;
    Chat.touched = true;
    const l = detectLang(text); if (l && l !== S.chatLang) setChatLang(l);
    const sc = scrubPassport(text);
    addUser(sc.text, true);
    if (sc.removed) addMsg('msg--bot msg--note', `<div class="msg__b">${esc(T('passRemoved', null, S.chatLang))}</div>`, true);
    Chat.turns.push({ role: 'user', content: sc.text });
    Chat.busy = true; $('#chatForm button').disabled = true;
    const useClaude = Chat.sample && !Chat.off;
    showTyping(useClaude);
    let res = null, via = false;
    if (useClaude) {
      try { res = await askClaude(); via = true; }
      catch (e) {
        const c = e && e.code;
        if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'session_expired', 'tools_unavailable'].includes(c)) { Chat.off = true; setEngineLabel(); }
        res = null;
      }
    } else await new Promise(r => setTimeout(r, RM ? 150 : 700));
    if (!res) res = localAnswer(sc.text, l || S.chatLang);
    hideTyping();
    renderBot(res, via, true);
    Chat.turns.push({ role: 'assistant', content: res.reply + (res.plan ? `\n[plan modules: ${res.plan.ids.join(', ')}]` : '') });
    Chat.busy = false; $('#chatForm button').disabled = false;
  }
  function seedChat(lang) {
    log().innerHTML = ''; Chat.turns = []; Chat.plan = null;
    setChatLang(lang);
    const q = I.suggest[lang][0];
    addUser(q, false);
    Chat.turns.push({ role: 'user', content: q });
    const res = localAnswer(q, lang);
    renderBot(res, false, false);
    Chat.turns.push({ role: 'assistant', content: res.reply + (res.plan ? `\n[plan modules: ${res.plan.ids.join(', ')}]` : '') });
    log().scrollTop = 0;
  }
  function initChat() {
    seedChat(S.lang);
    renderSuggest();
    const input = $('#chatInput');
    $('#chatForm').addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; input.style.height = ''; send(v); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#chatForm').requestSubmit(); } });
    input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = Math.min(140, input.scrollHeight) + 'px'; });
    $('#chatSuggest').addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) send(b.dataset.say); });
    $$('[data-chatlang]').forEach(b => b.addEventListener('click', () => { setChatLang(b.dataset.chatlang); if (!Chat.touched) seedChat(S.chatLang); }));
    log().addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const p = Chat.plans[b.closest('[data-plan]').dataset.plan];
      if (b.dataset.act === 'preview') { selectTrip(p.tripId || p.nearest, true); document.getElementById('preview').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); }
      if (b.dataset.act === 'book') openDrawer(p.tripId ? { trip: p.tripId, n: p.n, month: p.month } : { plan: p, n: p.n });
    });
    if (window.claude && typeof window.claude.use === 'function') {
      window.claude.use('sample').then(fn => { Chat.sample = fn || null; setEngineLabel(); }).catch(() => { Chat.sample = null; });
    }
  }

  /* ================= PREVIEW ================= */
  let viewer = null, panoFallback = false;
  const tripScenes = trip => [...new Set(trip.modules.map(id => D.MODULES[id].scene))];
  function renderTabs() {
    $('#tripTabs').innerHTML = D.TRIPS.map(t => `<button class="chip" type="button" role="tab" data-tab="${t.id}" aria-selected="${t.id === S.trip}">${esc(tx(t.name))}<span class="data" style="opacity:.7">${t.modules.length}${S.lang === 'de' ? ' T' : 'd'}</span></button>`).join('');
  }
  function hsCfg(h) {
    return {
      pitch: h.p, yaw: h.y, type: 'info', cssClass: 'hs' + (h.t === 'photo' ? ' hs--photo' : ''),
      createTooltipFunc: (div, a) => {
        div.innerHTML = `<span class="hs__tip"><b>${esc(tx(a.h))}</b>${esc(tx(a.x))}</span>`;
        div.tabIndex = 0; div.setAttribute('role', 'button'); div.setAttribute('aria-label', tx(a.h));
        div.addEventListener('click', ev => { ev.stopPropagation(); div.classList.toggle('is-open'); });
      },
      createTooltipArgs: h
    };
  }
  function sceneCfg(sc) {
    const h = sc.haov, v = sc.vaov;
    return { type: 'equirectangular', panorama: sc.img, haov: h, vaov: v, vOffset: 0, minYaw: -h / 2, maxYaw: h / 2, minPitch: -v / 2, maxPitch: v / 2, yaw: 0, pitch: 0, hfov: Math.min(78, h * .7), minHfov: 30, maxHfov: Math.min(h * .92, 100), avoidShowingBackground: true, hotSpots: sc.hs.map(hsCfg) };
  }
  function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; } }
  function showFallback() {
    panoFallback = true;
    if (viewer) { try { viewer.destroy(); } catch (e) { /* ignore */ } viewer = null; }
    const sc = D.SCENES[S.scene];
    $('#pano').innerHTML = `<div class="pano__fallback"><img src="${sc.img}" alt="${esc(tx(sc.title))}"></div>`;
    $('#pRotate').hidden = $('#pIn').hidden = $('#pOut').hidden = $('#pFull').hidden = true;
    if (G && !RM) G.fromTo('#pano .pano__fallback img', { scale: 1.12 }, { scale: 1, duration: 8, ease: 'none' });
  }
  function initPano() {
    if (!window.pannellum || !webglOK()) { showFallback(); return; }
    try {
      const scenes = {};
      Object.entries(D.SCENES).forEach(([id, sc]) => { scenes[id] = sceneCfg(sc); });
      viewer = window.pannellum.viewer('pano', {
        default: { firstScene: S.scene, sceneFadeDuration: 800, autoLoad: true, showControls: false, mouseZoom: false, keyboardZoom: true, compass: false, autoRotate: RM ? false : -2.2, autoRotateInactivityDelay: 4000, showLoadingIndicator: false },
        scenes
      });
      viewer.on('error', showFallback);
      viewer.on('scenechange', id => { S.scene = id; syncSceneUI(); });
      $('#pRotate').setAttribute('aria-pressed', String(!RM));
    } catch (e) { showFallback(); }
  }
  function rebuildPano() {
    if (panoFallback) { showFallback(); return; }
    if (viewer) { try { viewer.destroy(); } catch (e) { /* ignore */ } viewer = null; }
    $('#pano').innerHTML = '';
    initPano();
  }
  function loadScene(id) {
    if (id === S.scene && (viewer || panoFallback)) { syncSceneUI(); return; }
    S.scene = id;
    if (panoFallback) showFallback();
    else if (viewer) { try { viewer.loadScene(id); } catch (e) { showFallback(); } }
    syncSceneUI();
  }
  function syncSceneUI() {
    const sc = D.SCENES[S.scene];
    $('#sceneTitle').textContent = tx(sc.title);
    $('#sceneSub').textContent = tx(sc.sub);
    $$('#sceneStrip button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scene === S.scene)));
  }
  function renderStrip(trip) {
    $('#sceneStrip').innerHTML = tripScenes(trip).map(id => `<button type="button" data-scene="${id}" aria-pressed="${id === S.scene}" aria-label="${esc(tx(D.SCENES[id].title))}"><img src="${D.SCENES[id].img}" alt="" loading="lazy"></button>`).join('');
  }
  function initPanoUI() {
    $('#sceneStrip').addEventListener('click', e => { const b = e.target.closest('[data-scene]'); if (!b) return; loadScene(b.dataset.scene); const trip = tripById(S.trip); const di = trip.modules.findIndex(id => D.MODULES[id].scene === b.dataset.scene); if (di >= 0) selectDay(di, false); });
    $('#pRotate').addEventListener('click', e => {
      if (!viewer) return; const on = e.currentTarget.getAttribute('aria-pressed') === 'true';
      if (on) viewer.stopAutoRotate(); else viewer.startAutoRotate(-2.2);
      e.currentTarget.setAttribute('aria-pressed', String(!on));
    });
    $('#pIn').addEventListener('click', () => viewer && viewer.setHfov(viewer.getHfov() - 12));
    $('#pOut').addEventListener('click', () => viewer && viewer.setHfov(viewer.getHfov() + 12));
    $('#pFull').addEventListener('click', () => { try { viewer && viewer.toggleFullscreen(); } catch (e) { /* not allowed here */ } });
  }

  /* route map */
  function renderMap(trip, animate) {
    const svg = $('#routeMap');
    const W = Math.max(320, Math.min(560, Math.round(svg.getBoundingClientRect().width) || 520)), H = W < 440 ? 400 : 380;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const legs = [];
    trip.modules.forEach((id, di) => D.MODULES[id].legs.forEach(l => legs.push({ a: l[0], b: l[1], mode: l[2], km: l[3], min: l[4], day: di })));
    const ids = []; legs.forEach(l => [l.a, l.b].forEach(s => { if (!ids.includes(s)) ids.push(s); }));
    const pts = ids.map(id => MAP.st[id]);
    let minX = Math.min(...pts.map(p => p[0])), maxX = Math.max(...pts.map(p => p[0])), minY = Math.min(...pts.map(p => p[1])), maxY = Math.max(...pts.map(p => p[1]));
    const minSpan = 30;
    if (maxX - minX < minSpan) { const c = (minX + maxX) / 2; minX = c - minSpan / 2; maxX = c + minSpan / 2; }
    if (maxY - minY < minSpan * .7) { const c = (minY + maxY) / 2; minY = c - minSpan * .35; maxY = c + minSpan * .35; }
    const padL = 34, padR = 34, padT = 44, padB = 70;
    const k = Math.min((W - padL - padR) / (maxX - minX), (H - padT - padB) / (maxY - minY));
    const offX = padL + ((W - padL - padR) - (maxX - minX) * k) / 2, offY = padT + ((H - padT - padB) - (maxY - minY) * k) / 2;
    const X = x => offX + (x - minX) * k, Y = y => offY + (y - minY) * k;
    const tr = `translate(${(offX - minX * k).toFixed(2)},${(offY - minY * k).toFixed(2)}) scale(${k.toFixed(4)})`;
    let h = `<defs><clipPath id="mapclip"><rect x="0" y="0" width="${W}" height="${H}" rx="0"/></clipPath></defs><g clip-path="url(#mapclip)">`;
    h += `<g transform="${tr}">`;
    Object.values(MAP.nb).forEach(d => { if (d) h += `<path d="${d}" class="nbp" vector-effect="non-scaling-stroke"/>`; });
    h += `<path d="${MAP.kz}" class="kzp" vector-effect="non-scaling-stroke"/>`;
    MAP.gr.forEach(g => { h += `<path d="${g.d}" class="gr" vector-effect="non-scaling-stroke"/>`; });
    h += '</g>';
    // screen positions & clusters
    const pos = {}; ids.forEach(id => { pos[id] = [X(MAP.st[id][0]), Y(MAP.st[id][1])]; });
    const main = ids.filter(id => !MINOR.includes(id));
    const clusters = [];
    main.forEach(id => {
      const c = clusters.find(cl => Math.hypot(cl.x - pos[id][0], cl.y - pos[id][1]) < 24);
      if (c) c.ids.push(id); else clusters.push({ ids: [id], x: pos[id][0], y: pos[id][1] });
    });
    const cOf = id => clusters.find(c => c.ids.includes(id));
    const P = id => { const c = cOf(id); return c ? [c.x, c.y] : pos[id]; };
    // legs
    let legsH = '', labs = '';
    const segLabels = [];
    legs.forEach((l, i) => {
      const A = P(l.a), B = P(l.b), dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy);
      if (len < 3) return;
      const bend = (i % 2 ? 1 : -1) * Math.min(40, len * .14);
      const cx = (A[0] + B[0]) / 2 - dy / len * bend, cy = (A[1] + B[1]) / 2 + dx / len * bend;
      const d = `M${A[0].toFixed(1)},${A[1].toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${B[0].toFixed(1)},${B[1].toFixed(1)}`;
      legsH += `<path d="${d}" class="rt-bg"/><path d="${d}" class="rt${l.mode !== 'road' ? ' rt--air' : ''}" data-day="${l.day}"/>`;
      if (len > 90 && l.mode !== 'hike') {
        const mx = .25 * A[0] + .5 * cx + .25 * B[0], my = .25 * A[1] + .5 * cy + .25 * B[1];
        const t = l.mode === 'air' ? `${S.lang === 'de' ? 'Flug' : 'Flight'} ${dur(l.min)}` : `${dur(l.min)} · ${l.km} km`;
        segLabels.push({ x: mx, y: my - 6, t });
      }
    });
    h += legsH;
    // minor stops
    ids.filter(id => MINOR.includes(id)).forEach(id => { const p = pos[id]; h += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" class="photo" opacity=".55"/>`; });
    // clusters: marker boxes first so labels avoid every marker
    const placed = clusters.map(c => [c.x - 10, c.y - 10, 20, 20]);
    const hit = bx => bx[0] < 4 || bx[0] + bx[2] > W - 4 || bx[1] < 4 || bx[1] + bx[3] > H - 4 || placed.some(p => bx[0] < p[0] + p[2] && bx[0] + bx[2] > p[0] && bx[1] < p[1] + p[3] && bx[1] + bx[3] > p[1]);
    clusters.forEach(c => {
      const shown = c.ids.filter(id => !(CITY[id] && c.ids.includes(CITY[id])));
      const label = shown.map(id => tx(SHORT[id] && shown.length > 1 ? SHORT[id] : D.STOPS[id].name)).join(' · ');
      const alt = shown.length === 1 ? D.STOPS[shown[0]].alt : null;
      const w = label.length * 6.7, hgt = alt ? 28 : 16;
      const R = [[13, 4, 'start'], [-13, 4, 'end'], [13, 20, 'start'], [-13, 20, 'end'], [13, -12, 'start'], [-13, -12, 'end'], [0, 26, 'middle'], [0, -20, 'middle']];
      const order = c.x < W * .6 ? R : [R[1], R[0], R[3], R[2], R[5], R[4], R[6], R[7]];
      const boxOf = ([dx, dy, an]) => { const x = c.x + dx, y = c.y + dy; return [an === 'start' ? x : an === 'end' ? x - w : x - w / 2, y - 12, w, hgt]; };
      const pick = order.find(o => !hit(boxOf(o))) || order[0];
      placed.push(boxOf(pick));
      const lx = c.x + pick[0], ly = c.y + pick[1], an = pick[2];
      const photo = c.ids.some(id => D.STOPS[id].photo);
      const isEnd = c.ids.includes(ids[0]) || c.ids.includes(ids[ids.length - 1]);
      h += `<g class="stop" tabindex="0" role="button" data-stops="${c.ids.join(',')}" aria-label="${esc(label)}">
        <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${isEnd ? 8 : 7}"${isEnd ? ' stroke-width="3"' : ''}/>
        ${photo ? `<circle cx="${(c.x + 7).toFixed(1)}" cy="${(c.y - 7).toFixed(1)}" r="3.6" class="photo"/>` : ''}
        <text class="lb" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${an}">${esc(label)}</text>
        ${alt ? `<text class="alt" x="${lx.toFixed(1)}" y="${(ly + 13).toFixed(1)}" text-anchor="${an}">${num(alt)} m</text>` : ''}</g>`;
    });
    segLabels.forEach(sl => {
      const w = sl.t.length * 5.4, b = [sl.x - w / 2, sl.y - 10, w, 13];
      if (hit(b)) return;
      placed.push(b);
      h += `<text class="seg-l" x="${sl.x.toFixed(1)}" y="${sl.y.toFixed(1)}" text-anchor="middle">${esc(sl.t)}</text>`;
    });
    h += '</g>';
    // north arrow + scale bar
    h += `<g transform="translate(${W - 26},26)"><path d="M0,-12 L5,4 L0,1 L-5,4Z" fill="currentColor" class="photo"/><text class="north" y="17" text-anchor="middle">N</text></g>`;
    const pxPerKm = k / MAP.kmPerUnit;
    const kmOpt = [5, 10, 20, 50, 100, 200, 300].find(v => v * pxPerKm >= 46) || 300;
    const sw = kmOpt * pxPerKm;
    h += `<g transform="translate(${W - 24 - sw},${H - 22})"><path d="M0,-4 V0 H${sw.toFixed(1)} V-4" class="scale" fill="none"/><text class="gr-l" x="${(sw / 2).toFixed(1)}" y="-8" text-anchor="middle">${kmOpt} km</text></g>`;
    // inset
    const iw = 88, ih = 53, ik = iw / MAP.W;
    h += `<g transform="translate(14,${H - ih - 12})"><rect width="${iw}" height="${ih}" fill="none"/><g transform="scale(${ik})"><path d="${MAP.kzLo}" class="inset-kz" vector-effect="non-scaling-stroke"/></g><rect class="inset-box" x="${(minX * ik).toFixed(1)}" y="${(minY * ik).toFixed(1)}" width="${Math.max(4, (maxX - minX) * ik).toFixed(1)}" height="${Math.max(4, (maxY - minY) * ik).toFixed(1)}" vector-effect="non-scaling-stroke"/></g>`;
    svg.innerHTML = h;
    const totalKm = legs.filter(l => l.mode !== 'hike').reduce((a, l) => a + l.km, 0);
    $('#mapMeta').textContent = `${trip.modules.length} ${T('days')} · ${num(totalKm)} km`;
    if (animate && G && !RM) drawRoutes();
  }
  function drawRoutes() {
    if (!G || RM) return;
    $$('#routeMap .rt').forEach((p, i) => {
      if (p.classList.contains('rt--air')) { G.fromTo(p, { opacity: 0 }, { opacity: 1, duration: .6, delay: .25 + i * .12 }); return; }
      const len = p.getTotalLength();
      G.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.1, delay: i * .12, ease: 'power2.inOut', onComplete: () => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; } });
    });
    G.from('#routeMap .stop', { scale: 0, transformOrigin: 'center', duration: .45, stagger: .06, ease: 'back.out(2)', delay: .2 });
  }
  function highlightMap(di) {
    const trip = tripById(S.trip);
    const stops = new Set(); D.MODULES[trip.modules[di]].legs.forEach(l => { stops.add(l[0]); stops.add(l[1]); });
    $$('#routeMap .stop').forEach(g => g.classList.toggle('is-on', g.dataset.stops.split(',').some(s => stops.has(s))));
    $$('#routeMap .rt').forEach(p => { p.style.stroke = +p.dataset.day === di ? 'var(--sun)' : ''; });
  }

  /* days */
  function renderDays(trip) {
    $('#dayList').innerHTML = trip.modules.map((id, i) => {
      const m = D.MODULES[id];
      const driveMin = m.legs.filter(l => l[2] !== 'hike').reduce((a, l) => a + l[4], 0);
      const driveKm = m.legs.filter(l => l[2] === 'road').reduce((a, l) => a + l[3], 0);
      const air = m.legs.find(l => l[2] === 'air');
      const extras = m.extra.map(k => `<li>${esc(tx(D.EXTRA[k].n))}${D.EXTRA[k].p ? ' ' + esc(xp(D.EXTRA[k].p)) : ''}</li>`).join('');
      return `<div class="day${i === S.day ? ' is-on' : ''}" role="button" tabindex="0" aria-pressed="${i === S.day}" data-day="${i}">
        <span class="day__top"><span class="day__n">${esc(T('day'))} ${i + 1}</span><span class="pill pill--${m.level}">${esc(T(m.level))}</span></span>
        <span class="day__title">${esc(tx(m.title))}</span>
        <span class="day__stats"><span><span class="data">${dur(driveMin)}</span>${esc(T('drive'))}${air ? ' + ' + (S.lang === 'de' ? 'Flug' : 'flight') : ` · ${driveKm} km`}</span><span><span class="data">${num(m.hike.km)} km</span>+${num(m.hike.up)} m</span><span><span class="data">${num(m.maxAlt)} m</span>${esc(T('maxAlt'))}</span></span>
        ${m.gentle ? `<span class="small muted">${esc(T('gentleOpt'))}: ${esc(tx(m.gentle.note))}</span>` : ''}
        <span class="incl"><span class="incl__k">${esc(T('included'))}</span><ul class="yes">${m.inc.map(k => `<li>${esc(tx(D.INC[k]))}</li>`).join('')}</ul></span>
        ${extras ? `<span class="incl"><span class="incl__k">${esc(T('paySep'))}</span><ul class="no">${extras}</ul></span>` : ''}
      </div>`;
    }).join('');
  }
  function selectDay(i, loadPano) {
    S.day = i;
    $$('#dayList .day').forEach(d => { const on = +d.dataset.day === i; d.classList.toggle('is-on', on); d.setAttribute('aria-pressed', String(on)); });
    highlightMap(i);
    highlightElev(i);
    if (loadPano !== false) loadScene(D.MODULES[tripById(S.trip).modules[i]].scene);
  }

  /* elevation profile */
  let elevPts = [], elevGeo = null;
  function renderElev(trip, animate) {
    const svg = $('#elevSvg');
    const W = Math.max(320, Math.min(1200, Math.round(svg.getBoundingClientRect().width) || 1000)), H = W < 600 ? 230 : 220, m = { l: 46, r: 12, t: 26, b: 30 };
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const n = trip.modules.length;
    elevPts = [];
    trip.modules.forEach((id, di) => {
      const pr = D.MODULES[id].profile;
      pr.forEach((p, j) => elevPts.push({ x: di + (pr.length === 1 ? .5 : j / (pr.length - 1)), alt: p[1], name: p[0], day: di }));
    });
    const maxA = Math.max(...elevPts.map(p => p.alt));
    const step = maxA > 1500 ? 1000 : 250;
    const yMax = Math.ceil(maxA * 1.1 / step) * step;
    const X = x => m.l + x / n * (W - m.l - m.r), Y = a => m.t + (1 - a / yMax) * (H - m.t - m.b);
    elevGeo = { X, Y, W, H, m, n };
    let h = '<g class="band-g"></g>';
    for (let v = 0; v <= yMax; v += step) {
      h += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/>`;
      if (v <= maxA) h += `<text class="ax" x="${m.l - 8}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${num(v)}</text>`;
    }
    for (let d = 1; d < n; d++) h += `<line class="dayline" x1="${X(d)}" x2="${X(d)}" y1="${m.t}" y2="${H - m.b}"/>`;
    for (let d = 0; d < n; d++) h += `<text class="daylb" x="${X(d + .5)}" y="${H - 9}" text-anchor="middle">${W < 600 ? (S.lang === 'de' ? 'T' : 'D') : esc(T('day')) + ' '}${d + 1}</text>`;
    const line = elevPts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.alt).toFixed(1)}`).join('');
    h += `<path class="area" d="${line}L${X(elevPts[elevPts.length - 1].x).toFixed(1)},${Y(0)}L${X(elevPts[0].x).toFixed(1)},${Y(0)}Z"/>`;
    h += `<path class="ln" id="elevLine" d="${line}"/>`;
    const pk = elevPts.reduce((a, p) => p.alt > a.alt ? p : a, elevPts[0]);
    const anchor = X(pk.x) > W * .8 ? 'end' : 'middle';
    h += `<circle class="peak" cx="${X(pk.x).toFixed(1)}" cy="${Y(pk.alt).toFixed(1)}" r="5"/><text class="peaklb" x="${X(pk.x).toFixed(1)}" y="${(Y(pk.alt) - 11).toFixed(1)}" text-anchor="${anchor}">${num(pk.alt)} m · ${esc(tx(pk.name))}</text>`;
    h += `<line class="cross" id="eCross" y1="${m.t}" y2="${H - m.b}" opacity="0"/><circle class="cdot" id="eDot" r="5" opacity="0"/>`;
    h += `<rect id="eHit" x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent"/>`;
    svg.innerHTML = h;
    highlightElev(S.day);
    if (animate && G && !RM) {
      const p = $('#elevLine'), len = p.getTotalLength();
      G.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', onComplete: () => { p.style.strokeDasharray = ''; } });
      G.from('#elevSvg .area', { opacity: 0, duration: .8, delay: .5 });
    }
  }
  function highlightElev(di) {
    if (!elevGeo) return;
    const { X, m, H } = elevGeo;
    const g = $('#elevSvg .band-g'); if (!g) return;
    g.innerHTML = `<rect x="${X(di)}" y="${m.t}" width="${X(di + 1) - X(di)}" height="${H - m.t - m.b}" fill="var(--sky-soft)" opacity=".7"/>`;
  }
  function initElevHover() {
    const svg = $('#elevSvg'), tip = $('#elevTip'), wrap = $('#elev');
    const hide = () => { tip.style.opacity = 0; const c = $('#eCross'), d = $('#eDot'); if (c) c.setAttribute('opacity', 0); if (d) d.setAttribute('opacity', 0); };
    svg.addEventListener('pointermove', e => {
      if (!elevGeo || !elevPts.length) return;
      const r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * elevGeo.W;
      const { X, Y, n } = elevGeo;
      const xv = Math.max(0, Math.min(n, (sx - elevGeo.m.l) / (elevGeo.W - elevGeo.m.l - elevGeo.m.r) * n));
      let i = elevPts.findIndex(p => p.x >= xv); if (i === -1) i = elevPts.length - 1; else if (i === 0) i = 1;
      const a = elevPts[i - 1], b = elevPts[Math.min(i, elevPts.length - 1)];
      const t = b.x === a.x ? 0 : (xv - a.x) / (b.x - a.x);
      const alt = Math.round(a.alt + (b.alt - a.alt) * Math.max(0, Math.min(1, t)));
      const near = t < .5 ? a : b;
      const px = X(xv), py = Y(alt);
      $('#eCross').setAttribute('x1', px); $('#eCross').setAttribute('x2', px); $('#eCross').setAttribute('opacity', .35);
      $('#eDot').setAttribute('cx', px); $('#eDot').setAttribute('cy', py); $('#eDot').setAttribute('opacity', 1);
      const wr = wrap.getBoundingClientRect();
      tip.innerHTML = `<b>${num(alt)} m</b><br>${esc(T('day'))} ${Math.min(n, Math.floor(xv) + 1)} · ${esc(tx(near.name))}`;
      tip.style.left = (r.left - wr.left + px / elevGeo.W * r.width) + 'px';
      tip.style.top = (r.top - wr.top + py / elevGeo.H * r.height) + 'px';
      tip.style.opacity = 1;
    });
    svg.addEventListener('pointerleave', hide);
  }

  /* price card */
  let priceObj = { v: 0 };
  function renderPriceCard(trip, animate) {
    const base = baseOf(trip.modules);
    const el = $('#pcPrice');
    if (animate && G && !RM) G.to(priceObj, { v: base, duration: .7, ease: 'power3.out', onUpdate: () => { el.textContent = eur(Math.round(priceObj.v)); } });
    else { priceObj.v = base; el.textContent = eur(base); }
    const lv = levelOf(trip.modules, false);
    $('#pcLevel').textContent = T(lv);
    const deps = departures(trip);
    $('#pcDep').innerHTML = deps.map((d, i) => `<option value="${i}">${esc(fdate(d.date))} · ${esc(T('seats', { n: d.seats }))}</option>`).join('') + `<option value="private">${esc(T('privateDate'))}</option>`;
  }

  function renderPreview(animate) {
    const trip = tripById(S.trip);
    renderStrip(trip); syncSceneUI();
    renderMap(trip, animate);
    renderDays(trip);
    renderElev(trip, animate);
    renderPriceCard(trip, animate);
    highlightMap(S.day);
  }
  function selectTrip(id, animate) {
    S.trip = id; S.day = 0;
    $$('#tripTabs [data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === id)));
    renderPreview(animate !== false);
    loadScene(D.MODULES[tripById(id).modules[0]].scene);
    if (animate !== false && G && !RM) G.from('#dayList .day', { y: 18, opacity: 0, duration: .45, stagger: .05, ease: 'power3.out', clearProps: 'transform,opacity' });
  }
  function initPreview() {
    renderTabs();
    S.scene = D.MODULES[tripById(S.trip).modules[0]].scene;
    renderPreview(false);
    initPanoUI();
    initPano();
    initElevHover();
    let rz = 0, lastW = window.innerWidth;
    window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (Math.abs(window.innerWidth - lastW) < 2) return; lastW = window.innerWidth; const t = tripById(S.trip); renderMap(t, false); renderElev(t, false); highlightMap(S.day); }, 200); });
    $('#tripTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b && b.dataset.tab !== S.trip) selectTrip(b.dataset.tab, true); });
    $('#dayList').addEventListener('click', e => { const b = e.target.closest('[data-day]'); if (b) selectDay(+b.dataset.day); });
    $('#dayList').addEventListener('keydown', e => { const b = e.target.closest('[data-day]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectDay(+b.dataset.day); } });
    const mapPick = e => {
      const g = e.target.closest('.stop'); if (!g) return;
      const stops = g.dataset.stops.split(','), trip = tripById(S.trip);
      const di = trip.modules.findIndex(id => D.MODULES[id].legs.some(l => stops.includes(l[1])));
      selectDay(di >= 0 ? di : 0);
    };
    $('#routeMap').addEventListener('click', mapPick);
    $('#routeMap').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mapPick(e); } });
    $('#pcBook').addEventListener('click', () => { const v = $('#pcDep').value; openDrawer({ trip: S.trip, dep: v === 'private' ? 'private' : +v }); });
    const hint = document.createElement('div');
    hint.className = 'pano__hint'; hint.id = 'panoHint';
    hint.innerHTML = `${icon('i-drag')}<span>${S.lang === 'de' ? 'Ziehen zum Umsehen' : 'Drag to look around'}</span>`;
    $('#panoWrap').appendChild(hint);
    const kill = () => { if (G && !RM) G.to(hint, { opacity: 0, y: 8, duration: .3, onComplete: () => hint.remove() }); else hint.remove(); $('#panoWrap').removeEventListener('pointerdown', kill); };
    $('#panoWrap').addEventListener('pointerdown', kill);
    if (ST && G && !RM) {
      ST.create({ trigger: '#routeMap', start: 'top 85%', once: true, onEnter: drawRoutes });
      ST.create({ trigger: '#elev', start: 'top 88%', once: true, onEnter: () => { const p = $('#elevLine'); if (!p) return; const len = p.getTotalLength(); G.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', onComplete: () => { p.style.strokeDasharray = ''; } }); } });
    }
  }

  /* ================= TRIPS ================= */
  function renderTrips() {
    $('#tripGrid').innerHTML = D.TRIPS.map(t => {
      const base = baseOf(t.modules);
      const route = routeLine(t.modules).map(s => tx(D.STOPS[s].name)).join(' → ');
      const inc = ['guide', 'transport', 'parkfee'].map(k => tx(D.INC[k]));
      inc.push(`${nightsOf(t.modules)} ${T(nightsOf(t.modules) === 1 ? 'night' : 'nights')}, ${S.lang === 'de' ? 'Doppelzimmer' : 'twin rooms'}`);
      const lv = levelOf(t.modules, false);
      return `<article class="trip">
        <div class="trip__img"><img src="${t.img}" alt="${esc(tx(t.alt))}" loading="lazy"><span class="trip__days">${t.modules.length} ${esc(T('days'))} · ${esc(T(lv))}</span></div>
        <div class="trip__body"><h3>${esc(tx(t.name))}</h3><p class="trip__route">${esc(route)}</p>
          <ul class="trip__inc">${inc.map(x => `<li>${icon('i-check')}<span>${esc(x)}</span></li>`).join('')}</ul></div>
        <div class="trip__foot"><div class="trip__price"><small>${esc(T('from'))}</small><span class="data">${eur(base)}</span><small>${esc(T('perPerson'))}</small></div>
          <div class="trip__btns"><button class="btn btn--sm btn--ghost" type="button" data-tprev="${t.id}">${esc(T('preview'))}</button><button class="btn btn--sm btn--sun" type="button" data-tbook="${t.id}">${esc(T('book'))}</button></div></div>
      </article>`;
    }).join('');
  }
  function initTrips() {
    renderTrips();
    $('#tripGrid').addEventListener('click', e => {
      const p = e.target.closest('[data-tprev]'), b = e.target.closest('[data-tbook]');
      if (p) { selectTrip(p.dataset.tprev, true); document.getElementById('preview').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); }
      if (b) openDrawer({ trip: b.dataset.tbook });
    });
  }

  /* ================= ARRIVAL CONCIERGE ================= */
  const passObj = () => D.PASSPORTS.find(p => p.id === S.pass);
  function wSummary() {
    const p = passObj(), trip = tripById(S.wTrip), x = D.TRANSFERS.find(t => t.id === S.xfer);
    $('#wsum0').textContent = p ? tx(p.n) : '—';
    $('#wsum1').textContent = p ? (p.free ? T('visaFree') : (S.lang === 'de' ? 'Liste prüfen' : 'Check list')) : '—';
    $('#wsum2').textContent = S.w >= 2 || S.xferAdded ? `${S.home} → ${trip.airIn}` : '—';
    $('#wsum3').textContent = S.xferAdded ? `${tx(x.n).split(',')[0]} · ${x.p ? eur(x.p) : '—'}` : '—';
    $$('#wsteps button').forEach(b => {
      const i = +b.dataset.w;
      b.toggleAttribute('aria-current', false);
      if (i === S.w) b.setAttribute('aria-current', 'step');
      b.classList.toggle('is-done', i < S.w || (i === 3 && S.xferAdded));
      b.disabled = i > 0 && !S.pass;
    });
    const img = $('#arrImg');
    const want = S.w >= 2 ? (trip.airIn === 'NQZ' ? 'img/baiterek.jpg' : trip.airIn === 'HSA' ? 'img/turkistan.jpg' : 'img/almaty.jpg') : 'img/baiterek.jpg';
    if (!img.src.endsWith(want)) img.src = want;
    $('#arrSum').innerHTML = `<span>${esc(T('tripFor'))}: <b>${esc(tx(trip.name))}</b></span><span>${esc(T('sumFly'))}: <b>${S.home} → ${trip.airIn}${trip.airOut !== trip.airIn ? ' · ' + trip.airOut + ' → ' + S.home : ''}</b></span>`;
  }
  function flightOptions(trip) {
    const dest = trip.airIn, home = S.home, out = [];
    const gf = (a, b) => 'https://www.google.com/travel/flights?q=' + encodeURIComponent(`Flights from ${a} to ${b}`);
    if (dest === 'HSA') {
      out.push({ route: [home, home === 'FRA' ? 'ALA' : 'FRA', 'HSA'], kind: 'oneStop', text: T('fDomestic'), link: gf(home, 'HSA') });
      out.push({ route: [home, 'IST', 'ALA', 'HSA'], kind: 'oneStop', text: T('fIst'), link: gf(home, 'ALA') });
      return out;
    }
    if (home === 'FRA') out.push({ route: ['FRA', dest], kind: 'nonstop', text: T('fNonstop'), link: gf('FRA', dest) });
    else if (['MUC', 'BER', 'DUS', 'HAM', 'STR'].includes(home)) out.push({ route: [home, 'FRA', dest], kind: 'oneStop', text: T('fFra'), link: gf(home, dest) });
    out.push({ route: [home, 'IST', dest], kind: 'oneStop', text: T('fIst'), link: gf(home, dest) });
    return out;
  }
  function renderWizard(anim) {
    const P = $('#wpanel');
    const nav = (back, next, nextLabel, nextDisabled) => `<div class="wnav">${back ? `<button class="btn btn--ghost" type="button" data-wgo="${S.w - 1}">${esc(T('back'))}</button>` : '<span></span>'}${next ? `<button class="btn btn--sun" type="button" data-wgo="${S.w + 1}"${nextDisabled ? ' disabled' : ''}>${esc(nextLabel || T('next'))}</button>` : ''}</div>`;
    let h = '';
    if (S.w === 0) {
      const top = ['DE', 'AT', 'CH'].map(id => { const p = D.PASSPORTS.find(x => x.id === id); return `<button class="ppick" type="button" data-pass="${id}" aria-pressed="${S.pass === id}"><span class="data">${id}</span><span>${esc(tx(p.n))}</span></button>`; }).join('');
      const others = D.PASSPORTS.filter(p => !['DE', 'AT', 'CH'].includes(p.id));
      h = `<h3>${esc(T('w1h'))}</h3><p class="muted">${esc(T('w1p'))}</p><div class="ppicks">${top}</div>
        <div class="field" style="max-width:360px"><label for="passOther">${esc(T('other'))}</label><select id="passOther"><option value="">${esc(T('choose'))}</option>${others.map(p => `<option value="${p.id}"${S.pass === p.id ? ' selected' : ''}>${esc(tx(p.n))}</option>`).join('')}</select></div>
        ${nav(false, true, null, !S.pass)}`;
    } else if (S.w === 1) {
      const p = passObj();
      const srcs = D.OFFICIAL.slice(); if (p.fo) srcs.unshift(p.fo);
      h = `<h3>${esc(T('w2h', { c: tx(p.n) }))}</h3>
        <div class="entry${p.free ? '' : ' entry--check'}"><p class="entry__status">${icon(p.free ? 'i-check' : 'i-info')}<span>${esc(p.free ? T('visaFree') : T('checkList'))}</span></p>
          <ul>${(p.free ? ['rule1', 'rule2', 'rule3'] : ['ruleX', 'rule1', 'rule2']).map(k => `<li>${esc(T(k))}</li>`).join('')}</ul></div>
        <p class="note">${icon('i-info')}<span>${esc(T('lastChecked'))}</span></p>
        <p class="sublabel" style="margin:0">${esc(T('officialH'))}</p>
        <div class="sources">${srcs.map(s => `<a href="${s.u}" target="_blank" rel="noopener"><b>${esc(tx(s.n))}</b><span>${esc(s.u.replace(/^https:\/\//, ''))}</span>${icon('i-ext')}</a>`).join('')}</div>
        ${nav(true, true)}`;
    } else if (S.w === 2) {
      const trip = tripById(S.wTrip);
      const opts = flightOptions(trip);
      h = `<h3>${esc(T('w3h', { city: tx(D.KZ_AIRPORTS[trip.airIn]) }))}</h3><p class="muted">${esc(T('w3p', { trip: tx(trip.name) }))}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:.8rem">
          <div class="field"><label for="wTrip">${esc(T('tripFor'))}</label><select id="wTrip">${D.TRIPS.map(t => `<option value="${t.id}"${t.id === S.wTrip ? ' selected' : ''}>${esc(tx(t.name))}</option>`).join('')}</select></div>
          <div class="field"><label for="wHome">${esc(T('fromAirport'))}</label><select id="wHome">${D.HOME_AIRPORTS.map(([c, n]) => `<option value="${c}"${c === S.home ? ' selected' : ''}>${esc(tx(n))} (${c})</option>`).join('')}</select></div>
        </div>
        <div class="flights">${opts.map(o => `<div class="flight"><div class="flight__route">${o.route.map(esc).join(`<svg aria-hidden="true"><use href="#i-flight-line"/></svg>`)}</div><span class="pill ${o.kind === 'nonstop' ? 'pill--easy' : 'pill--sky'}">${esc(T(o.kind))}</span><p>${esc(o.text)}</p><a class="btn btn--sm btn--ghost" href="${o.link}" target="_blank" rel="noopener">${esc(T('search'))}${icon('i-ext')}</a></div>`).join('')}</div>
        ${trip.airOut !== trip.airIn ? `<p class="note">${icon('i-info')}<span>${esc(T('fOpenJaw'))}</span></p>` : ''}
        ${nav(true, true)}`;
    } else {
      const x = D.TRANSFERS.find(t => t.id === S.xfer);
      const name = S.signName || (S.lang === 'de' ? 'Familie Weber' : 'Katrin Müller');
      h = `<h3>${esc(T('w4h'))}</h3><p class="muted">${esc(T('w4p'))}</p>
        <div class="xfer">${D.TRANSFERS.map(t => `<button class="ppick" type="button" data-xfer="${t.id}" aria-pressed="${t.id === S.xfer}"><span class="data">${t.p ? eur(t.p) : '€0'}</span><span>${esc(tx(t.n))}</span></button>`).join('')}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:.8rem;align-items:end">
          <div class="field"><label for="wSign">${esc(T('signName'))}</label><input id="wSign" type="text" maxlength="40" value="${esc(S.signName)}" placeholder="${esc(name)}"></div>
          <div class="field"><label for="wTime">${esc(T('arrTime'))}</label><input id="wTime" type="time" value="${esc(S.arrTime)}"></div>
        </div>
        ${S.xfer !== 'none' ? `<div class="sign" id="signPreview" aria-hidden="true"><small>SARYARQA ROUTES · ${esc(T('signHello'))}</small><b id="signName">${esc(name)}</b><small>${esc(tx(D.KZ_AIRPORTS[tripById(S.wTrip).airIn]))} ${tripById(S.wTrip).airIn}${S.arrTime ? ' · ' + esc(S.arrTime) : ''}</small></div>` : ''}
        <div style="display:flex;gap:.6rem;flex-wrap:wrap">
          <button class="btn btn--sun" type="button" id="wAdd"${S.xfer === 'none' ? ' disabled' : ''}>${S.xferAdded ? icon('i-check') + esc(T('added')) : esc(T('addTransfer')) + (x.p ? ' · ' + eur(x.p) : '')}</button>
          <button class="btn btn--ghost" type="button" id="wCopy">${esc(T('copyList'))}</button>
        </div>
        ${nav(true, false)}`;
    }
    P.innerHTML = h;
    wSummary();
    if (anim && G && !RM) G.from(P.children, { x: 18, opacity: 0, duration: .4, stagger: .04, ease: 'power3.out', clearProps: 'transform,opacity' });
  }
  function checklist() {
    const p = passObj(), trip = tripById(S.wTrip), x = D.TRANSFERS.find(t => t.id === S.xfer);
    const lines = [
      (S.lang === 'de' ? 'Ankunfts-Checkliste: ' : 'Arrival checklist: ') + tx(trip.name),
      `${T('sumPass')}: ${p ? tx(p.n) : '—'} · ${p ? (p.free ? T('visaFree') : T('checkList')) : ''}`,
      `${T('sumFly')}: ${S.home} → ${trip.airIn}${trip.airOut !== trip.airIn ? ', ' + trip.airOut + ' → ' + S.home : ''}`,
      `${T('sumXfer')}: ${S.xferAdded ? tx(x.n) + ' ' + eur(x.p) : '—'}${S.arrTime ? ', ' + S.arrTime : ''}`,
      ...D.OFFICIAL.map(s => tx(s.n) + ': ' + s.u)
    ];
    return lines.join('\n');
  }
  function initWizard() {
    renderWizard(false);
    $('#wsteps').addEventListener('click', e => { const b = e.target.closest('[data-w]'); if (!b || b.disabled) return; S.w = +b.dataset.w; renderWizard(true); });
    const P = $('#wpanel');
    P.addEventListener('click', e => {
      const pass = e.target.closest('[data-pass]'); if (pass) { S.pass = pass.dataset.pass; renderWizard(false); return; }
      const go = e.target.closest('[data-wgo]'); if (go && !go.disabled) { S.w = Math.max(0, Math.min(3, +go.dataset.wgo)); renderWizard(true); return; }
      const xf = e.target.closest('[data-xfer]'); if (xf) { S.xfer = xf.dataset.xfer; if (S.xferAdded && S.xfer === 'none') { S.xferAdded = false; S.cart.xferOn = false; } renderWizard(false); return; }
      if (e.target.closest('#wAdd')) {
        S.xferAdded = true; S.cart.xferOn = true; S.cart.xfer = S.xfer;
        const x = D.TRANSFERS.find(t => t.id === S.xfer);
        toast(T('toastTransfer', { p: eur(x.p) }));
        renderWizard(false);
        if (G && !RM) G.fromTo('#wAdd', { scale: .94 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
        return;
      }
      if (e.target.closest('#wCopy')) {
        const text = checklist();
        const done = () => toast(T('toastCopied'));
        try { navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done)); } catch (err) { fallbackCopy(text, done); }
      }
    });
    P.addEventListener('change', e => {
      if (e.target.id === 'passOther') { S.pass = e.target.value || null; renderWizard(false); }
      if (e.target.id === 'wTrip') { S.wTrip = e.target.value; renderWizard(false); }
      if (e.target.id === 'wHome') { S.home = e.target.value; renderWizard(false); }
      if (e.target.id === 'wTime') { S.arrTime = e.target.value; renderWizard(false); }
    });
    P.addEventListener('input', e => {
      if (e.target.id === 'wSign') { S.signName = e.target.value; const s = $('#signName'); if (s) s.textContent = S.signName || e.target.placeholder; }
    });
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* user can copy manually */ }
    ta.remove();
  }

  /* ================= BOOKING DRAWER ================= */
  const DR = { step: 0, ref: '' };
  const cartIds = () => S.cart.trip === 'plan' && S.cart.plan ? S.cart.plan.ids : tripById(S.cart.trip).modules;
  const cartName = () => S.cart.trip === 'plan' && S.cart.plan ? tx(S.cart.plan.title) : tx(tripById(S.cart.trip).name);
  function calc() {
    const ids = cartIds(), n = S.cart.n;
    const pp = perPerson(baseOf(ids), n);
    const tripTotal = pp * n;
    const nights = nightsOf(ids);
    const single = S.cart.single ? D.PRICING.singleRoom * nights * n : 0;
    const x = S.cart.xferOn ? D.TRANSFERS.find(t => t.id === S.cart.xfer).p : 0;
    const total = tripTotal + single + x;
    return { pp, tripTotal, nights, single, x, total, deposit: Math.round(total * D.PRICING.deposit * 100) / 100 };
  }
  function depDate() {
    if (S.cart.trip === 'plan' || S.cart.dep === 'private') return S.cart.priv ? new Date(S.cart.priv + 'T00:00:00Z') : null;
    const d = departures(tripById(S.cart.trip))[S.cart.dep]; return d ? d.date : null;
  }
  function openDrawer(o) {
    o = o || {};
    if (o.plan) { S.cart.plan = o.plan; S.cart.trip = 'plan'; S.cart.dep = 'private'; }
    else if (o.trip) { S.cart.trip = o.trip; }
    else if (S.cart.trip !== 'plan') S.cart.trip = S.trip;
    if (o.n) S.cart.n = o.n;
    if (o.guide) S.cart.guide = o.guide;
    if (S.cart.trip !== 'plan') {
      const deps = departures(tripById(S.cart.trip));
      if (o.dep != null) S.cart.dep = o.dep;
      else if (o.month) { const i = deps.findIndex(d => d.month === o.month); S.cart.dep = i >= 0 ? i : 0; }
      else if (typeof S.cart.dep !== 'number' || !deps[S.cart.dep]) S.cart.dep = 0;
    }
    DR.step = 0; S.cart.consent = false;
    renderDrawer();
    const dlg = $('#drawer');
    if (!dlg.open) dlg.showModal();
  }
  function renderDrawer(anim) {
    const body = $('#drBody'), c = calc(), de = S.lang === 'de';
    $$('.dsteps span').forEach((s, i) => s.classList.toggle('is-on', i <= Math.min(2, DR.step)));
    $('#dstepsL').innerHTML = ['dS1', 'dS2', 'dS3'].map((k, i) => i === Math.min(2, DR.step) ? `<b>${esc(T(k))}</b>` : `<span>${esc(T(k))}</span>`).join('');
    let h = '';
    if (DR.step === 0) {
      const opts = (S.cart.plan ? `<option value="plan"${S.cart.trip === 'plan' ? ' selected' : ''}>${esc(tx(S.cart.plan.title))} (Trip Builder)</option>` : '') + D.TRIPS.map(t => `<option value="${t.id}"${t.id === S.cart.trip ? ' selected' : ''}>${esc(tx(t.name))} · ${t.modules.length} ${esc(T('days'))}</option>`).join('');
      let dates = '';
      if (S.cart.trip !== 'plan') {
        dates = departures(tripById(S.cart.trip)).map((d, i) => `<button class="dep" type="button" data-dep="${i}" aria-pressed="${S.cart.dep === i}"><span class="data">${esc(fdate(d.date, null, { weekday: 'short' }))}</span><small>${esc(tx(tripById(S.cart.trip).name))}</small><em class="${d.seats <= 2 ? 'low' : ''}">${esc(T('seats', { n: d.seats }))}</em></button>`).join('');
        dates += `<button class="dep" type="button" data-dep="private" aria-pressed="${S.cart.dep === 'private'}"><span class="data">${esc(T('privateDate'))}</span><small>${de ? 'Wähle unten ein Datum' : 'Pick a start date below'}</small></button>`;
      }
      const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
      h = `<div class="field"><label for="drTrip">${esc(T('trip'))}</label><select id="drTrip">${opts}</select></div>
        <div class="field"><span style="font-size:.85rem;font-weight:600">${esc(T('date'))}</span>${S.cart.trip !== 'plan' ? `<div class="deps">${dates}</div>` : ''}
        ${S.cart.trip === 'plan' || S.cart.dep === 'private' ? `<label for="drPriv" class="sr-only">${esc(T('date'))}</label><input id="drPriv" type="date" min="${tomorrow}" value="${esc(S.cart.priv)}">` : ''}</div>`;
    } else if (DR.step === 1) {
      const tripG = S.cart.trip === 'plan' ? [...new Set(S.cart.plan.ids.map(id => D.MODULES[id].region))].flatMap(r => D.GUIDES.filter(g => g.region === r)) : D.GUIDES.filter(g => tripById(S.cart.trip).guides.includes(g.id));
      h = `<div style="display:flex;justify-content:space-between;align-items:center;gap:1rem"><span style="font-weight:600">${esc(T('travellers'))}</span><div class="counter"><button type="button" data-cnt="-1" aria-label="−">−</button><output id="drN">${S.cart.n}</output><button type="button" data-cnt="1" aria-label="+">+</button></div></div>
        <p class="note">${icon('i-info')}<span>${esc(T('groupNote'))}</span></p>
        <p class="sublabel" style="margin:0">${esc(T('extras'))}</p>
        <label class="opt"><input type="checkbox" id="drSingle"${S.cart.single ? ' checked' : ''}><span><b>${esc(T('single'))}</b><small>${esc(T('singleD'))} · ${c.nights} ${esc(T(c.nights === 1 ? 'night' : 'nights'))}</small></span><span class="data">${eur(D.PRICING.singleRoom * c.nights * S.cart.n)}</span></label>
        <label class="opt"><input type="checkbox" id="drXfer"${S.cart.xferOn ? ' checked' : ''}><span><b>${esc(T('transferX'))}</b><small>${esc(T('transferD'))}</small>
          <select id="drXferType" style="margin-top:.4rem;min-height:36px;border-radius:8px;border:1px solid var(--line-strong);background:var(--paper);padding:.2rem .4rem">${D.TRANSFERS.filter(t => t.p).map(t => `<option value="${t.id}"${t.id === S.cart.xfer ? ' selected' : ''}>${esc(tx(t.n))}</option>`).join('')}</select></span><span class="data">${eur((D.TRANSFERS.find(t => t.id === S.cart.xfer && t.p) || D.TRANSFERS[0]).p)}</span></label>
        <div class="field"><label for="drGuide">${esc(T('guideReq'))}</label><select id="drGuide"><option value="">${esc(T('anyGuide'))}</option>${tripG.map(g => `<option value="${g.id}"${g.id === S.cart.guide ? ' selected' : ''}>${esc(g.name)} · ${g.langs.filter(l => ['de', 'en'].includes(l[0])).map(l => l[0].toUpperCase() + ' ' + l[1]).join(', ')}</option>`).join('')}</select></div>`;
    } else if (DR.step === 2) {
      const d = depDate();
      const bal = d ? new Date(d.getTime() - D.PRICING.balanceDays * 864e5) : null;
      h = `<div class="lines">
          <div><span>${esc(cartName())}</span><span class="small muted">${d ? esc(fdate(d)) : esc(T('privateDate'))}</span></div>
          <div><span>${esc(T('lineTrip', { trip: eur(c.pp), n: S.cart.n }))}</span><span class="data">${eur(c.tripTotal)}</span></div>
          ${c.single ? `<div><span>${esc(T('lineSingle'))}</span><span class="data">${eur(c.single)}</span></div>` : ''}
          ${c.x ? `<div><span>${esc(T('lineXfer'))}</span><span class="data">${eur(c.x)}</span></div>` : ''}
          <div class="sep"><span>${esc(T('total'))}</span><span class="data">${eur(c.total)}</span></div>
          <div><span>${esc(T('depositNow'))}</span><span class="data">${eur(c.deposit, null, c.deposit % 1 !== 0)}</span></div>
          <div class="muted"><span>${esc(T('balance', { d: bal ? fdate(bal) : (de ? '30 Tage vorher' : '30 days before') }))}</span><span class="data">${eur(Math.round((c.total - c.deposit) * 100) / 100, null, (c.total - c.deposit) % 1 !== 0)}</span></div>
        </div>
        <p class="sublabel" style="margin:0">${esc(T('payWith'))}</p>
        <div class="methods"><label><input type="radio" name="drPay" value="card"${S.cart.pay === 'card' ? ' checked' : ''}>${icon('i-card')}${esc(T('card'))}</label><label><input type="radio" name="drPay" value="wallet"${S.cart.pay === 'wallet' ? ' checked' : ''}>${esc(T('wallet'))}</label></div>
        <div class="cards"><span class="cardmark cardmark--visa" style="border:1px solid var(--line)">VISA</span><span class="cardmark cardmark--mc" style="border:1px solid var(--line)"><i></i><i></i><span>Mastercard</span></span></div>
        <div class="secure">${icon('i-lock')}<span>${esc(T('secure'))}</span></div>
        <label class="opt" style="grid-template-columns:24px 1fr"><input type="checkbox" id="drConsent"${S.cart.consent ? ' checked' : ''}><span class="small">${esc(T('consent'))}</span></label>
        <p class="small" id="drErr" style="color:var(--rust);min-height:1.2em" aria-live="assertive"></p>`;
    } else {
      h = `<div class="done"><span class="done__ok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <h3 style="font-size:1.6rem">${esc(T('doneH'))}</h3><span class="ref">${DR.ref}</span>
        <p>${esc(cartName())} · ${S.cart.n} ${de ? 'Reisende' : (S.cart.n === 1 ? 'traveller' : 'travellers')} · ${eur(c.total)}</p>
        <p class="muted">${esc(T('doneP'))}</p><p>${esc(T('doneNext'))}</p></div>`;
    }
    body.innerHTML = h;
    $('#drTotal').textContent = eur(c.total);
    $('#drDeposit').textContent = eur(c.deposit, null, c.deposit % 1 !== 0);
    const back = $('#drBack'), next = $('#drNext');
    back.hidden = DR.step === 0 || DR.step === 3;
    next.textContent = DR.step === 2 ? T('toPay') : DR.step === 3 ? T('close') : T('next');
    $('.drawer__total').hidden = DR.step === 3;
    if (anim && G && !RM) G.from(body.children, { y: 14, opacity: 0, duration: .35, stagger: .03, ease: 'power3.out', clearProps: 'transform,opacity' });
  }
  function initDrawer() {
    const dlg = $('#drawer');
    $$('[data-book]').forEach(b => b.addEventListener('click', () => openDrawer({})));
    $('#drClose').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    $('#drBack').addEventListener('click', () => { DR.step = Math.max(0, DR.step - 1); renderDrawer(true); });
    $('#drNext').addEventListener('click', () => {
      if (DR.step === 0 && (S.cart.trip === 'plan' || S.cart.dep === 'private') && !S.cart.priv) {
        const i = $('#drPriv'); if (i) { i.focus(); if (G && !RM) G.fromTo(i, { x: -8 }, { x: 0, duration: .4, ease: 'elastic.out(1,0.3)' }); } return;
      }
      if (DR.step === 2) {
        if (!S.cart.consent) { $('#drErr').textContent = T('payConsent'); if (G && !RM) G.fromTo('#drConsent', { x: -8 }, { x: 0, duration: .45, ease: 'elastic.out(1,0.3)' }); return; }
        DR.ref = 'SC-27-' + String(Math.floor(1000 + Math.random() * 9000));
      }
      if (DR.step === 3) { dlg.close(); return; }
      DR.step++; renderDrawer(true);
    });
    const body = $('#drBody');
    body.addEventListener('click', e => {
      const d = e.target.closest('[data-dep]'); if (d) { S.cart.dep = d.dataset.dep === 'private' ? 'private' : +d.dataset.dep; renderDrawer(false); return; }
      const cnt = e.target.closest('[data-cnt]'); if (cnt) { S.cart.n = Math.max(1, Math.min(6, S.cart.n + +cnt.dataset.cnt)); renderDrawer(false); if (G && !RM) G.fromTo('#drTotal', { y: -6, opacity: .4 }, { y: 0, opacity: 1, duration: .3 }); }
    });
    body.addEventListener('change', e => {
      const id = e.target.id;
      if (id === 'drTrip') { S.cart.trip = e.target.value; S.cart.dep = e.target.value === 'plan' ? 'private' : 0; S.cart.guide = ''; renderDrawer(false); }
      if (id === 'drPriv') { S.cart.priv = e.target.value; }
      if (id === 'drSingle') { S.cart.single = e.target.checked; renderDrawer(false); }
      if (id === 'drXfer') { S.cart.xferOn = e.target.checked; if (S.cart.xfer === 'none') S.cart.xfer = 'sedan'; renderDrawer(false); }
      if (id === 'drXferType') { S.cart.xfer = e.target.value; renderDrawer(false); }
      if (id === 'drGuide') { S.cart.guide = e.target.value; }
      if (id === 'drConsent') { S.cart.consent = e.target.checked; if (S.cart.consent) $('#drErr').textContent = ''; }
      if (e.target.name === 'drPay') { S.cart.pay = e.target.value; }
    });
  }

  /* ================= CLOCK ================= */
  const pad = n => String(n).padStart(2, '0');
  function updateClock() {
    const now = new Date();
    let berlin;
    try { berlin = new Intl.DateTimeFormat(loc(), { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Berlin' }).format(now); } catch (e) { berlin = pad(now.getHours()) + ':' + pad(now.getMinutes()); }
    const ast = new Date(now.getTime() + 5 * 36e5);
    const ah = ast.getUTCHours(), wd = ast.getUTCDay();
    $('#tBerlin').textContent = berlin;
    $('#tAstana').textContent = pad(ah) + ':' + pad(ast.getUTCMinutes());
    const open = wd >= 1 && wd <= 5 && ah >= 9 && ah < 18;
    $('#officeDot').classList.toggle('is-open', open);
    if (open) { $('#officeNote').textContent = T('officeOpen'); return; }
    const nxt = new Date(Date.UTC(ast.getUTCFullYear(), ast.getUTCMonth(), ast.getUTCDate(), 9, 0));
    if (ah >= 9) nxt.setUTCDate(nxt.getUTCDate() + 1);
    while (nxt.getUTCDay() === 0 || nxt.getUTCDay() === 6) nxt.setUTCDate(nxt.getUTCDate() + 1);
    const mins = Math.max(0, Math.round((nxt - ast) / 6e4));
    const real = new Date(nxt.getTime() - 5 * 36e5);
    let t; try { t = new Intl.DateTimeFormat(loc(), { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Berlin', weekday: mins > 24 * 60 ? 'short' : undefined }).format(real); } catch (e) { t = ''; }
    $('#officeNote').textContent = T('officeClosed', { h: Math.floor(mins / 60), m: mins % 60, t });
  }

  /* ================= MVP ================= */
  function renderMVP() {
    $('#weeks').innerHTML = D.MVP.weeks.map(w => `<div class="wk"><span class="data">${esc(T('weeksL', { a: w.w[0], b: w.w[1] }))}</span><div><b>${esc(tx(w.t))}</b><p>${esc(tx(w.d))}</p><div class="wkbar" aria-hidden="true"><i style="left:${((w.w[0] - 1) / 12 * 100).toFixed(2)}%;width:${((w.w[1] - w.w[0] + 1) / 12 * 100).toFixed(2)}%"></i></div></div></div>`).join('');
    const max = Math.max(...D.MVP.budget.map(b => b.v)), tot = D.MVP.budget.reduce((a, b) => a + b.v, 0);
    $('#budget').innerHTML = D.MVP.budget.map(b => `<div class="bud" tabindex="0" data-tip="${esc(T('budgetTip', { v: num(b.v), p: Math.round(b.v / tot * 100) }))}"><b>${esc(tx(b.k))}</b><span class="data">${num(b.v)} ₸</span><span class="bud__bar"><i style="width:${(b.v / max * 100).toFixed(1)}%"></i></span>${b.d ? `<span class="bud__d">${esc(tx(b.d))}</span>` : ''}</div>`).join('') + '<div class="tip" id="budTip"></div>';
    $('#pilot').innerHTML = D.MVP.pilot.map(r => `<div class="pilot__row"><span>${esc(tx(r.m))}</span><b>${esc(tx(r.t))}</b></div>`).join('');
    $('#tech').innerHTML = D.MVP.tech.map(t => `<span>${esc(tx(t))}</span>`).join('');
  }
  function initMVP() {
    renderMVP();
    const wrap = $('#budget');
    const show = e => {
      const b = e.target.closest('.bud'); const tip = $('#budTip'); if (!b || !tip) return;
      const r = b.getBoundingClientRect(), wr = wrap.getBoundingClientRect(), bar = b.querySelector('.bud__bar i').getBoundingClientRect();
      tip.textContent = b.dataset.tip; tip.style.left = (bar.right - wr.left) + 'px'; tip.style.top = (r.bottom - wr.top - 6) + 'px'; tip.style.opacity = 1;
    };
    wrap.addEventListener('pointerover', show); wrap.addEventListener('focusin', show);
    wrap.addEventListener('pointerleave', () => { const t = $('#budTip'); if (t) t.style.opacity = 0; });
    wrap.addEventListener('focusout', () => { const t = $('#budTip'); if (t) t.style.opacity = 0; });
    if (ST && G && !RM) {
      ST.create({ trigger: '#budget', start: 'top 85%', once: true, onEnter: () => G.from('#budget .bud__bar i', { scaleX: 0, duration: 1, stagger: .08, ease: 'power3.out' }) });
      ST.create({ trigger: '#weeks', start: 'top 85%', once: true, onEnter: () => G.from('#weeks .wkbar i', { scaleX: 0, transformOrigin: '0 50%', duration: .9, stagger: .1, ease: 'power3.out' }) });
    }
  }

  /* ================= MISC ================= */
  function renderCredits() {
    $('#credits').innerHTML = D.CREDITS.map(c => `<li><a href="${c[4]}" target="_blank" rel="noopener">${esc(c[1])}</a> · ${esc(c[2])} · ${esc(c[3])}</li>`).join('');
  }
  function initCookie() {
    if (store.get('sc-cookie')) return;
    const el = $('#cookie');
    let shown = false;
    const show = () => { if (shown) return; shown = true; window.removeEventListener('scroll', onSc); el.hidden = false; if (G && !RM) G.from(el, { y: 30, opacity: 0, duration: .5, ease: 'power3.out' }); };
    const onSc = () => { if (window.scrollY > window.innerHeight * 1.2) show(); };
    window.addEventListener('scroll', onSc, { passive: true });
    setTimeout(show, 25000);
    const done = v => { store.set('sc-cookie', v); el.hidden = true; toast(T('toastCookie')); };
    $('#ckNo').addEventListener('click', () => done('necessary'));
    $('#ckYes').addEventListener('click', () => done('analytics'));
  }

  /* topographic contour lines, drawn live behind the Trip Builder */
  function initTopo() {
    const cv = $('#topo'); if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, visible = false, t = 0, last = 0;
    const centers = [[.18, .3, 1.1], [.78, .72, 1.4], [.55, .12, .8]];
    const size = () => { const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; };
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      const base = Math.max(w, h);
      centers.forEach(([cx, cy, s], ci) => {
        for (let k = 1; k <= 16; k++) {
          const r0 = k * base * .022 * s;
          ctx.beginPath();
          for (let i = 0; i <= 96; i++) {
            const a = i / 96 * Math.PI * 2;
            const r = r0 * (1 + .16 * Math.sin(3 * a + t * .18 + k * .35 + ci) + .07 * Math.sin(5 * a - t * .11 + ci * 2) + .04 * Math.sin(9 * a + k));
            const x = cx * w + Math.cos(a) * r, y = cy * h + Math.sin(a) * r * .72;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.strokeStyle = k % 4 === 0 ? 'rgba(226,165,26,.13)' : 'rgba(234,241,239,.055)';
          ctx.lineWidth = k % 4 === 0 ? 1.2 : 1;
          ctx.stroke();
        }
      });
    };
    const loop = now => { if (!visible) return; if (now - last > 50) { t += .05; last = now; draw(); } requestAnimationFrame(loop); };
    size(); draw();
    window.addEventListener('resize', () => { size(); draw(); });
    if (RM) return;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) requestAnimationFrame(loop); }).observe(cv);
  }

  /* one consistent settle motion: elements stay visible, they only travel into place */
  function initSettle() {
    if (!G || !ST || RM) return;
    const groups = ['.section-head', '.heard__item', '.verify', '.chat', '.pano', '.side > *', '.trip', '.concierge', '.howbook li', '.paybox', '.faq details', '.wk', '.bud', '.foot__grid > *'];
    groups.forEach(sel => {
      ST.batch(sel, { start: 'top 90%', once: true, onEnter: els => G.from(els, { y: 42, duration: .95, ease: 'power3.out', stagger: .07, overwrite: 'auto' }) });
    });
    G.fromTo('.planner__topo', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '#planner', start: 'top bottom', end: 'bottom top', scrub: true } });
    window.addEventListener('load', () => ST.refresh());
  }

  /* ================= INIT ================= */
  function init() {
    const saved = store.get('sc-lang');
    const lang = saved || ((navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en');
    initTheme();
    applyLang(lang, true);
    S.chatLang = S.lang;
    initNav();
    initCompass();
    initGuides();
    initChat();
    initPreview();
    initTrips();
    initWizard();
    initDrawer();
    initMVP();
    renderCredits();
    updateClock(); setInterval(updateClock, 30000);
    initCookie();
    initTopo();
    $$('[data-lang]').forEach(b => b.addEventListener('click', () => { if (b.dataset.lang !== S.lang) applyLang(b.dataset.lang); }));
    heroIntro();
    initSettle();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
