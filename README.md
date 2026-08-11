# Skattejægeren

Borgerlig tracker af **ulandsbistand, Danida, puljer og statsstøtte**.

- Live: **https://mattomadsen.github.io/skattejaegeren/**
- Plan: [PLAN.md](./PLAN.md)
- Data: `data/cases.json`, `data/posts.json`

Primær start: [@oresundsbaron](https://x.com/oresundsbaron).  
Supplerende: [@Statsstyret](https://x.com/Statsstyret) (aktindsigt MS).  
Flere kilder (MikeHunt-handle, Facebook …) i `data/sources-queue.json`.

**Ikke** en officiel side for nogen af kilderne. Dybde er manuelt godkendt. Claims vs. officielle tal er mærket i UI.

## Lokalt

```bash
python3 -m http.server 8765
# http://127.0.0.1:8765
```
