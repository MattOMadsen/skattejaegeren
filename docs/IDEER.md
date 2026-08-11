# Skattejægeren — idébank

**Opdateret:** 2026-08-11  

---

## Hurtige wins

| # | Idé | Status |
|---|-----|--------|
| 1 | Forside “største chok” | **done** |
| 2 | Søgning + filtre | **done** |
| 3 | CVR/regnskab GV + CB | **done** |
| 4 | “Hvad kunne det have været?” | **done** (Indsigt) |
| 5 | Del-knapper pr. sag/projekt | **done** |
| 6 | “Nyeste verificeret” tidslinje | **done** (Indsigt) |

## Indhold

| # | Idé | Status |
|---|-----|--------|
| 7 | Top-20 OpEn Hall of Numbers | **done** (OpEn) |
| 8 | MS vs Oxfam budget-grafik | **done** (side om side på Indsigt) |
| 9 | Ordliste | **done** (Om) |
| 10 | RSS / seneste 10 | senere |
| 11 | Flere org-regnskaber | **delvist+** (LGBT+ 2025 regnskab; FF CVR; GA CISU-sum; CB funding partners) |
| 12 | OpenAid/IATI | senere |
| 13 | Aktindsigt publiceret | venter (side: kommer snart) |

## Produkt

| # | Idé | Status |
|---|-----|--------|
| 14 | Egen domain | senere |
| 15 | Indsend tip | **done** (Om · GitHub Issues) |
| 16 | PDF faktaark | **done** (print faktaark på sager) |
| 17 | Engelsk short page | senere |

## Teknik

| # | Idé | Status |
|---|-----|--------|
| 18 | Statisk build / inline data | senere |
| 19 | Tæller-animationer | **done** (3.800 / 10.000) |
| 20 | Dark/light toggle | **done** (header ◐) |
| 21 | **Ren navigation (4 punkter)** | **done** |

## Navigation (hold det simpelt)

```
Overblik · Udforsk · Indsigt · Om
```

| Menu | Indhold |
|------|---------|
| **Overblik** | Chok-kort, kontraster, udvalgte projekter |
| **Udforsk** | Underfaner: Projekter · OpEn (+ Hall of Numbers) · Sager · CVR |
| **Indsigt** | Jump-chips → Alternativer · MS/Oxfam · Tidslinje · Dybere (grav) |
| **Om** | Ordliste, tip-form, X-opslag, aktindsigt-status |

Gamle links (`#/grav`, `#/open` …) virker stadig. **Ingen nye hovedmenupunkter** uden god grund.

## Sagsfiler (vigtigt)

```
data/cases/index.json     ← slug-liste + editorial
data/cases/<slug>.json    ← ÉN fil pr. sag (udvid depth.body her)
```

Appen loader alle sager via `loadCases()`. `data/cases.json` er kun en pegepind.

## Næste prioritet (forslag)

1. Udvid dybde i de nye sagsfiler (kilder, citater, graver-noter)  
2. Crossing Borders — rigtigt årsregnskab (virk/proff)  
3. Idé 13 — aktindsigt (copy-paste; ikke Proton Bridge)  
4. Idé 10 — RSS / seneste 10  


