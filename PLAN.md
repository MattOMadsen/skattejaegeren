# Skattejægeren — plan (borgerlig vinkel)

**Status:** Afventer godkendelse af plan før fuldt UI-design.  
**Live (placeholder):** GitHub Pages efter deploy  
**Inspirationskilde:** [@oresundsbaron](https://x.com/oresundsbaron) (ikke officiel side)  
**Repo:** `MattOMadsen/skattejaegeren`

---

## 1. Formål

En **tydeligt borgerlig** webplatform der:

1. **Viser** udvalgte research-opslag fra Baronen (og evt. egne sager).  
2. **Graver dybere** automatisk i beløb, puljer, organisationer og kilder.  
3. **Rammer hjem** hos skatteyderen: *dine penge → konkret frås → alternativ (kernevelfærd / skattelettelser)*.  
4. **Dokumenterer** med primærkilder — ikke bare “take”.

Tone: skarp, faktatung, ironisk hvor det passer — **ikke** neutralt bureaukrati-sprog.  
Disclaimer: *Uafhængig side. Ikke tilknyttet Baronen af Øresund.*

---

## 2. Produktprincipper

| Princip | Betydning |
|--------|-----------|
| **Skatteyder først** | Altid oversæt mio. kr. til “pr. dansker / pr. kommune / hvad man kunne have fået” |
| **Kilde eller flag** | Dybde-artikler publiceres kun med mindst 1 primærkilde — ellers “afventer kilde” |
| **Sager, ikke kun tweets** | Flere opslag om samme pulje → én sagsmappe |
| **Borgerlig ærlighed** | Eksplicit politisk vinkel; vi skjuler ikke standpunktet |
| **Hurtig mobil** | X-publikum læser på telefon; 3D er pynt, ikke barriere |

---

## 3. Målgruppe & vinkel

- Primært: borgerlige / liberal-konservative, der følger Baronen eller BT-debat.  
- Budskab: *Ulandsbistand og civilsamfundspuljer er ikke “småpenge”; regningen er din.*  
- Undgå: konspirationstonen; hold dig til **tal, dokumenter, kontraster**.

---

## 4. Informationsarkitektur

### Sider (v1)

| Side | Indhold |
|------|---------|
| **/** Forside | Hero (evt. Three.js), “Seneste bytte”, toppede sager, ticker med mio. kr. |
| **/opslag** | Feed af indhentede X-opslag (filtrer: research / alle) |
| **/sager** | Emnekort: Danida, Civilsamfundspuljen, OpEn, MS, … |
| **/sager/:slug** | Tidslinje + beløb + kilder + “Gå dybere”-notat |
| **/metode** | Hvordan auto-pipeline virker + kildekrav |
| **/om** | Vinkel, disclaimer, kontakt |

### Datamodel (simpel)

```
Post        id, tweet_id, text, media, created_at, tags[], amounts[], orgs[]
Case        slug, title, summary, total_dkk_est, status
CasePost    case_id ↔ post_id
Source      url, title, kind (official|media|other), verified
DepthNote   case_or_post_id, markdown, model, generated_at, sources[]
```

---

## 5. Automatiseringspipeline

```
[cron hver 1–6 t]
    → hent nye posts @oresundsbaron (X API / godkendt metode)
    → klassificér: research | debat | meme/video
    → hvis research:
         udtræk beløb, år, org, pulje
         match/opret Case
         søg primærkilder (UM, Danida/OpenAid, finanslov, Rigsrevisionen)
         generér DepthNote (Grok) med strict “citer kilder”
    → skriv JSON til repo (static) ELLER API på server (gunner)
    → GitHub Pages genbygger / server serverer live
```

### Faseopdeling af automation

| Fase | Leverance | Auto-niveau |
|------|-----------|-------------|
| **A** | Manuel kuratering + statisk JSON | 0 % auto |
| **B** | Auto-hent + tags + beløbs-regex | 50 % |
| **C** | AI-dybde + kilde-søg + case-merge | 80 % |
| **D** | Dashboards, alarmer, flere kilder | 90 % |

**Nu (efter godkendelse):** start **A→B** med flot UI; C når feed er stabilt.

---

## 6. Designretning (godkendes før byg)

**Stemning:** mørk “regnskabsnat” + rød/gul accent (alarm/skat), serif til overskrifter, mono til beløb.  
**Ikke:** rød-hvid DF-klistermærke; mere *finans-exposé / tabloid-research*.

### Three.js (valgfrit lag)

Bruges **kun** hvor det fortæller noget:

| Idé | Beskrivelse |
|-----|-------------|
| **Penge-regn** | Partikler der falder som sedler → “forsvinder” i et hul mærket “Danida / puljer” |
| **Kage der smuldrer** | 23 mia. som 3D-kage; skive “civilsamfund” blinker |
| **Counter-scene** | Tæller der snurrer op i mio. kr. |

Fallback: statisk CSS hvis WebGL mangler / `prefers-reduced-motion`.

### Placeholder live nu

Simpel landing: titel, plan-status, link til X, lille Three.js-demo — **ikke** det endelige look.

---

## 7. Tech stack

| Lag | Valg | Hvorfor |
|-----|------|---------|
| Frontend v1 | Statisk HTML/CSS/JS + Three.js (CDN) | Hurtig Pages |
| Senere | Vite + vanilla eller React | Når sager vokser |
| Data v1 | `data/*.json` i repo | Simpelt, reviewbart |
| Host | **GitHub Pages** (offentlig) | Du vil se live |
| Automation | GitHub Actions **eller** cron på `gunner` | Actions gratis; gunner har Grok allerede |
| AI | Grok via xAI / lokal Grok Build | I har allerede stack |

**Pages:** `main` branch, root eller `/docs` — vi bruger **root** med `index.html`.

---

## 8. Juridik & etik

- Tydelig **ikke-officiel** relation til Baronen.  
- Link altid til originalt opslag.  
- Citér rimeligt (kort uddrag + link), ikke fuld spejling af hele feedet som “hans brand”.  
- Respektér X API-vilkår.  
- Marker estimater vs. dokumenterede beløb.  
- Ingen doxxing; hold dig til offentlige tal og organisationer.

---

## 9. PR / leveranceplan (efter din godkendelse)

| PR | Indhold |
|----|---------|
| **PR0** ✅ | Repo + Pages + placeholder + denne plan |
| **PR1** | Endeligt UI-design (forside, opslag, sag) — **efter din OK** |
| **PR2** | `data/posts.json` + manuelle 5–10 research-sager (Danida-tema) |
| **PR3** | Three.js hero (penge-regn / kage) + reduced-motion |
| **PR4** | Auto-ingest script + Actions/cron |
| **PR5** | AI depth notes + kilde-pipeline |
| **PR6** | Polish: søgning, grafer, SEO, egen domain (valgfrit) |

---

## 10. Key decisions

1. **Tydeligt borgerlig** — ikke “neutralt tracker-brand”.  
2. **Sager > tweets** — arkiv der overlever X-algoritmen.  
3. **Kildekrav** før “dybde” publiceres.  
4. **Pages først** — live tidligt; automation bagefter.  
5. **Three.js som krydderi** — ikke hele produktet.  
6. **Navn: Skattejægeren** — kan skiftes (se open questions).

---

## 11. Open questions (dit valg)

1. **Navn:** Skattejægeren / StatensPenge / Ulandsscanner / andet?  
2. **Domain:** kun `*.github.io` nu, eller købe domæne senere?  
3. **Kun Baronen** som kilde, eller også egne research-opslag?  
4. **Three.js-niveau:** diskret baggrund vs. stor hero-scene?  
5. **Publicér dybde auto** eller kun efter din manuel godkendelse (anbefalet i starten)?

---

## 12. Hvad du gør nu

1. Åbn **live placeholder** (link i README).  
2. Læs denne plan.  
3. Svar fx: *“Godkendt”* + svar på open questions (eller “default ok”).  
4. Så designer og bygger vi **PR1** for alvor.

---

*Oprettet 2026-08-11 · Grok Build session*
