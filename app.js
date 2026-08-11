/**
 * Skattejægeren SPA
 * - Stats have HTML defaults so they never stay as "—"
 * - Robust base path for GitHub Pages
 */

const app = document.getElementById('app');

// Works both on / and /skattejaegeren/
const BASE = new URL('.', import.meta.url);

const FALLBACK_AID = {
  thisYear: { label: '23,2 mia. kr.', amountDkk: 23214400000 },
  last10Years: { label: 'ca. 187 mia. kr.', amountDkk: 187150000000 },
  since2015: { label: 'ca. 228 mia. kr.', amountDkk: 227600000000 },
  perDaneThisYear: { amountDkk: 3800 },
  btTaxCut: { amountDkk: 10000 },
  homeContrast: [
    {
      home: 'Lolland mangler mindst 300 mio. kr.',
      abroad: 'Danida finder milliarder — med engelsk projektnavn',
    },
    {
      home: 'Magnus: 60.000 kr./år til creme nægtes',
      abroad: 'Sex & Samfund: mio. til barnevognsmarch',
    },
    {
      home: 'Kommuner skærer i velfærd',
      abroad: '149.200 kr. til kaffestop i Rwanda (OpEn)',
    },
  ],
};

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtKr(n) {
  return Number(n).toLocaleString('da-DK') + ' kr.';
}

function fmtShort(n) {
  if (n >= 1e9) {
    const v = n / 1e9;
    return v.toLocaleString('da-DK', { maximumFractionDigits: 1 }) + ' mia.';
  }
  if (n >= 1e6) {
    const v = n / 1e6;
    return v.toLocaleString('da-DK', { maximumFractionDigits: 1 }) + ' mio.';
  }
  return Number(n).toLocaleString('da-DK');
}

function badge(kind) {
  if (kind === 'official' || kind === 'reported') return '<span class="badge ok">Officiel</span>';
  if (kind === 'estimate') return '<span class="badge warn">Estimat</span>';
  return '<span class="badge hot">Claim</span>';
}

function orientBadge(c) {
  const o = c?.orientation || 'neutral';
  const label = c?.orientationLabel || o;
  const cls =
    o === 'venstre' ? 'orient-left' : o === 'højre' ? 'orient-right' : o === 'blandet' ? 'orient-mix' : 'orient-neu';
  return `<span class="badge ${cls}" title="${esc(c?.orientationNote || '')}">${esc(label)}</span>`;
}

function rich(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function route() {
  const raw = (location.hash || '#/').replace(/^#\/?/, '');
  const [page, id] = raw.split('/');
  return { page: page || 'home', id };
}

function navKey(page) {
  if (page === 'home' || page === '') return 'home';
  if (['projekter', 'projekt', 'open', 'katalog', 'sager', 'sag', 'cvr', 'regnskab', 'udforsk'].includes(page))
    return 'udforsk';
  if (['indsigt', 'grav', 'undersogelse', 'tal'].includes(page)) return 'indsigt';
  if (['om', 'metode', 'opslag', 'aktindsigt', 'foi'].includes(page)) return 'om';
  return page;
}

function setNav(page) {
  const key = navKey(page);
  document.querySelectorAll('.nav a').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('data-nav') === key);
  });
}

function shareBlock(title, path, opts = {}) {
  const url = `https://mattomadsen.github.io/skattejaegeren/${path || ''}`;
  const text = encodeURIComponent(title + ' — Skattejægeren');
  const u = encodeURIComponent(url);
  const printBtn = opts.print
    ? `<button type="button" class="share-btn" data-print="1">Print faktaark</button>`
    : '';
  return `
    <div class="share" role="group" aria-label="Del">
      <span class="share-label">Del</span>
      <button type="button" class="share-btn" data-copy="${esc(url)}">Kopiér link</button>
      <a class="share-btn" href="https://x.com/intent/tweet?text=${text}&url=${u}" target="_blank" rel="noopener">X</a>
      ${printBtn}
    </div>`;
}

function bindShare() {
  document.querySelectorAll('.share-btn[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const v = btn.getAttribute('data-copy');
      try {
        await navigator.clipboard.writeText(v);
        btn.textContent = 'Kopieret';
        setTimeout(() => (btn.textContent = 'Kopiér link'), 1500);
      } catch {
        prompt('Kopiér link:', v);
      }
    });
  });
  document.querySelectorAll('.share-btn[data-print]').forEach((btn) => {
    btn.addEventListener('click', () => window.print());
  });
}

function bindTipForm() {
  const form = document.getElementById('tip-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const topic = (form.querySelector('[name=topic]')?.value || '').trim();
    const body = (form.querySelector('[name=body]')?.value || '').trim();
    const source = (form.querySelector('[name=source]')?.value || '').trim();
    // Gratis, ingen Gmail: åbner GitHub Issue (kan sendes uden mail-konto hos os)
    const title = encodeURIComponent('Tip: ' + (topic || 'uden emne'));
    const issueBody = encodeURIComponent(
      `## Tip\n\n**Emne:** ${topic}\n\n${body}\n\n**Kilde/link:** ${source || '—'}\n\n---\n_Sendt via Skattejægeren tip-form_`
    );
    window.open(
      `https://github.com/MattOMadsen/skattejaegeren/issues/new?title=${title}&body=${issueBody}`,
      '_blank',
      'noopener'
    );
  });
}

function bindPageJump() {
  document.querySelectorAll('[data-jump]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-jump');
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function subnavUdforsk(active) {
  const items = [
    { id: 'projekter', href: '#/projekter', label: 'Projekter' },
    { id: 'open', href: '#/open', label: 'OpEn' },
    { id: 'sager', href: '#/sager', label: 'Sager' },
    { id: 'cvr', href: '#/cvr', label: 'CVR' },
  ];
  return `
    <nav class="subnav" aria-label="Udforsk">
      ${items
        .map(
          (i) =>
            `<a href="${i.href}" class="${active === i.id ? 'is-on' : ''}">${esc(i.label)}</a>`
        )
        .join('')}
    </nav>`;
}

async function fetchJson(path) {
  const url = new URL(path, BASE);
  const res = await fetch(url.href, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

function applyStats(aid) {
  const year = aid?.thisYear?.label || FALLBACK_AID.thisYear.label;
  const y10 = aid?.last10Years?.label || FALLBACK_AID.last10Years.label;
  const per = aid?.perDaneThisYear?.amountDkk ?? FALLBACK_AID.perDaneThisYear.amountDkk;
  const tax = aid?.btTaxCut?.amountDkk ?? FALLBACK_AID.btTaxCut.amountDkk;

  const elY = document.getElementById('stat-year');
  const el10 = document.getElementById('stat-10');
  const elP = document.getElementById('stat-per');
  const elT = document.getElementById('stat-tax');

  if (elY) elY.textContent = year.replace(/\s*kr\.?/i, '').trim();
  if (el10) el10.textContent = y10.replace(/\s*kr\.?/i, '').trim();
  if (elP) elP.textContent = Number(per).toLocaleString('da-DK');
  if (elT) elT.textContent = Number(tax).toLocaleString('da-DK');

  // Animate integer stats (per person / BT) once
  if (!applyStats._didAnim) {
    applyStats._didAnim = true;
    animateCount(elP, per, 900);
    animateCount(elT, tax, 1100);
  }
}

function animateCount(el, target, ms) {
  if (!el || target == null || Number.isNaN(Number(target))) return;
  const end = Number(target);
  const start = performance.now();
  el.classList.add('is-animating');
  const step = (now) => {
    const t = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(end * eased).toLocaleString('da-DK');
    if (t < 1) requestAnimationFrame(step);
    else {
      el.textContent = end.toLocaleString('da-DK');
      el.classList.remove('is-animating');
    }
  };
  requestAnimationFrame(step);
}

function initTheme() {
  const saved = localStorage.getItem('sj-theme');
  if (saved === 'light' || saved === 'dark') {
    document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : '');
    if (saved === 'dark') document.documentElement.removeAttribute('data-theme');
  }
  const btn = document.getElementById('theme-toggle');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('sj-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('sj-theme', 'light');
    }
  });
}

// Ensure stats never empty — run immediately with fallback
applyStats(FALLBACK_AID);
initTheme();

let cache = null;

async function loadCases() {
  // One file per case: data/cases/<slug>.json + index.json
  const index = await fetchJson('data/cases/index.json');
  const list = await Promise.all(
    (index.slugs || []).map((slug) =>
      fetchJson(`data/cases/${slug}.json`).catch((e) => {
        console.warn('case missing', slug, e);
        return null;
      })
    )
  );
  const cases = list.filter(Boolean);
  // priority sort (same as index)
  cases.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99) || a.slug.localeCompare(b.slug, 'da'));
  return {
    updated: index.updated,
    editorial: index.editorial,
    totals: index.totals,
    cases,
  };
}

async function loadAll() {
  if (cache) return cache;
  try {
    const [
      aid,
      projects,
      cases,
      posts,
      sourceMap,
      openGrants,
      orgRank,
      miniSerie,
      partners,
      media,
      deepDive,
      cvr,
      alternatives,
      timeline,
      orientation,
    ] = await Promise.all([
      fetchJson('data/aid-totals.json').catch(() => FALLBACK_AID),
      fetchJson('data/projects.json'),
      loadCases(),
      fetchJson('data/posts.json'),
      fetchJson('data/source-map.json').catch(() => null),
      fetchJson('data/cisu-open-grants.json').catch(() => null),
      fetchJson('data/cisu-org-rank.json').catch(() => null),
      fetchJson('data/ngo-miniserie-status.json').catch(() => null),
      fetchJson('data/strategic-partners.json').catch(() => null),
      fetchJson('data/media-validation.json').catch(() => null),
      fetchJson('data/partner-deep-dive.json').catch(() => null),
      fetchJson('data/cvr-regnskab.json').catch(() => null),
      fetchJson('data/alternatives.json').catch(() => null),
      fetchJson('data/timeline.json').catch(() => null),
      fetchJson('data/orientation-overview.json').catch(() => null),
    ]);
    applyStats(aid);
    cache = {
      aid,
      projects,
      cases,
      posts,
      sourceMap,
      openGrants,
      orgRank,
      miniSerie,
      partners,
      media,
      deepDive,
      cvr,
      alternatives,
      timeline,
      orientation,
    };
    return cache;
  } catch (e) {
    console.error(e);
    applyStats(FALLBACK_AID);
    throw e;
  }
}

function projectCard(p) {
  return `
    <a class="card" href="#/projekt/${esc(p.id)}">
      <div class="card-top">
        ${badge(p.amountKind)}
        <span class="amt">${esc(fmtShort(p.amountDkk))}</span>
      </div>
      <h3>${esc(p.title)}</h3>
      <p class="blurb">${esc(p.whatFor)}</p>
      <p class="meta">${esc(p.org)}${p.country ? ' · ' + esc(p.country) : ''}</p>
    </a>`;
}

const SHOCK = [
  {
    amt: '25 mio.',
    title: 'LGBT+Danmark i regnskab 2025',
    text: 'Indtægter 25,2 mio. · projektindtægter 14,8 mio. · CISU Ukraine-projekt 4,5 mio.',
    href: '#/sag/lgbt-danmark-cisu',
    tag: 'Regnskab',
  },
  {
    amt: '11,6 mio.',
    title: 'Global Aktion i CISU-sample',
    text: '8 poster — climate justice & peasants’ rights. Største org i kataloget.',
    href: '#/sag/global-aktion',
    tag: 'Officiel',
  },
  {
    amt: '1,5 mio.',
    title: 'Barnevognsmarch i Danmark',
    text: 'Sex & Samfund · OpEn — verificeret CISU 1.498.642 kr.',
    href: '#/sag/barnevogn-og-prioritering',
    tag: 'Officiel',
  },
  {
    amt: '2,5 mio.',
    title: 'Amnesty gamification i DK',
    text: 'OpEn: menneskerettigheder til 13–18-årige — Astralis, Gyldendal, Serious Games.',
    href: '#/sag/amnesty-open',
    tag: 'OpEn',
  },
  {
    amt: '58%',
    title: 'MS: kun så meget til partnere',
    text: 'ActionAid DK SPA 2025 — 16% HQ i Danmark, 2% IPE.',
    href: '#/sag/ms-actionaid',
    tag: 'Rapport',
  },
  {
    amt: '1,5 mio.',
    title: 'Blackfish på DR1 via OpEn',
    text: 'Mille og Verdens skove — naturdokumentar med 1,5 mio. i bistandspulje.',
    href: '#/sag/blackfish-mille',
    tag: 'OpEn',
  },
];

function renderHome(d) {
  const projects = [...d.projects.projects]
    .filter((p) => p.amountDkk > 0)
    .sort((a, b) => b.amountDkk - a.amountDkk)
    .slice(0, 6);
  const contrasts = d.aid.homeContrast || FALLBACK_AID.homeContrast;

  return `
    <section class="hero">
      <h1>Følg milliarderne.<br>Ikke pressemeddelelsen.</h1>
      <p>
        Hvad går dansk ulandsbistand til — og hvorfor er der råd derude,
        når der er knaphed herhjemme? Projekter, beløb og kilder.
      </p>
    </section>

    <div class="section-head">
      <h2>Største chok</h2>
      <a href="#/open">OpEn-katalog →</a>
    </div>
    <div class="grid cols-3 shock-grid">
      ${SHOCK.map(
        (s) => `
        <a class="card shock" href="${esc(s.href)}">
          <span class="badge hot">${esc(s.tag)}</span>
          <p class="shock-amt">${esc(s.amt)}</p>
          <h3>${esc(s.title)}</h3>
          <p class="blurb">${esc(s.text)}</p>
        </a>`
      ).join('')}
    </div>

    <div class="chips" style="margin-top:1.75rem">
      ${contrasts
        .slice(0, 3)
        .map(
          (c) => `
        <div class="chip">
          <div class="chip-home"><strong>Hjemme</strong> · ${esc(c.home)}</div>
          <div class="chip-vs">VS</div>
          <div class="chip-away"><strong>Ude</strong> · ${esc(c.abroad)}</div>
        </div>`
        )
        .join('')}
    </div>

    <div class="section-head">
      <h2>Projekter</h2>
      <a href="#/projekter">Udforsk →</a>
    </div>
    <div class="grid cols-3">
      ${projects.map(projectCard).join('')}
    </div>
    <div class="home-links">
      <a class="btn" href="#/indsigt">Indsigt: 23 mia. i perspektiv</a>
      <a class="btn" href="#/open">OpEn-katalog</a>
    </div>
  `;
}

function filterBar(placeholder) {
  return `
    <div class="filter-bar" id="filter-bar">
      <input type="search" id="q" class="filter-input" placeholder="${esc(placeholder)}" autocomplete="off" />
      <select id="kind" class="filter-select" aria-label="Type">
        <option value="">Alle typer</option>
        <option value="official">Officiel</option>
        <option value="claim">Claim</option>
        <option value="estimate">Estimat</option>
      </select>
      <select id="sort" class="filter-select" aria-label="Sortering">
        <option value="amount-desc">Størst beløb</option>
        <option value="amount-asc">Mindst beløb</option>
        <option value="name">Navn A–Å</option>
      </select>
      <span class="filter-count muted" id="filter-count"></span>
    </div>
    <div class="grid cols-2" id="filter-results"></div>
  `;
}

function bindProjectFilter(list) {
  const q = document.getElementById('q');
  const kind = document.getElementById('kind');
  const sort = document.getElementById('sort');
  const out = document.getElementById('filter-results');
  const count = document.getElementById('filter-count');
  if (!q || !out) return;

  const run = () => {
    const term = (q.value || '').trim().toLowerCase();
    const k = kind?.value || '';
    let rows = list.filter((p) => {
      if (k && p.amountKind !== k && !(k === 'official' && p.amountKind === 'reported')) return false;
      if (!term) return true;
      const hay = [p.title, p.org, p.whatFor, p.pool, p.country].join(' ').toLowerCase();
      return hay.includes(term);
    });
    const s = sort?.value || 'amount-desc';
    rows = [...rows].sort((a, b) => {
      if (s === 'name') return (a.title || '').localeCompare(b.title || '', 'da');
      if (s === 'amount-asc') return (a.amountDkk || 0) - (b.amountDkk || 0);
      return (b.amountDkk || 0) - (a.amountDkk || 0);
    });
    if (count) count.textContent = `${rows.length} resultater`;
    out.innerHTML = rows.length
      ? rows.map(projectCard).join('')
      : '<p class="muted">Ingen match — prøv et andet ord.</p>';
  };
  q.addEventListener('input', run);
  kind?.addEventListener('change', run);
  sort?.addEventListener('change', run);
  run();
}

function bindOpenFilter(grants) {
  const q = document.getElementById('q');
  const sort = document.getElementById('sort');
  const out = document.getElementById('filter-results');
  const count = document.getElementById('filter-count');
  if (!q || !out) return;

  const card = (g) => `
    <a class="card" href="${esc(g.url)}" target="_blank" rel="noopener">
      <div class="card-top">
        <span class="badge ok">CISU</span>
        <span class="amt">${esc(fmtShort(g.amountDkk || 0))}</span>
      </div>
      <h3>${esc(g.title)}</h3>
      <p class="blurb">${esc(g.resume || g.pool || '')}</p>
      <p class="meta">${esc(g.org || '?')} · CISU ↗</p>
    </a>`;

  const run = () => {
    const term = (q.value || '').trim().toLowerCase();
    let rows = grants.filter((g) => {
      if (!term) return true;
      const hay = [g.title, g.org, g.resume, g.pool].join(' ').toLowerCase();
      return hay.includes(term);
    });
    const s = sort?.value || 'amount-desc';
    rows = [...rows].sort((a, b) => {
      if (s === 'name') return (a.title || '').localeCompare(b.title || '', 'da');
      if (s === 'amount-asc') return (a.amountDkk || 0) - (b.amountDkk || 0);
      return (b.amountDkk || 0) - (a.amountDkk || 0);
    });
    if (count) count.textContent = `${rows.length} resultater`;
    out.innerHTML = rows.length
      ? rows.slice(0, 100).map(card).join('')
      : '<p class="muted">Ingen match.</p>';
  };
  q.addEventListener('input', run);
  sort?.addEventListener('change', run);
  run();
}

function renderProjects(d) {
  const projects = [...d.projects.projects];
  return `
    ${subnavUdforsk('projekter')}
    <section class="hero hero-tight">
      <h1>Projekter</h1>
      <p>${projects.length} poster. Søg og filtrer.</p>
    </section>
    ${filterBar('Søg projekter, org, land…')}
  `;
}

function renderProject(d, id) {
  const p = d.projects.projects.find((x) => x.id === id);
  if (!p) {
    return `<a class="back" href="#/projekter">← Projekter</a><p class="error">Projekt ikke fundet.</p>`;
  }
  return `
    <a class="back" href="#/projekter">← Projekter</a>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.35rem;align-items:center">
      ${badge(p.amountKind)}
    </div>
    <h1 style="margin:0;font-size:clamp(1.5rem,3.5vw,2rem);letter-spacing:-.03em">${esc(p.title)}</h1>
    <p class="detail-amt">${esc(p.amountDkk ? fmtKr(p.amountDkk) : p.amountNote || '—')}</p>
    ${shareBlock(p.title, `#/projekt/${p.id}`)}

    <div class="panel">
      <h2>Fakta</h2>
      <div class="kv">
        <div class="kv-row"><span>Org</span><div>${esc(p.org)}</div></div>
        <div class="kv-row"><span>Pulje</span><div>${esc(p.pool)}</div></div>
        <div class="kv-row"><span>Land</span><div>${esc(p.country || '—')}</div></div>
        ${p.period ? `<div class="kv-row"><span>Periode</span><div>${esc(p.period)}</div></div>` : ''}
        <div class="kv-row"><span>Research</span><div>${esc((p.researchers || []).map((r) => '@' + r).join(', ') || '—')}</div></div>
      </div>
    </div>

    <div class="panel">
      <h2>Hvad gik pengene til?</h2>
      <p>${esc(p.whatFor)}</p>
    </div>

    <div class="panel">
      <h2>Vinkel</h2>
      <p>${esc(p.angle)}</p>
    </div>

    <div class="panel">
      <h2>Kilder</h2>
      <ul class="sources">
        ${(p.sources || [])
          .map(
            (s) =>
              `<li>${badge(s.kind === 'official' ? 'official' : 'claim')}
              <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a></li>`
          )
          .join('')}
      </ul>
    </div>
    ${
      p.caseSlug
        ? `<p style="margin-top:1rem"><a href="#/sag/${esc(p.caseSlug)}">Åbn sagsmappe →</a></p>`
        : ''
    }
  `;
}

function renderCases(d) {
  const cases = [...d.cases.cases].sort((a, b) => a.priority - b.priority);
  const left = cases.filter((c) => c.orientation === 'venstre').length;
  return `
    ${subnavUdforsk('sager')}
    <section class="hero hero-tight">
      <h1>Sager</h1>
      <p>
        Skrevet på almindeligt dansk: hvad pengene går til, om formålet er venstre- eller højreorienteret,
        og hvad beløbet kunne være herhjemme.
        ${left ? `<strong>${left}</strong> af sagerne vurderes som progressivt/venstre kodet.` : ''}
      </p>
    </section>
    <div class="grid cols-2">
      ${cases
        .map(
          (c) => `
        <a class="card" href="#/sag/${esc(c.slug)}">
          <div class="card-top">
            ${orientBadge(c)}
            <span class="amt">${esc(c.amountLabel)}</span>
          </div>
          <h3>${esc(c.title)}</h3>
          <p class="blurb">${esc(c.plainLead || c.summary)}</p>
        </a>`
        )
        .join('')}
    </div>
  `;
}

function renderCase(d, slug) {
  const c = d.cases.cases.find((x) => x.slug === slug);
  if (!c) return `<a class="back" href="#/sager">← Sager</a><p class="error">Sag ikke fundet.</p>`;
  const depth = c.depth || {};
  const related = d.projects.projects.filter((p) => p.caseSlug === slug);
  const home = c.homeCompare?.text;
  return `
    <a class="back" href="#/sager">← Sager</a>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.35rem;align-items:center">
      ${badge(c.amountKind)}
      ${orientBadge(c)}
    </div>
    <h1 style="margin:0;font-size:clamp(1.5rem,3.5vw,2rem);letter-spacing:-.03em">${esc(c.title)}</h1>
    <p class="detail-amt">${esc(c.amountLabel)}</p>
    ${shareBlock(c.title, `#/sag/${c.slug}`, { print: true })}
    <p class="print-only-note">Skattejægeren — faktaark · ${esc(c.title)} · mattomadsen.github.io/skattejaegeren</p>

    ${
      c.plainLead
        ? `<div class="panel lead-panel"><h2>Kort fortalt</h2><p class="lead-text">${rich(c.plainLead)}</p></div>`
        : ''
    }

    <div class="panel">
      <h2>Hvad går dine penge til?</h2>
      <p>${rich(c.whatMoneyFor || c.summary)}</p>
    </div>

    <div class="panel">
      <h2>Venstre eller højre?</h2>
      <p>${orientBadge(c)}</p>
      <p style="margin-top:.65rem">${rich(c.orientationNote || 'Ikke vurderet endnu.')}</p>
      <p class="muted" style="margin-top:.5rem">
        Det er vores vurdering af <em>formålet</em> — ikke et partimedlemskab. Officielle kilder nedenfor.
      </p>
    </div>

    ${
      home
        ? `<div class="panel home-compare">
            <h2>Hvad kunne det være herhjemme?</h2>
            <p>${rich(home)}</p>
            <p class="muted" style="margin-top:.5rem">Grovte regnestykker (ca. 550.000 kr. pr. sygeplejerske-årsværk; 10.000 kr. = BT’s skattelettelse ved gns. indkomst).</p>
          </div>`
        : ''
    }

    <div class="panel">
      <h2>Vores vinkel</h2>
      <p>${rich(c.angle)}</p>
    </div>

    <div class="panel">
      <h2>${esc(depth.headline || 'Mere om sagen')}</h2>
      ${(depth.body || []).map((p) => `<p>${rich(p)}</p>`).join('')}
    </div>

    <div class="panel">
      <h2>Kilder</h2>
      <ul class="sources">
        ${(depth.sources || [])
          .map(
            (s) =>
              `<li>${badge(s.kind === 'official' || s.kind === 'org' ? 'official' : 'claim')}
              <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a></li>`
          )
          .join('')}
      </ul>
    </div>
    ${
      related.length
        ? `<div class="section-head" style="margin-top:1.5rem"><h2>Tilknyttede projekter</h2></div>
           <div class="grid cols-2">${related.map(projectCard).join('')}</div>`
        : ''
    }
  `;
}

function renderAktindsigt() {
  return `
    <section class="hero">
      <h1>Aktindsigt</h1>
      <p>
        Vi vil indhente flere originale dokumenter fra myndighederne —
        bevillinger, regnskaber og kontrolsager — så tallene kan efterprøves.
      </p>
    </section>
    <div class="panel" style="text-align:center;padding:2.5rem 1.5rem">
      <p class="badge warn" style="margin-bottom:1rem">Kommer snart</p>
      <h2 style="margin:0 0 .75rem;font-size:1.25rem;text-transform:none;letter-spacing:-.02em;color:var(--text)">
        Første anmodninger er under forberedelse
      </h2>
      <p class="muted" style="margin:0;max-width:28rem;margin-inline:auto">
        Når materialet er på plads, publicerer vi det her med kilder —
        på samme måde som de øvrige sager.
      </p>
    </div>
  `;
}

function hallOfNumbers(grants, n = 20) {
  const top = [...grants]
    .filter((g) => g.amountDkk > 0)
    .sort((a, b) => b.amountDkk - a.amountDkk)
    .slice(0, n);
  if (!top.length) return '';
  return `
    <div class="section-head" id="hall"><h2>Hall of Numbers</h2>
      <button type="button" class="linkish" data-jump="filter-bar">Søg alle →</button>
    </div>
    <p class="muted" style="margin:-.35rem 0 0.85rem">Top ${top.length} største bevillinger i kataloget (CISU-sample).</p>
    <div class="panel" style="padding:0.5rem 1rem 0.25rem;overflow-x:auto">
      <table class="hall-table">
        <thead>
          <tr><th>#</th><th>Beløb</th><th>Projekt</th><th>Org</th></tr>
        </thead>
        <tbody>
          ${top
            .map(
              (g, i) => `
            <tr>
              <td class="hall-rank">${i + 1}</td>
              <td class="num">${esc(fmtShort(g.amountDkk))}</td>
              <td>${
                g.url
                  ? `<a href="${esc(g.url)}" target="_blank" rel="noopener">${esc(g.title)}</a>`
                  : esc(g.title)
              }</td>
              <td class="muted">${esc(g.org || '—')}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>`;
}

function renderOpen(d) {
  const og = d.openGrants;
  if (!og?.grants?.length) {
    return `${subnavUdforsk('open')}<section class="hero"><h1>OpEn-katalog</h1><p class="error">Kunne ikke loade data</p></section>`;
  }
  const orgs = (d.orgRank?.orgs || []).slice(0, 6);
  return `
    ${subnavUdforsk('open')}
    <section class="hero hero-tight">
      <h1>OpEn-katalog</h1>
      <p>
        <strong>${og.countWithAmount}</strong> CISU-bevillinger ·
        sum <strong style="color:#fda4a4">${esc(fmtShort(og.sumAmountDkk))} kr.</strong>
      </p>
    </section>
    ${hallOfNumbers(og.grants, 20)}
    ${
      orgs.length
        ? `<div class="section-head" style="margin-top:1.75rem"><h2>Største modtagere</h2></div>
           <div class="grid cols-3" style="margin-bottom:1.25rem">
           ${orgs
             .map(
               (o) => `
             <div class="card">
               <div class="card-top"><span class="badge ok">${o.count}</span>
               <span class="amt">${esc(fmtShort(o.sumDkk))}</span></div>
               <h3>${esc(o.org)}</h3>
             </div>`
             )
             .join('')}
           </div>`
        : ''
    }
    <div class="section-head"><h2>Søg i kataloget</h2></div>
    ${filterBar('Søg titel, org, resume…').replace(
      `<select id="kind" class="filter-select" aria-label="Type">
        <option value="">Alle typer</option>
        <option value="official">Officiel</option>
        <option value="claim">Claim</option>
        <option value="estimate">Estimat</option>
      </select>`,
      ''
    )}
  `;
}

function renderCvr(d) {
  const orgs = d.cvr?.orgs || [];
  return `
    ${subnavUdforsk('cvr')}
    <section class="hero hero-tight">
      <h1>CVR &amp; regnskab</h1>
      <p>Offentlige foreningsdata og CISU-match.</p>
    </section>
    <div class="grid cols-2">
      ${orgs
        .map((o) => {
          const r = (o.regnskab && o.regnskab[0]) || null;
          const cvrLabel = o.cvr ? `CVR ${o.cvr}` : 'CISU';
          return `
          <div class="card">
            <div class="card-top">
              <span class="badge ok">${esc(cvrLabel)}</span>
              <span class="amt">${esc(o.status || '')}</span>
            </div>
            <h3>${esc(o.name)}</h3>
            <p class="meta">${esc([o.form, o.address].filter(Boolean).join(' · ') || '—')}</p>
            <p class="blurb" style="margin-top:.65rem">${esc(
              o.orgClaims?.annualTurnover || o.orgClaims?.fundingPartners || o.orgClaims?.funding || ''
            )}</p>
            ${
              r
                ? `<p class="blurb"><strong>${r.year}:</strong> indtægter ${esc(fmtKr(r.indtægterIAltDkk))}
                   ${r.projektindtægterDkk != null ? ` · projekter ${esc(fmtShort(r.projektindtægterDkk))}` : ''}
                   ${r.cisuProgramBevillingDkk != null ? ` · CISU-sample ca. ${esc(fmtShort(r.cisuProgramBevillingDkk))}` : ''}
                   · resultat ${esc(fmtKr(r.aaretsResultatDkk))}</p>
                   ${r.angle ? `<p class="blurb muted">${esc(r.angle)}</p>` : ''}`
                : o.cisuSumDkk
                  ? `<p class="blurb"><strong>CISU-sum:</strong> ${esc(fmtShort(o.cisuSumDkk))} kr.
                     (${o.cisuCount || '?'} poster)
                     ${(o.cisuExamples || []).map((ex) => `<br>· ${esc(ex)}`).join('')}</p>
                     <p class="blurb muted">${esc(o.regnskabNote || '')}</p>`
                  : `<p class="blurb muted">${esc(o.regnskabNote || 'Regnskabstal under udbygning.')}</p>`
            }
            <p class="meta" style="margin-top:.75rem">
              ${o.caseSlug ? `<a href="#/sag/${esc(o.caseSlug)}">Sag</a> · ` : ''}
              ${o.website ? `<a href="${esc(o.website)}" target="_blank" rel="noopener">Hjemmeside</a>` : '<span class="muted">Hjemmeside ukendt</span>'}
              ${o.virkSearch ? ` · <a href="${esc(o.virkSearch)}" target="_blank" rel="noopener">CVR</a>` : ''}
              ${r?.sourceUrl ? ` · <a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">Årsrapport</a>` : ''}
              ${!o.website && !o.caseSlug ? ` · <a href="#/open">OpEn-katalog</a>` : ''}
            </p>
          </div>`;
        })
        .join('')}
    </div>
  `;
}

function renderGrav(d) {
  const v = d.sourceMap?.verifiedThisRound || [];
  const open = d.sourceMap?.openQuestions || [];
  const mini = d.miniSerie?.items || [];
  const og = d.openGrants;
  return `
    <section class="hero">
      <h1>Undersøgelse</h1>
      <p>
        Hvad går pengene til — og holder kilderne? Vi har scannet CISU (3.288 poster) og hentet
        beløb for <strong>${og?.countWithAmount || '200+'}</strong> OpEn/nøgle-bevillinger
        (sum ca. <strong>${og ? fmtShort(og.sumAmountDkk) : '129 mio.'} kr.</strong>).
        <a href="https://github.com/MattOMadsen/skattejaegeren/blob/main/docs/UNDERS%C3%98GELSE.md" target="_blank" rel="noopener">Fuld note ↗</a>
      </p>
    </section>

    <div class="panel">
      <h2>3.800 vs 10.000 kr. — hvad er forskellen?</h2>
      <p><span class="badge ok">Pr. indbygger</span> <strong>ca. 3.800 kr.</strong> = 23,2 mia. ÷ alle indbyggere (inkl. børn).</p>
      <p><span class="badge hot">BT / Olsen</span> <strong>10.000 kr.</strong> = skattelettelse for person med <em>gennemsnitsindkomst</em>, hvis hele bistandspotten bruges til lavere bundskat.
        Citat fra <a href="https://www.bt.dk/debat/bt-mener-afskaf-ulandsbistanden" target="_blank" rel="noopener">B.T. mener (4. aug. 2026)</a>, inspireret af podcasten med Baronen.
        Matematisk: 23 mia. ÷ ca. 2,3 mio. fuldtidsjob ≈ 10.000 kr.</p>
      <p class="muted">Begge tal kan «være rigtige» — de svarer bare på to forskellige spørgsmål.</p>
    </div>

    <div class="panel">
      <h2>BT-interview (3. aug. 2026)</h2>
      <p>
        Baronen var gæst i <strong>BT Borgerlig Tabloid</strong> med Joachim B. Olsen.
        BT’s egen promo: <strong>næsten 23 mia. kr.</strong> i udviklingsbistand — mere end politi og videregående uddannelser.
        <a href="https://x.com/oresundsbaron/status/2084253347566031129" target="_blank" rel="noopener">X-opslag ↗</a>
        ·
        <a href="https://www.bt.dk/podcast/borgerlig-tabloid/baronen-af-resund-hvor-mange-mennesker-redder-de-ved-at-g-en-tur" target="_blank" rel="noopener">BT episode ↗</a>
      </p>
      <p class="muted">
        Kritikere (Altinget/EL) angreb anonymitet — men skrev at eksemplerne «ligger offentligt tilgængeligt».
        Det er den rigtige pointe: tallene er ikke hemmelige. Vi har selv låst flere via CISU/UM.
        Se sag: <a href="#/sag/bt-mediedækning">BT-mediedækning</a>.
      </p>
    </div>

    <div class="panel">
      <h2>MS + Oxfam dybde (næste trin)</h2>
      ${
        d.deepDive
          ? `
        <p><strong>MS ActionAid</strong> (129 mio./år UM): 2025-rapport viser total ca. <strong>150 mio.</strong> (inkl. top-ups).
        Kun <strong>58%</strong> transfer til partnere; <strong>16%</strong> HQ i DK; <strong>2%</strong> IPE.
        Fokus: demokrati, climate justice, youth in crises.
        <a href="#/sag/ms-actionaid">Sag →</a></p>
        <p><strong>UM C1975:</strong> 4,7 mio. til ActionAid Uganda 2024; <strong>627.452 kr.</strong> uregelmæssigheder (løn/per diem) — tilbagebetaling.
        <a href="https://um.dk/media/2bojzbzk/c1975-report-1.pdf" target="_blank" rel="noopener">PDF ↗</a></p>
        <p><strong>Oxfam</strong> (103 mio./år): egen resultatrapport 2025 — 12 lande, 81,6% af lande-forbrug til partnere,
        47% Leaving No-One Behind / 36% Just Societies / 17% Climate Justice.
        <a href="#/sag/oxfam-spa">Sag →</a></p>
        <p class="muted">${esc((d.deepDive.comparison && d.deepDive.comparison.headline) || '')}</p>`
          : '<p>Se data/partner-deep-dive.json</p>'
      }
    </div>

    <div class="panel">
      <h2>Strategiske partnerskaber (1,264 mia./år)</h2>
      ${
        d.partners?.partners
          ? `<p class="muted">Alle 18 partnere fra UM — årlig bevilling:</p>
             ${d.partners.partners
               .map(
                 (p) =>
                   `<p><span class="badge ok">officiel</span> <strong>${esc(fmtShort(p.annualDkk))}</strong> · ${esc(p.org)}</p>`
               )
               .join('')}`
          : '<p>Se data/strategic-partners.json</p>'
      }
    </div>

    <div class="panel">
      <h2>OpEn-katalog</h2>
      <p>Se <a href="#/open">OpEn-katalog</a> — 262 bevillinger, sum ca. 129 mio. i sample.</p>
    </div>

    <div class="panel">
      <h2>OpenAid / næste lag</h2>
      <p class="muted">
        openaid.um.dk var utilgængelig ved scrape (timeout). Næste: IATI-filer fra UM, finanslovsposter,
        MS/Oxfam årsrapporter for de 129/103 mio. partnerskaber.
      </p>
    </div>

    <div class="panel">
      <h2>Baronens NGO-mini-serie — status</h2>
      ${
        mini.length
          ? mini
              .map(
                (x) => `
        <p>
          <span class="badge ${String(x.status).includes('confirm') ? 'ok' : String(x.status).includes('partial') ? 'warn' : 'hot'}">${esc(x.status)}</span>
          <strong>${esc(x.org)}</strong>
          ${x.sumFound != null ? ` · fundet sum ${esc(fmtShort(x.sumFound))} kr.` : ''}
          ${x.baronenClaim != null ? ` · claim ${esc(String(x.baronenClaim))}` : ''}
          ${x.note ? `<br><span class="muted">${esc(x.note)}</span>` : ''}
        </p>`
              )
              .join('')
          : '<p>Se data/ngo-miniserie-status.json</p>'
      }
    </div>

    <div class="panel">
      <h2>Verificeret tidligere</h2>
      ${
        v.length
          ? v
              .map(
                (x) =>
                  `<p><span class="badge ok">${esc(x.status)}</span> <strong>${esc(x.claim)}</strong> → ${esc(x.result)}</p>`
              )
              .join('')
          : `<p>Barnevogn · BIO RAP · Kaffestop · Kunstfond · MS 129 mio.</p>`
      }
    </div>

    <div class="panel">
      <h2>Hvor får de oplysningerne fra?</h2>
      <p><strong>@oresundsbaron</strong> — UM-tabeller, Kunstfond-PDF’er, CISU, mediestøtte-lister, links i kommentarspor. Ofte primærkilder.</p>
      <p><strong>@Statsstyret</strong> — aktindsigt i ansøgninger (MS/valgkontekst), plus officielle beløb. Ser hvad der <em>ansøges</em> om.</p>
      <p><strong>@MikeHuntHurts89</strong> — direkte CISU-bevillings-URL’er, OpEn-lister, habilitet, kontrast til DK (Lolland m.m.).</p>
    </div>

    <div class="panel">
      <h2>Går pengene derhen de siger?</h2>
      <p><strong>Bevilling:</strong> Ofte ja — beløb og org matcher CISU/UM.</p>
      <p><strong>Formål:</strong> Mange OpEn-projekter er <strong>oplysning i Danmark</strong> (marches, rap, podcast, Instagram) — ikke felt-nødhjælp.</p>
      <p><strong>Effekt:</strong> Offentligt svagt sporbart. Her graver vi videre (slutregnskaber, aktindsigt).</p>
    </div>

    <div class="panel">
      <h2>Skala</h2>
      <p>CISU lister <strong>3.288 bevillinger</strong>. OpEn alene har <strong>200+</strong> poster. Strategiske partnerskaber: <strong>1,264 mia. kr./år</strong>.</p>
      <p class="muted">De 23 mia. indeholder også humanitært, multilateralt og andet — vi lyver ikke om det. Vi starter der, hvor der er navn + beløb + offentlig tekst.</p>
    </div>

    <div class="panel">
      <h2>Åbne spørgsmål</h2>
      ${(open.length ? open : [
          'Andel OpEn+civilsamfund vs resten af de 23 mia.',
          'MS 129 mio. — landefordeling og advocacy-andel',
          'Slutregnskaber: brugt som bevilget?',
          'Ghana Venskab m.fl. — 1:1 CISU-match',
        ])
          .map((q) => `<p>· ${esc(typeof q === 'string' ? q : q)}</p>`)
          .join('')}
    </div>

    <div class="section-head"><h2>Næste grave-trin</h2></div>
    <div class="grid cols-2">
      <div class="card"><h3>OpEn-katalog</h3><p class="blurb">Alle 200+ OpEn-bevillinger med beløb i data/</p></div>
      <div class="card"><h3>OpenAid bilateralt</h3><p class="blurb">Land-for-land: hvad siger um.dk-databasen?</p></div>
      <div class="card"><h3>NGO-mini-serie match</h3><p class="blurb">Ghana Venskab, Crossing Borders … → CISU-id</p></div>
      <div class="card"><h3>Aktindsigt</h3><p class="blurb">Slutregnskaber + MS-ansøgninger (Statsstyret-metode)</p></div>
    </div>
  `;
}

function barRow(label, pct, tone) {
  const w = Math.max(2, Math.min(100, pct));
  return `
    <div class="bar-row">
      <div class="bar-meta"><span>${esc(label)}</span><span>${pct}%</span></div>
      <div class="bar-track"><div class="bar-fill ${tone || ''}" style="width:${w}%"></div></div>
    </div>`;
}

function renderIndsigt(d) {
  const alt = d.alternatives;
  const tl = d.timeline?.events || [];
  const ms = d.deepDive?.partners?.find((p) => p.id === 'ms-actionaid');
  const ox = d.deepDive?.partners?.find((p) => p.id === 'oxfam-denmark');
  const split = ms?.report2025?.budgetSplit2025 || [];
  const oxObj = ox?.resultsReport2025?.changeObjectives || [];
  const oxPartnerPct = ox?.resultsReport2025?.fundsToLocalPartners?.pctOfCountrySpend;

  return `
    <section class="hero">
      <h1>Indsigt</h1>
      <p>Prioritering i tal — hvad 23 mia. også kunne være, og hvordan de store NGO’er fordeler pengene.</p>
    </section>

    <nav class="page-jump" aria-label="Hop på siden">
      <button type="button" data-jump="alt">Alternativer</button>
      <button type="button" data-jump="budget">MS &amp; Oxfam</button>
      <button type="button" data-jump="tidslinje">Tidslinje</button>
      <a href="#/grav">Dybere →</a>
    </nav>

    <div class="section-head" id="alt"><h2>Hvad kunne det have været?</h2></div>
    <p class="muted" style="margin:-.35rem 0 1rem">${esc(alt?.disclaimer || 'Grovte regnestykker til illustration.')}</p>
    <div class="grid cols-3">
      ${(alt?.items || [])
        .map(
          (i) => `
        <div class="card">
          <p class="shock-amt" style="font-size:1.25rem">${esc(i.display)}</p>
          <h3>${esc(i.label)}</h3>
          <p class="blurb">${esc(i.blurb)}</p>
          <p class="meta">${esc(i.unitNote || '')}</p>
        </div>`
        )
        .join('')}
    </div>
    ${
      alt?.smallExamples?.length
        ? `<div class="panel" style="margin-top:1rem">
            <h2>Små beløb, store stillinger</h2>
            ${alt.smallExamples
              .map(
                (s) =>
                  `<p><strong>${esc(s.label)}</strong> (${esc(fmtShort(s.amountDkk))}) ≈ ${esc(s.equiv)}</p>`
              )
              .join('')}
          </div>`
        : ''
    }

    <div class="section-head" id="budget" style="margin-top:2rem">
      <h2>MS vs Oxfam — SPA-profil</h2>
    </div>
    <p class="muted" style="margin:-.35rem 0 1rem">
      UM grundbevilling: MS <strong>129 mio.</strong>/år · Oxfam <strong>103 mio.</strong>/år.
      Tallene nedenfor er fra deres egne resultatrapporter (forskellige opgørelser — ikke 1:1).
    </p>
    <div class="budget-duo">
      <div class="panel">
        <h2 style="margin-top:0">MS ActionAid 2025</h2>
        <p class="muted" style="margin-bottom:1rem">Total ca. 150 mio. (inkl. top-ups). Fordeling af forbrug:</p>
        ${
          split.length
            ? split.map((r) => barRow(r.line, r.pct, r.pct >= 50 ? 'ok' : r.pct >= 15 ? 'hot' : '')).join('')
            : barRow('Transfer til partnere', 58, 'ok') +
              barRow('HQ Danmark', 16, 'hot') +
              barRow('Øvrigt program / global', 24, '') +
              barRow('IPE (oplysning)', 2, '')
        }
        <p class="meta" style="margin-top:1rem">
          <a href="#/sag/ms-actionaid">Sag</a> ·
          <a href="https://ms.dk/api/media/file/AADK%20SPAII%20REPORT%20_2025.pdf" target="_blank" rel="noopener">PDF ↗</a>
        </p>
      </div>
      <div class="panel">
        <h2 style="margin-top:0">Oxfam Danmark 2025</h2>
        <p class="muted" style="margin-bottom:1rem">
          Change objectives (andel af SPA-aktivitet).
          ${oxPartnerPct != null ? `Landemidler til lokale partnere: <strong>${oxPartnerPct}%</strong>.` : ''}
        </p>
        ${
          oxObj.length
            ? oxObj
                .map((o) => {
                  const pct = parseFloat(String(o.budgetShareApprox).replace('%', '')) || 0;
                  return barRow(o.name, pct, pct >= 40 ? 'ok' : pct >= 30 ? 'hot' : '');
                })
                .join('')
            : barRow('Leaving No-One Behind', 47, 'ok') +
              barRow('Just Societies', 36, 'hot') +
              barRow('Climate Justice', 17, '')
        }
        <p class="meta" style="margin-top:1rem">
          <a href="#/sag/oxfam-spa">Sag</a> ·
          <a href="https://oxfam.dk/wp-content/uploads/2026/07/Oxfam_Denmark_Results_Report-2025.pdf" target="_blank" rel="noopener">PDF ↗</a>
        </p>
      </div>
    </div>
    ${
      d.deepDive?.comparison?.points?.length
        ? `<div class="panel" style="margin-top:1rem">
            <h2>Kort sagt</h2>
            ${d.deepDive.comparison.points.map((p) => `<p>· ${esc(p)}</p>`).join('')}
          </div>`
        : ''
    }

    <div class="section-head" id="tidslinje" style="margin-top:2rem"><h2>Tidslinje</h2></div>
    <div class="timeline">
      ${tl
        .map(
          (e) => `
        <div class="tl-item">
          <time>${esc(e.date)}</time>
          <div>
            <strong>${esc(e.title)}</strong>
            <p>${esc(e.text)}</p>
          </div>
        </div>`
        )
        .join('')}
    </div>
    <p class="meta" style="margin-top:1rem"><a href="#/grav">Udvidet undersøgelse →</a></p>
  `;
}

function renderOm(d) {
  const posts = (d.posts?.posts || []).slice(0, 4);
  const glossary = [
    { t: 'Danida', d: 'Danmarks udviklingssamarbejde under Udenrigsministeriet.' },
    { t: 'SPA', d: 'Strategisk partnerskab — fast årlig bevilling til store NGO’er (fx MS 129 mio., Oxfam 103 mio.).' },
    { t: 'CISU', d: 'Civilsamfund i Udvikling — forvalter bl.a. Civilsamfundspuljen og OpEn for UM.' },
    { t: 'OpEn', d: 'Oplysnings- og Engagementspuljen — ofte projekter i Danmark (podcasts, marches, content).' },
    { t: 'Officiel', d: 'Tal fra UM, CISU, regnskab eller lign. primær kilde.' },
    { t: 'Claim', d: 'Påstand fra research (X m.m.) — under eller efter verifikation.' },
  ];
  return `
    <section class="hero">
      <h1>Om</h1>
      <p>
        Uafhængig, borgerlig research. Kilder:
        <a href="https://x.com/oresundsbaron" target="_blank" rel="noopener">@oresundsbaron</a>,
        <a href="https://x.com/MikeHuntHurts89" target="_blank" rel="noopener">@MikeHuntHurts89</a>,
        <a href="https://x.com/Statsstyret" target="_blank" rel="noopener">@Statsstyret</a>
        + UM, CISU og regnskaber.
      </p>
    </section>

    <div class="section-head"><h2>Ordliste</h2></div>
    <div class="grid cols-2">
      ${glossary
        .map(
          (g) => `
        <div class="card">
          <h3>${esc(g.t)}</h3>
          <p class="blurb">${esc(g.d)}</p>
        </div>`
        )
        .join('')}
    </div>

    <div class="panel" style="margin-top:1.25rem">
      <h2>Sådan læser du mærker</h2>
      <p><span class="badge ok">Officiel</span> primær kilde ·
         <span class="badge hot">Claim</span> research ·
         <span class="badge warn">Estimat</span> afrundet serie</p>
    </div>

    <div class="panel">
      <h2>3.800 vs 10.000 kr.</h2>
      <p><strong>3.800</strong> = pr. indbygger. <strong>10.000</strong> = BT: skattelettelse ved gennemsnitsindkomst hvis bistand → bundskat.</p>
      <p><a href="https://www.bt.dk/debat/bt-mener-afskaf-ulandsbistanden" target="_blank" rel="noopener">BT-leder ↗</a></p>
    </div>

    <div class="panel" style="text-align:center">
      <p class="badge warn">Aktindsigt · kommer snart</p>
      <p class="muted" style="margin:.5rem 0 0">Flere originale dokumenter fra myndighederne. <a href="#/aktindsigt">Status →</a></p>
    </div>

    <div class="section-head" id="tip"><h2>Indsend tip</h2></div>
    <div class="panel">
      <p class="muted" style="margin:0 0 1rem">
        Har du et CISU-link, regnskab eller en sag, vi bør tjekke?
        Tips lander som <strong>GitHub Issue</strong> (gratis, ingen Gmail) — du kan være anonym via throwaway GitHub-konto.
      </p>
      <form class="tip-form" id="tip-form">
        <label>Emne
          <input name="topic" type="text" placeholder="Fx org-navn + beløb" required maxlength="120" />
        </label>
        <label>Hvad skal vi se på?
          <textarea name="body" placeholder="Kort beskrivelse…" required maxlength="2000"></textarea>
        </label>
        <label>Kilde / link (valgfri)
          <input name="source" type="url" placeholder="https://…" />
        </label>
        <button type="submit">Send tip via GitHub</button>
      </form>
    </div>

    ${
      posts.length
        ? `<div class="section-head"><h2>Fra X</h2></div>
           <div class="grid">${posts
             .map(
               (p) => `
             <article class="post">
               <span class="who">@${esc(p.author)}</span><time>${esc(p.date)}</time>
               <p>${esc(p.excerpt)}</p>
               <div class="links"><a href="${esc(p.url)}" target="_blank" rel="noopener">Åbn ↗</a></div>
             </article>`
             )
             .join('')}</div>`
        : ''
    }
  `;
}

async function paint() {
  let { page, id } = route();
  // Aliases → clean structure
  if (page === 'udforsk') page = 'projekter';
  if (page === 'tal') page = 'indsigt';
  if (page === 'foi') page = 'aktindsigt';

  setNav(page);

  try {
    const d = await loadAll();
    let html;
    if (page === 'projekter') html = renderProjects(d);
    else if (page === 'projekt' && id) html = renderProject(d, id);
    else if (page === 'sager') html = renderCases(d);
    else if (page === 'sag' && id) html = renderCase(d, id);
    else if (page === 'open' || page === 'katalog') html = renderOpen(d);
    else if (page === 'cvr' || page === 'regnskab') html = renderCvr(d);
    else if (page === 'indsigt') html = renderIndsigt(d);
    else if (page === 'grav' || page === 'undersogelse') html = renderGrav(d);
    else if (page === 'aktindsigt') html = renderAktindsigt();
    else if (page === 'om' || page === 'metode' || page === 'opslag') html = renderOm(d);
    else html = renderHome(d);
    app.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    bindShare();
    bindTipForm();
    bindPageJump();
    if (page === 'projekter') bindProjectFilter(d.projects.projects);
    if (page === 'open' || page === 'katalog') bindOpenFilter(d.openGrants?.grants || []);
  } catch (e) {
    app.innerHTML = `
      <p class="error">
        Kunne ikke hente projektdata (${esc(e.message)}).
        Tællerne ovenfor viser stadig standardtal.
        Prøv hard refresh.
      </p>`;
  }
}

window.addEventListener('hashchange', paint);
paint();
