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

function route() {
  const raw = (location.hash || '#/').replace(/^#\/?/, '');
  const [page, id] = raw.split('/');
  return { page: page || 'home', id };
}

function setNav(page) {
  document.querySelectorAll('.nav a').forEach((a) => {
    const key = a.getAttribute('data-nav');
    a.classList.toggle('active', key === page || (page === 'projekt' && key === 'projekter') || (page === 'sag' && key === 'sager'));
  });
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
}

// Ensure stats never empty — run immediately with fallback
applyStats(FALLBACK_AID);

let cache = null;

async function loadAll() {
  if (cache) return cache;
  try {
    const [aid, projects, cases, posts, sourceMap, openGrants, orgRank, miniSerie, partners, media, deepDive] =
      await Promise.all([
        fetchJson('data/aid-totals.json').catch(() => FALLBACK_AID),
        fetchJson('data/projects.json'),
        fetchJson('data/cases.json'),
        fetchJson('data/posts.json'),
        fetchJson('data/source-map.json').catch(() => null),
        fetchJson('data/cisu-open-grants.json').catch(() => null),
        fetchJson('data/cisu-org-rank.json').catch(() => null),
        fetchJson('data/ngo-miniserie-status.json').catch(() => null),
        fetchJson('data/strategic-partners.json').catch(() => null),
        fetchJson('data/media-validation.json').catch(() => null),
        fetchJson('data/partner-deep-dive.json').catch(() => null),
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

function renderHome(d) {
  const projects = [...d.projects.projects]
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

    <div class="chips">
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
      <h2>Verificerede hits</h2>
      <a href="#/grav">Fuld undersøgelse →</a>
    </div>
    <div class="chips" style="margin-bottom:1.5rem">
      <div class="chip" style="grid-template-columns:1fr">
        <div class="chip-home"><strong>CISU bekræftet</strong> · Barnevogn 1.498.642 kr · BIO RAP 797.786 kr · Kaffestop 149.200 kr · Kunstfond-runde 29,3 mio.</div>
      </div>
      <div class="chip" style="grid-template-columns:1fr">
        <div class="chip-home"><strong>BT Borgerlig Tabloid</strong> · Baronen interviewet 3. aug. 2026 — <a href="#/sag/bt-mediedækning" style="color:#fda4a4">læs om mediedækningen</a></div>
      </div>
    </div>

    <div class="section-head">
      <h2>Projekter</h2>
      <a href="#/projekter">Se alle →</a>
    </div>
    <div class="grid cols-3">
      ${projects.map(projectCard).join('')}
    </div>
  `;
}

function renderProjects(d) {
  const projects = [...d.projects.projects].sort((a, b) => b.amountDkk - a.amountDkk);
  return `
    <section class="hero">
      <h1>Projekter</h1>
      <p>${projects.length} poster. Hvad gik pengene til — og hvem fik dem?</p>
    </section>
    <div class="grid cols-2">
      ${projects.map(projectCard).join('')}
    </div>
  `;
}

function renderProject(d, id) {
  const p = d.projects.projects.find((x) => x.id === id);
  if (!p) {
    return `<a class="back" href="#/projekter">← Projekter</a><p class="error">Projekt ikke fundet.</p>`;
  }
  return `
    <a class="back" href="#/projekter">← Projekter</a>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.35rem">
      ${badge(p.amountKind)}
    </div>
    <h1 style="margin:0;font-size:clamp(1.5rem,3.5vw,2rem);letter-spacing:-.03em">${esc(p.title)}</h1>
    <p class="detail-amt">${esc(fmtKr(p.amountDkk))}</p>

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
  return `
    <section class="hero">
      <h1>Sager</h1>
      <p>Samlede forløb — flere projekter og opslag i samme tråd.</p>
    </section>
    <div class="grid cols-2">
      ${cases
        .map(
          (c) => `
        <a class="card" href="#/sag/${esc(c.slug)}">
          <div class="card-top">
            ${badge(c.amountKind)}
            <span class="amt">${esc(c.amountLabel)}</span>
          </div>
          <h3>${esc(c.title)}</h3>
          <p class="blurb">${esc(c.summary)}</p>
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
  return `
    <a class="back" href="#/sager">← Sager</a>
    <div style="display:flex;gap:.5rem;margin-bottom:.35rem">${badge(c.amountKind)}</div>
    <h1 style="margin:0;font-size:clamp(1.5rem,3.5vw,2rem);letter-spacing:-.03em">${esc(c.title)}</h1>
    <p class="detail-amt">${esc(c.amountLabel)}</p>
    <div class="panel"><h2>Kort</h2><p>${esc(c.summary)}</p></div>
    <div class="panel"><h2>Vinkel</h2><p>${esc(c.angle)}</p></div>
    <div class="panel">
      <h2>${esc(depth.headline || 'Dybde')}</h2>
      ${(depth.body || [])
        .map((p) => `<p>${esc(p).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`)
        .join('')}
    </div>
    <div class="panel">
      <h2>Kilder</h2>
      <ul class="sources">
        ${(depth.sources || [])
          .map(
            (s) =>
              `<li>${badge(s.kind === 'official' ? 'official' : 'claim')}
              <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a></li>`
          )
          .join('')}
      </ul>
    </div>
    ${
      related.length
        ? `<div class="section-head" style="margin-top:1.5rem"><h2>Projekter</h2></div>
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

function renderOpen(d) {
  const og = d.openGrants;
  if (!og?.grants?.length) {
    return `<section class="hero"><h1>OpEn-katalog</h1><p class="error">Kunne ikke loade data/cisu-open-grants.json</p></section>`;
  }
  const top = og.grants.slice(0, 60);
  const orgs = (d.orgRank?.orgs || []).slice(0, 12);
  return `
    <section class="hero">
      <h1>OpEn-katalog</h1>
      <p>
        <strong>${og.countWithAmount}</strong> CISU-bevillinger (OpEn + udvalgte matches) med beløb.
        Sum i kataloget: <strong style="color:#fda4a4">${esc(fmtShort(og.sumAmountDkk))} kr.</strong>
        — det er oplysning/engagement-sporet, ikke hele de 23 mia.
      </p>
    </section>
    ${
      orgs.length
        ? `<div class="section-head"><h2>Største modtagere (i kataloget)</h2></div>
           <div class="grid cols-3">
           ${orgs
             .map(
               (o) => `
             <div class="card">
               <div class="card-top"><span class="badge ok">${o.count} poster</span>
               <span class="amt">${esc(fmtShort(o.sumDkk))}</span></div>
               <h3>${esc(o.org)}</h3>
               <p class="blurb">${esc((o.examples || [])[0] || '')}</p>
             </div>`
             )
             .join('')}
           </div>`
        : ''
    }
    <div class="section-head" style="margin-top:1.5rem"><h2>Bevillinger (sorteret efter beløb)</h2></div>
    <div class="grid cols-2">
      ${top
        .map(
          (g) => `
        <a class="card" href="${esc(g.url)}" target="_blank" rel="noopener">
          <div class="card-top">
            <span class="badge ok">CISU</span>
            <span class="amt">${esc(fmtShort(g.amountDkk))}</span>
          </div>
          <h3>${esc(g.title)}</h3>
          <p class="blurb">${esc(g.resume || g.pool || '')}</p>
          <p class="meta">${esc(g.org || '?')} · CISU ↗</p>
        </a>`
        )
        .join('')}
    </div>
    <p class="muted" style="margin-top:1rem">Viser top 60 af ${og.countWithAmount}. Fuld JSON i repo: data/cisu-open-grants.json</p>
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

function renderOm(d) {
  const posts = (d.posts?.posts || []).slice(0, 5);
  return `
    <section class="hero">
      <h1>Om Skattejægeren</h1>
      <p>
        Uafhængig, borgerlig research-side. Vi starter med
        <a href="https://x.com/oresundsbaron" target="_blank" rel="noopener">@oresundsbaron</a>,
        <a href="https://x.com/MikeHuntHurts89" target="_blank" rel="noopener">@MikeHuntHurts89</a>
        og <a href="https://x.com/Statsstyret" target="_blank" rel="noopener">@Statsstyret</a>
        — plus officielle kilder (UM, CISU).
      </p>
    </section>
    <div class="panel">
      <h2>Sådan læser du tallene</h2>
      <p><span class="badge ok">Officiel</span> = primær kilde (UM, CISU osv.)</p>
      <p style="margin-top:.5rem"><span class="badge hot">Claim</span> = fra research — under verifikation</p>
      <p style="margin-top:.5rem"><span class="badge warn">Estimat</span> = summeret/afrundet serie</p>
    </div>
    <div class="panel">
      <h2>Tællerne</h2>
      <p><strong>2026:</strong> ca. 23,2 mia. kr. samlet udviklingsbistand (rapporteret).</p>
      <p><strong>10 år:</strong> ca. 187 mia. (2016–2025, afrundet).</p>
      <p><strong>Pr. indbygger:</strong> ca. <strong>3.800 kr.</strong> (23,2 mia. ÷ ca. 6,1 mio. danskere).</p>
      <p><strong>BT 10.000 kr.:</strong> Joachim B. Olsen / <em>B.T. mener</em> (4. aug. 2026): hvis bistanden afskaffes og bruges til <strong>lavere bundskat</strong>, får en person med <strong>gennemsnitsindkomst</strong> ca. 10.000 kr. i skattelettelse om året — <em>ikke</em> det samme som pr. indbygger. 23 mia. ÷ ca. 2,3 mio. fuldtidsbeskæftigede ≈ 10.000 kr.</p>
      <p><a href="https://www.bt.dk/debat/bt-mener-afskaf-ulandsbistanden" target="_blank" rel="noopener">BT-leder ↗</a></p>
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
  const { page, id } = route();
  setNav(page === 'home' ? 'home' : page);

  try {
    const d = await loadAll();
    let html;
    if (page === 'projekter') html = renderProjects(d);
    else if (page === 'projekt' && id) html = renderProject(d, id);
    else if (page === 'sager') html = renderCases(d);
    else if (page === 'sag' && id) html = renderCase(d, id);
    else if (page === 'open' || page === 'katalog') html = renderOpen(d);
    else if (page === 'grav' || page === 'undersogelse') html = renderGrav(d);
    else if (page === 'aktindsigt' || page === 'foi') html = renderAktindsigt(d);
    else if (page === 'om' || page === 'metode' || page === 'opslag') html = renderOm(d);
    else html = renderHome(d);
    app.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  } catch (e) {
    app.innerHTML = `
      <p class="error">
        Kunne ikke hente projektdata (${esc(e.message)}).
        Tællerne ovenfor viser stadig standardtal.
        Prøv hard refresh — eller åbn via
        <a href="https://mattomadsen.github.io/skattejaegeren/">GitHub Pages</a>.
      </p>`;
  }
}

window.addEventListener('hashchange', paint);
paint();
