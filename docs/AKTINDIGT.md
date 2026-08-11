# Aktindsigt — protokol for Skattejægeren

## Formål

Systematisk anmode om aktindsigt (offentlighedsloven) i de dokumenter, der **ikke** allerede er offentlige (CISU-bevillinger, UM-partnerskabstabeller, SPA-resultatrapporter).  
Målet er at lukke huller: slutregnskaber, ansøgninger, sub-grants, kontrolrapporter.

## Rollefordeling

| Hvem | Gør hvad |
|------|----------|
| **Dig** | Godkender hver mail før afsendelse (modtager, indhold, afsender-navn). |
| **Grok / agent** | Udarbejder mail, foreslår kø, sender **kun efter din eksplicitte OK**, gemmer svar i `data/aktindsigt/`, opdaterer sager **efter din godkendelse**. |
| **Myndighed** | Svarer typisk inden for lovens frister (ofte 7 arbejdsdage for simpel sagsbehandling; kan forlænges). |

**Vigtigt:** Agenten sender **ikke** automatisk mails uden din godkendelse i chatten.  
Første gang skal du angive:

1. **Afsender-navn** (fulde navn som står i anmodningen)  
2. **E-mailadresse** der skal stå som kontakt  
3. **Evt. postadresse** (anbefales, ikke altid påkrævet)  
4. Om agenten må sende via din mail / SMTP / “copy-paste selv”

## Hjemmel

- Lov om offentlighed i forvaltningen (offentlighedsloven)  
- Anmodning skal angive den sag eller de dokumenter, man ønsker (eller et tema der gør det muligt at identificere sagerne)  
- UM/CISU kan undtage forretningshemmeligheder, udenrigspolitiske hensyn m.m. — vi beder stadig om det, der kan udleveres

## Workflow

```
1. Agent opdaterer data/aktindsigt/QUEUE.md med foreslåede anmodninger
2. Du siger: «Godkend A1» / «Godkend alle pending» / ret i teksten
3. Agent sender (eller giver dig færdige mails til copy-paste)
4. Kopi gemmes i data/aktindsigt/sent/YYYY-MM-DD-id.md
5. Når svar kommer: du videresender til agenten ELLER lægger filer i inbox/
6. Agent foreslår hvad der skal ind i sager/projekter
7. Du godkender publicering på sitet
```

## Status-koder i QUEUE

| Status | Betydning |
|--------|-----------|
| `draft` | Udkast — afventer din godkendelse |
| `approved` | Du har godkendt — klar til send |
| `sent` | Afsendt |
| `waiting` | Venter på svar |
| `received` | Svar modtaget (rå) |
| `published` | Relevant indhold på sitet (efter din OK) |
| `refused` | Afslag / delvist afslag — dokumenteret |
| `cancelled` | Droppet |

## Kontaktpunkter (startliste)

| Myndighed / org | E-mail (tjek opdateret) | Type |
|-----------------|-------------------------|------|
| Udenrigsministeriet (aktindsigt) | aktindsigt@um.dk | Offentlig myndighed |
| CISU | info@cisu.dk | Forvalter UM-midler — kan henvise til UM |
| Erhvervsstyrelsen (regnskaber) | — | CVR/regnskab offentligt via data.virk.dk |
| Oxfam Danmark | (se oxfam.dk kontakt) | Privat — ikke offentlighedsloven; frivillig udlevering |
| MS / ActionAid DK | (se ms.dk kontakt) | Privat — frivillig; UM har dog sager om dem |

**Bemærk:** Offentlighedsloven gælder **myndigheder**. NGO’er er ikke underlagt den samme pligt — men UM har sager **om** NGO’erne (bevillinger, kontrol, C-sager), som vi kan få aktindsigt i.

## Etik

- Vi søger **offentlige midler og kontrol** — ikke private personoplysninger om ansatte ud over det nødvendige  
- Ingen chikane; én sag pr. anmodning, klart formuleret  
- Svar offentliggøres i redigeret form på Skattejægeren med kilde  
