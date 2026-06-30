# Rechtenoverzicht — ZwemStart Digitaal

Dit document beschrijft wie wat mag in de webapp. Bedoeld om met de directie te
delen. Het is gebaseerd op de daadwerkelijke autorisatie in de code (de
`requireRole`-controles op de server én de schermtoegang in de frontend).

## De drie rollen

| Rol | Voor wie | Kerngedachte |
|-----|----------|--------------|
| **Vrijwilliger** | Begeleiders bij de lessen | Ziet alleen wat nodig is om te begeleiden; kan niets wijzigen (alleen-lezen). |
| **Coördinator** | Verantwoordelijke per locatie | Beheert leerlingen, badindeling en aanwezigheid van de **eigen locatie(s)**. |
| **Directie** | Bestuur / organisatiebreed | Volledige toegang over **alle** locaties + organisatiebrede instellingen. |

De rollen zijn hiërarchisch: **vrijwilliger → coördinator → directie**. Een
hogere rol mag automatisch alles wat een lagere rol mag.

## Zichtbaarheid (welke gegevens zie je?)

| | Vrijwilliger | Coördinator | Directie |
|---|---|---|---|
| **Leerlingen** | alleen van de eigen activiteit(en) | alleen van de eigen locatie(s) | alle |
| **Activiteiten** | alleen de eigen | alleen van de eigen locatie(s) | alle |
| **Badindeling** | de eigen toewijzing ("mijn dag") | eigen locatie | alle |
| **Gebruikers** | — | alleen vrijwilligers van de eigen locatie | alle |

Een coördinator van locatie A kan dus géén leerlingen of gebruikers van locatie
B zien of aanpassen. Dit wordt op de server afgedwongen (niet alleen verborgen
in het scherm).

## Wat mag elke rol doen?

Legenda: ✅ = volledig · 👁️ = alleen lezen · 🔒 (locatie) = alleen eigen
locatie/activiteit · — = geen toegang

| Functie | Vrijwilliger | Coördinator | Directie |
|---------|:---:|:---:|:---:|
| Inloggen / eigen dag bekijken | ✅ | ✅ | ✅ |
| Leerlingdossiers bekijken | 👁️ 🔒 | 👁️ 🔒 | 👁️ |
| Leerling toevoegen / bewerken / archiveren | — | ✅ 🔒 | ✅ |
| Aanwezigheid registreren | eigen toegewezen kinderen | ✅ 🔒 | ✅ |
| Aanwezigheidspercentages bekijken | 👁️ 🔒 | 👁️ 🔒 | 👁️ |
| Badindeling maken / bewerken | — | ✅ 🔒 | ✅ |
| Badindeling exporteren (PNG/PDF) | — | ✅ 🔒 | ✅ |
| Sjablonen (badindeling) beheren | — | ✅ 🔒 | ✅ |
| Kennisbank lezen | 👁️ | 👁️ | 👁️ |
| Kennisbank-items toevoegen / verwijderen | — | ✅ | ✅ |
| Agenda bekijken | 👁️ 🔒 | 👁️ 🔒 | 👁️ |
| Inschrijvingen beoordelen (goedkeuren/afwijzen) | — | ✅ | ✅ |
| Vrijwilligers goedkeuren / beheren | — | ✅ 🔒 (alleen vrijwilligers) | ✅ |
| Rollen toekennen (coördinator/directie maken) | — | — | ✅ |
| Locaties & activiteiten beheren | — | activiteiten 🔒 | ✅ (locaties) |
| Vakanties & feestdagen beheren | — | — | ✅ |
| Losse afspraken (agenda-events) beheren | — | — | ✅ |

## Belangrijke afspraken / waarborgen

- **Een coördinator kan zichzelf of anderen géén coördinator of directie maken.**
  Rollen toekennen is uitsluitend een directie-recht (voorkomt dat iemand zijn
  eigen rechten verhoogt).
- **Locatie-grenzen worden op de server afgedwongen.** Ook wie de URL handmatig
  aanpast, komt niet bij gegevens van een andere locatie.
- **Vrijwilligers zijn altijd alleen-lezen.** Ze kunnen geen dossiers,
  aanwezigheid of indelingen wijzigen.
- **Zelf-aangemelde vrijwilligers** hebben pas toegang nadat een coördinator hen
  heeft **goedgekeurd**.
- **Gevoelige gegevens** (gezondheid in dossiers en inschrijvingen) zijn niet
  zichtbaar voor wie er niet bij hoort; inschrijvingen zijn alleen voor
  coördinator/directie.

## Alleen voor de directie

Deze organisatiebrede instellingen zijn voorbehouden aan de directie:

- **Locaties** aanmaken/wijzigen
- **Vakanties & feestdagen** beheren (bepalen wanneer de lessen vervallen)
- **Afspraken** (losse agenda-events) beheren
- **Rollen** toekennen aan gebruikers (wie wordt coördinator/directie)

---

*Wijzigingen in rechten worden in de code vastgelegd; dit document weerspiegelt
de situatie op het moment van schrijven. Bij twijfel is de servercontrole
(`requireRole`) leidend.*
