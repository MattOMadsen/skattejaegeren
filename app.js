const app = document.getElementById('app');

function money(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(3).replace(/\.?0+$/, '') + ' mia.';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + ' mio.';
  if (n >= 1e3) return Math.round(n / 1e3) + ' tkr.';
  return String(n);
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function kindBadge(kind) {
  const k = kind === 'official' ? 'official' : 'claim';
  const label = kind === 'official' ? 'Officiel kilde' : 'Claim — verificeres';
  return `<span class="pill ${k}">${label}</span>`;
}

async function loadData() {
  const [casesRes, postsRes] = await Promise.all([
    fetch('data/cases.json'),
    fetch('data/posts.json'),
  ]);
  if (!casesRes.ok || !postsRes.ok) throw new Error('Kunne ikke hente data');
  return {
    cases: await casesRes.json(),
    posts: await postsRes.json(),
  };
}

function route() {
  const h = location.hash.replace(/^#\/?/, '') || '';
  const [page, slug] = h.split('/');
  return { page: page || 'home', slug };
}

function renderHome(data) {
  const cases = [...data.cases.cases].sort((a, b) => a.priority - b.priority);
  const sumOfficial = cases
    .filter((c) => c.amountKind === 'official')
    .reduce((s, c) => s + (c.amountDkk || 0), 0);
  const t = data.cases.totals;

  return `
    <p class="kicker">Borgerlig research · dine skattekroner · kilder eller flag</p>
    <h1>Følg pengene. Ikke spinnet.</h1>
    <p class="lead">
      Skattejægeren samler research om <strong>ulandsbistand, Danida, puljer og statsstøtte</strong>
      — starter med <a href="https://x.com/oresundsbaron" target="_blank" rel="noopener">@oresundsbaron</a>,
      suppleret af bl.a. <a href="https://x.com/Statsstyret" target="_blank" rel="noopener">@Statsstyret</a>.
      Vi graver dybere i sagerne med primærkilder, hvor det findes.
    </p>

    <div class="stats">
      <div class="stat">
        <div class="stat-n">${esc(money(t.strategicPartnershipsAnnualDkk))} kr.</div>
        <div class="stat-l">Strategiske partnerskaber / år <span class="pill official">officiel</span></div>
      </div>
      <div class="stat">
        <div class="stat-n">${esc(money(t.openPuljeWithCivilClaim2026Dkk))} kr.</div>
        <div class="stat-l">Civilsamfund + OpEn 2026 <span class="pill claim">claim</span></div>
      </div>
      <div class="stat">
        <div class="stat-n">${cases.length}</div>
        <div class="stat-l">Aktive sagsmapper (manuelt godkendt)</div>
      </div>
    </div>

    <div class="banner">
      <strong>Hvorfor det ikke er “småpenge”:</strong>
      Alene de strategiske partnerskaber er <strong>1,264 mia. kr. om året</strong> (UM).
      Baronens 221 mio. til Civilsamfund/OpEn er oveni. Og så er der resten af de ~23 mia. i udviklingsbistand.
    </div>

    <h2 class="section-title">Sager</h2>
    <div class="cards">
      ${cases.map((c) => caseCard(c)).join('')}
    </div>

    <h2 class="section-title">Seneste opslag i arkivet</h2>
    <div class="posts">
      ${data.posts.posts.slice(0, 5).map((p) => postCard(p)).join('')}
    </div>
    <p class="more"><a class="btn" href="#/opslag">Alle opslag →</a></p>
  `;
}

function caseCard(c) {
  return `
    <a class="card case-card" href="#/sag/${esc(c.slug)}">
      <div class="card-top">
        ${kindBadge(c.amountKind)}
        <span class="amount">${esc(c.amountLabel)}</span>
      </div>
      <h3>${esc(c.title)}</h3>
      <p>${esc(c.summary)}</p>
      <span class="go">Åbn sag →</span>
    </a>
  `;
}

function postCard(p) {
  return `
    <article class="card post-card">
      <div class="card-top">
        <span class="author">@${esc(p.author)}</span>
        <time>${esc(p.date)}</time>
      </div>
      <p>${esc(p.excerpt)}</p>
      <div class="post-meta">
        <span>${p.likes ?? 0} likes</span>
        <a href="${esc(p.url)}" target="_blank" rel="noopener">Åbn på X ↗</a>
        ${
          (p.cases || [])
            .map((s) => `<a class="tag" href="#/sag/${esc(s)}">${esc(s)}</a>`)
            .join('')
        }
      </div>
    </article>
  `;
}

function renderCases(data) {
  const cases = [...data.cases.cases].sort((a, b) => a.priority - b.priority);
  return `
    <p class="kicker">Sagsmapper</p>
    <h1>Alle sager</h1>
    <p class="lead">Hver sag samler opslag, beløb og dybde-noter. Dybde er <strong>manuelt godkendt</strong>.</p>
    <div class="cards">${cases.map((c) => caseCard(c)).join('')}</div>
  `;
}

function renderPosts(data) {
  return `
    <p class="kicker">Opslag</p>
    <h1>Research-opslag</h1>
    <p class="lead">Korte uddrag + link til original. Primært Baronen; Statsstyret med på MS-sagen.</p>
    <div class="posts">${data.posts.posts.map((p) => postCard(p)).join('')}</div>
  `;
}

function renderCase(data, slug) {
  const c = data.cases.cases.find((x) => x.slug === slug);
  if (!c) {
    return `<h1>Sag ikke fundet</h1><p><a href="#/sager">← Tilbage</a></p>`;
  }
  const related = data.posts.posts.filter((p) => (p.cases || []).includes(c.slug));
  const d = c.depth || {};
  return `
    <p class="kicker"><a href="#/sager">Sager</a> / ${esc(c.slug)}</p>
    <h1>${esc(c.title)}</h1>
    <div class="case-hero">
      <div>
        ${kindBadge(c.amountKind)}
        <div class="big-amount">${esc(c.amountLabel)}</div>
      </div>
      <p class="lead" style="margin:0">${esc(c.summary)}</p>
    </div>

    <div class="angle">
      <strong>Borgerlig vinkel:</strong> ${esc(c.angle)}
    </div>

    <section class="depth">
      <h2>${esc(d.headline || 'Dybde')}</h2>
      <p class="pill-row"><span class="pill official">Manuelt godkendt dybde</span>
      ${d.status === 'approved' ? '' : '<span class="pill claim">Afventer</span>'}</p>
      ${(d.body || []).map((p) => `<p class="depth-p">${formatMd(p)}</p>`).join('')}
      <h3>Kilder</h3>
      <ul class="sources">
        ${(d.sources || [])
          .map(
            (s) =>
              `<li><span class="pill ${s.kind === 'official' ? 'official' : 'claim'}">${esc(s.kind)}</span>
              <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`
          )
          .join('')}
      </ul>
    </section>

    <h2 class="section-title">Relaterede opslag</h2>
    <div class="posts">${related.map((p) => postCard(p)).join('') || '<p class="muted">Ingen endnu.</p>'}</div>
  `;
}

function formatMd(text) {
  // very small subset: **bold**
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/•/g, '•');
}

function renderMetode(data) {
  const ed = data.cases.editorial || {};
  return `
    <p class="kicker">Metode</p>
    <h1>Sådan arbejder vi</h1>
    <div class="cards single">
      <section class="card">
        <h3>1. Primær start: Baronen</h3>
        <p>Vi starter med research fra <strong>@oresundsbaron</strong>. Flere kilder kommer (X, Facebook m.m.) — men ikke før basen er solid.</p>
      </section>
      <section class="card">
        <h3>2. Allerede inde: Statsstyret</h3>
        <p><strong>@Statsstyret</strong> har aktindsigt om MS/ActionAid. MikeHunt: handle skal bekræftes, så indlæses sager.</p>
      </section>
      <section class="card">
        <h3>3. Manuel godkendelse</h3>
        <p>Dybde-noter publiceres kun efter manuel review. Claims er mærket <span class="pill claim">claim</span>. Officielle tal er mærket <span class="pill official">officiel</span>.</p>
      </section>
      <section class="card">
        <h3>4. Sager &gt; tweets</h3>
        <p>Flere opslag om samme emne samles i én sagsmappe med beløb, vinkel og kilder.</p>
      </section>
      <section class="card">
        <h3>5. Disclaimer</h3>
        <p>${esc(ed.disclaimer || '')}</p>
      </section>
    </div>
    <p class="lead">Se også <a href="https://github.com/MattOMadsen/skattejaegeren/blob/main/PLAN.md">PLAN.md</a> og <code>data/sources-queue.json</code>.</p>
  `;
}

function renderError(err) {
  return `<h1>Fejl</h1><p class="lead">${esc(err.message)}</p>`;
}

let cache = null;

async function paint() {
  try {
    if (!cache) cache = await loadData();
    const { page, slug } = route();
    let html;
    if (page === 'sager') html = renderCases(cache);
    else if (page === 'opslag') html = renderPosts(cache);
    else if (page === 'metode') html = renderMetode(cache);
    else if (page === 'sag' && slug) html = renderCase(cache, slug);
    else html = renderHome(cache);
    app.innerHTML = html;
    window.scrollTo(0, 0);
  } catch (e) {
    app.innerHTML = renderError(e);
  }
}

window.addEventListener('hashchange', paint);
paint();
