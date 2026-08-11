const app = document.getElementById('app');

const fmtMia = (n) => {
  if (n >= 1e9) return (n / 1e9).toLocaleString('da-DK', { maximumFractionDigits: 1 }) + ' mia. kr.';
  if (n >= 1e6) return (n / 1e6).toLocaleString('da-DK', { maximumFractionDigits: 1 }) + ' mio. kr.';
  return n.toLocaleString('da-DK') + ' kr.';
};
const fmtKr = (n) => n.toLocaleString('da-DK') + ' kr.';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pill(kind) {
  if (kind === 'official' || kind === 'reported') return '<span class="pill off">Officiel / rapporteret</span>';
  if (kind === 'estimate') return '<span class="pill gold">Estimat</span>';
  return '<span class="pill cl">Claim</span>';
}

function route() {
  const h = (location.hash || '#/').replace(/^#\/?/, '');
  const [page, id] = h.split('/');
  return { page: page || 'home', id };
}

let data = null;

async function load() {
  const [aid, projects, cases, posts] = await Promise.all([
    fetch('data/aid-totals.json').then((r) => r.json()),
    fetch('data/projects.json').then((r) => r.json()),
    fetch('data/cases.json').then((r) => r.json()),
    fetch('data/posts.json').then((r) => r.json()),
  ]);
  return { aid, projects, cases, posts };
}

function fillTicker(aid) {
  document.getElementById('tick-year').textContent = aid.thisYear.label;
  document.getElementById('tick-10').textContent = aid.last10Years.label;
  document.getElementById('tick-all').textContent = aid.since2015.label;
  document.getElementById('tick-per').textContent =
    'ca. ' + aid.perDaneThisYear.amountDkk.toLocaleString('da-DK') + ' kr.';
  document.getElementById('tick-note').textContent =
    'Tal er afrundede. Se metode. Kilder: finanslov/Globalnyt/OpenAid-serier. Ikke “al tid i historien” — ca. siden 2015 for den lange tæller.';
}

function projectCard(p) {
  return `
    <a class="card" href="#/projekt/${esc(p.id)}">
      <div class="card-meta">
        ${pill(p.amountKind)}
        <span class="money">${esc(fmtKr(p.amountDkk))}</span>
      </div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.whatFor.slice(0, 160))}${p.whatFor.length > 160 ? '…' : ''}</p>
      <p style="margin-top:.65rem;font-size:.85rem;color:var(--muted)">${esc(p.org)} · ${esc(p.country || '—')}</p>
    </a>`;
}

function postCard(p) {
  return `
    <article class="card post-card">
      <div class="card-meta">
        <span class="who">@${esc(p.author)}</span>
        <time>${esc(p.date)}</time>
      </div>
      <p>${esc(p.excerpt)}</p>
      <div class="post-foot">
        <a href="${esc(p.url)}" target="_blank" rel="noopener">Åbn på X ↗</a>
        ${(p.cases || []).map((c) => `<a class="tag" href="#/sag/${esc(c)}">${esc(c)}</a>`).join('')}
      </div>
    </article>`;
}

function renderHome(d) {
  app.classList.add('wide');
  const projects = d.projects.projects.slice().sort((a, b) => b.amountDkk - a.amountDkk);
  const contrasts = d.aid.homeContrast || [];
  return `
    <p class="eyebrow">Borgerlig research · kvitteringer · prioriteter</p>
    <h1>Vi har råd til kaffestop i Rwanda.<br>Hjemme mangler kommunerne penge.</h1>
    <p class="lead">
      <strong>Skattejægeren</strong> samler projekter og sager fra ulandsbistand og beslægtet statsforbrug.
      Hvad gik pengene til? Hvem fik dem? Og hvorfor er der altid råd derude, når der er knaphed herhjemme?
      Research starter med
      <a href="https://x.com/oresundsbaron" target="_blank" rel="noopener">@oresundsbaron</a>,
      <a href="https://x.com/MikeHuntHurts89" target="_blank" rel="noopener">@MikeHuntHurts89</a>
      og <a href="https://x.com/Statsstyret" target="_blank" rel="noopener">@Statsstyret</a>
      — plus officielle kilder.
    </p>

    <section class="contrast">
      <h2>Samme skatteyder. Forskellig prioritet.</h2>
      ${contrasts
        .map(
          (c) => `
        <div class="contrast-row">
          <div class="contrast-home">${esc(c.home)}</div>
          <div class="contrast-away">${esc(c.abroad)}</div>
          <div class="contrast-src">${esc(c.source)}</div>
        </div>`
        )
        .join('')}
    </section>

    <h2>Projekter vi har gravet i</h2>
    <p class="lead" style="margin-top:-.35rem">Klik ind for formål, beløb og kilder. <span class="pill off">Officiel</span> vs <span class="pill cl">Claim</span>.</p>
    <div class="grid two">${projects.map(projectCard).join('')}</div>
    <div class="actions">
      <a class="btn primary" href="#/projekter">Alle projekter</a>
      <a class="btn" href="#/sager">Sagsmapper</a>
      <a class="btn" href="#/metode">Metode & tal</a>
    </div>
  `;
}

function renderProjects(d) {
  app.classList.add('wide');
  const projects = d.projects.projects.slice().sort((a, b) => b.amountDkk - a.amountDkk);
  const sum = projects.reduce((s, p) => s + p.amountDkk, 0);
  return `
    <p class="eyebrow">Projektkatalog</p>
    <h1>Hvad blev pengene brugt til?</h1>
    <p class="lead">
      ${projects.length} poster i arkivet. Sum af listede beløb:
      <strong class="money">${esc(fmtMia(sum))}</strong>
      (mange er delmængder / claims — læs markering).
    </p>
    <div class="grid two">${projects.map(projectCard).join('')}</div>
  `;
}

function renderProject(d, id) {
  app.classList.remove('wide');
  const p = d.projects.projects.find((x) => x.id === id);
  if (!p) return `<h1>Ikke fundet</h1><p><a href="#/projekter">← Projekter</a></p>`;
  return `
    <p class="crumb"><a href="#/projekter">Projekter</a> / ${esc(p.id)}</p>
    <div class="card-meta">${pill(p.amountKind)}</div>
    <h1>${esc(p.title)}</h1>
    <span class="money lg">${esc(fmtKr(p.amountDkk))}</span>
    ${p.amountNote ? `<p class="lead">${esc(p.amountNote)}</p>` : ''}

    <ul class="meta-list">
      <li><span>Organisation</span><div>${esc(p.org)}</div></li>
      <li><span>Pulje</span><div>${esc(p.pool)}</div></li>
      <li><span>Land</span><div>${esc(p.country || '—')}</div></li>
      ${p.period ? `<li><span>Periode</span><div>${esc(p.period)}</div></li>` : ''}
      <li><span>Gravet af</span><div>${esc((p.researchers || []).map((r) => '@' + r).join(', ') || '—')}</div></li>
    </ul>

    <div class="angle-box"><strong>Borgerlig vinkel:</strong> ${esc(p.angle)}</div>

    <h2>Hvad gik pengene til?</h2>
    <div class="prose"><p>${esc(p.whatFor)}</p></div>

    <h2>Kilder</h2>
    <ul class="sources">
      ${(p.sources || [])
        .map(
          (s) =>
            `<li>${pill(s.kind === 'official' ? 'official' : s.kind === 'org' ? 'estimate' : 'claim')}
            <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`
        )
        .join('')}
    </ul>
    ${
      p.caseSlug
        ? `<div class="actions"><a class="btn" href="#/sag/${esc(p.caseSlug)}">Relateret sag →</a></div>`
        : ''
    }
  `;
}

function renderCases(d) {
  app.classList.add('wide');
  const cases = [...d.cases.cases].sort((a, b) => a.priority - b.priority);
  return `
    <p class="eyebrow">Sagsmapper</p>
    <h1>Sager — dybere end ét tweet</h1>
    <p class="lead">Flere opslag og projekter samlet. Dybde er manuelt godkendt.</p>
    <div class="grid two">
      ${cases
        .map(
          (c) => `
        <a class="card" href="#/sag/${esc(c.slug)}">
          <div class="card-meta">${pill(c.amountKind)} <span class="money">${esc(c.amountLabel)}</span></div>
          <h3>${esc(c.title)}</h3>
          <p>${esc(c.summary)}</p>
        </a>`
        )
        .join('')}
    </div>
  `;
}

function renderCase(d, slug) {
  app.classList.remove('wide');
  const c = d.cases.cases.find((x) => x.slug === slug);
  if (!c) return `<h1>Ikke fundet</h1>`;
  const depth = c.depth || {};
  const relatedProjects = d.projects.projects.filter((p) => p.caseSlug === slug);
  const relatedPosts = d.posts.posts.filter((p) => (p.cases || []).includes(slug));
  return `
    <p class="crumb"><a href="#/sager">Sager</a> / ${esc(c.slug)}</p>
    <div class="card-meta">${pill(c.amountKind)}</div>
    <h1>${esc(c.title)}</h1>
    <span class="money lg">${esc(c.amountLabel)}</span>
    <p class="lead">${esc(c.summary)}</p>
    <div class="angle-box"><strong>Vinkel:</strong> ${esc(c.angle)}</div>

    <h2>${esc(depth.headline || 'Dybde')}</h2>
    <div class="prose">
      ${(depth.body || []).map((p) => `<p>${esc(p).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`).join('')}
    </div>

    <h2>Kilder</h2>
    <ul class="sources">
      ${(depth.sources || [])
        .map(
          (s) =>
            `<li>${pill(s.kind === 'official' ? 'official' : 'claim')}
            <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`
        )
        .join('')}
    </ul>

    ${
      relatedProjects.length
        ? `<h2>Projekter i sagen</h2><div class="grid">${relatedProjects.map(projectCard).join('')}</div>`
        : ''
    }
    ${
      relatedPosts.length
        ? `<h2>Opslag</h2><div class="grid">${relatedPosts.map(postCard).join('')}</div>`
        : ''
    }
  `;
}

function renderPosts(d) {
  app.classList.remove('wide');
  return `
    <p class="eyebrow">Opslag</p>
    <h1>Research på X</h1>
    <p class="lead">Korte uddrag. Læs originalen — vi spejler ikke hele feedet.</p>
    <div class="grid">${d.posts.posts.map(postCard).join('')}</div>
  `;
}

function renderMetode(d) {
  app.classList.remove('wide');
  const a = d.aid;
  return `
    <p class="eyebrow">Metode</p>
    <h1>Tal, kilder og godkendelse</h1>
    <div class="prose">
      <p><strong>Vinkel:</strong> Tydeligt borgerlig. Vi spørger hvad skattekroner går til, og stiller det op imod knaphed i Danmark.</p>
      <p><strong>Kilder nu:</strong> @oresundsbaron (primær), @MikeHuntHurts89, @Statsstyret + officielle sider (UM, CISU, OpEn).</p>
      <p><strong>Manuel godkendelse:</strong> Dybde-tekster publiceres først efter review. Claims er røde. Officielle tal er grønne.</p>
    </div>
    <h2>Tællerne i toppen</h2>
    <ul class="meta-list">
      <li><span>I år</span><div>${esc(a.thisYear.label)} — ${esc(a.thisYear.note)} ${pill(a.thisYear.kind)}</div></li>
      <li><span>10 år</span><div>${esc(a.last10Years.label)} — ${esc(a.last10Years.note)} ${pill(a.last10Years.kind)}</div></li>
      <li><span>Siden 2015</span><div>${esc(a.since2015.label)} — ${esc(a.since2015.note)} ${pill(a.since2015.kind)}</div></li>
      <li><span>Pr. dansker</span><div>${esc(a.perDaneThisYear.note)}</div></li>
    </ul>
    <p class="lead">«I alt i historien» kræver længere OECD-serie — den kommer senere. Indtil da: ærlige estimater med kilde.</p>
  `;
}

async function paint() {
  try {
    if (!data) {
      data = await load();
      fillTicker(data.aid);
    }
    const { page, id } = route();
    let html;
    if (page === 'projekter') html = renderProjects(data);
    else if (page === 'projekt' && id) html = renderProject(data, id);
    else if (page === 'sager') html = renderCases(data);
    else if (page === 'sag' && id) html = renderCase(data, id);
    else if (page === 'opslag') html = renderPosts(data);
    else if (page === 'metode') html = renderMetode(data);
    else html = renderHome(data);
    app.innerHTML = html;
    window.scrollTo(0, 0);
  } catch (e) {
    app.innerHTML = `<h1>Kunne ikke loade data</h1><p class="lead">${esc(e.message)}. Åbn via lokal server eller GitHub Pages.</p>`;
  }
}

// Add Mike posts to posts if not already - done in data update below via separate file write

window.addEventListener('hashchange', paint);
paint();
