# Overdrachts-prompt: ZwemStart Digitaal (Stichting Het Startblok)

> Plak dit hele bestand in een nieuwe chat om verder te werken aan dit project.
> Het beschrijft de volledige stand van zaken zodat een AI-assistent zonder de
> oorspronkelijke conversatie verder kan.

---

Je helpt mij een digitaal zwemondersteuningsplatform bouwen voor **Stichting Het
Startblok**, een zwemschool voor kinderen en volwassenen met een beperking,
begeleid door vrijwilligers. Het project staat al ver — hieronder de complete
context. Werk in dezelfde stijl door: Nederlands, pragmatisch, test tegen de
database, en commit/push pas als ik daarom vraag (of bevestig).

## 1. Doel van de app

Eén centrale, beveiligde webapp waar vrijwilligers/coördinatoren leerling-
informatie (beperking, medische aandachtspunten, voortgang) veilig vastleggen,
inschrijvingen verwerken, en per zwembad-avond een **badindeling** maken
(welke vrijwilliger begeleidt welke kinderen, per tijdsblok en zwembaan).

## 2. Tech stack

| Laag | Keuze |
|------|-------|
| Frontend | React 18 + Vite, plain CSS (`client/src/styles.css`), react-router-dom v6 |
| Backend | Node.js + Express (ES modules), Mongoose |
| Database | MongoDB Atlas (verbonden via `server/.env` → `MONGODB_URI`) |
| Auth | JWT, rol-gebaseerd |
| Export | `html-to-image` + `jspdf` (PNG/PDF van de badindeling), lazy-loaded |

**Monorepo**: `server/` (API, poort 4000) en `client/` (Vite, poort 5173, proxyt
`/api` naar de backend). Root heeft `npm run dev:all` (concurrently) en
`npm run seed`.

## 3. Mappenstructuur (belangrijkste bestanden)

```
server/src/
  config/        db.js, roles.js
  models/        User, Leerling, Voortgang, KennisbankItem, Inschrijving,
                 Locatie, Activiteit, Badindeling, Badindelingtemplate
  middleware/    auth.js (requireAuth, requireRole, loadUserScope),
                 scope.js (zichtbaarheid/rechten-helpers), asyncHandler.js
  routes/        auth, registratie, leerlingen, locaties, activiteiten,
                 badindelingen, templates, inschrijvingen, kennisbank, users
  data/          locaties.js (9 zwembaden + activiteiten), kennisbank.js
  scripts/       maakLocatieCoordinatoren.js (eenmalig, wist niets)
  seed.js        wist + herbouwt alle data
client/src/
  context/AuthContext.jsx   (rol-helper heeftRol)
  components/Layout.jsx, Icon.jsx
  pages/        LoginPage, VrijwilligerDashboard, LeerlingenPage,
                LeerlingDetailPage, LeerlingFormPage, KennisbankPage,
                GebruikersPage, InschrijvingPage, ActiviteitInschrijvingPage,
                InschrijvingenBeheerPage, LocatiesPage, TemplatesPage,
                BadindelingPage
  utils/exportImage.js      (PNG/PDF export)
docs/           DPIA.md (AVG), HANDOVER.md (dit bestand)
```

## 4. Rollen & rechten (centraal in `config/roles.js`)

Hiërarchie laag→hoog: **vrijwilliger (1) < coordinator (2) < directie (3)**.
`requireRole(min)` op de backend is de echte poortwachter; de frontend spiegelt
het met `heeftRol`.

- **vrijwilliger**: ziet z'n eigen kinderen via de badindeling ("Mijn dag") en de
  deelnemers van z'n eigen activiteit(en). Alleen lezen.
- **coordinator**: beheert leerlingen/activiteiten/badindelingen/templates van de
  **eigen locatie(s)**; keurt vrijwilligers goed; mag in gebruikersbeheer alleen
  **vrijwilligers** van de eigen locatie zien/aanmaken/wijzigen — kan GEEN
  coordinator/directie aanmaken of toekennen (privilege-escalatie afgedicht).
- **directie**: alles, alle locaties.

**Zichtbaarheid (scope.js)**: leerlingen/activiteiten/templates worden in de
GET-routes gefilterd op rol — directie alles, coordinator eigen locatie(s),
vrijwilliger eigen activiteiten. Niet te omzeilen via querystrings.

## 5. Datamodel kort

- **Locatie**: naam, plaats. (9 zwembaden in `data/locaties.js`.)
- **Activiteit**: naam, locatie (ref), weekdag, tijd, soort (zwemles|activiteit).
- **User**: naam, email, passwordHash (select:false), telefoon, role,
  `locaties[]` (coordinator), `activiteiten[]` (vrijwilliger), `goedgekeurd`
  (zelf-aangemelde vrijwilliger = false tot coordinator goedkeurt), `actief`.
- **Leerling**: naam, geboortedatum, typeBeperking, beperkingCategorie,
  medischeAandachtspunten[{titel,omschrijving,urgentie}], communicatieTips,
  watWerktWel/Niet, niveau, `locatie` (ref), `activiteiten[]`, contact, actief.
- **Voortgang**: leerling (ref), onderdeel, categorie, status
  (nog-niet-begonnen|in-uitvoering|behaald), notitie. = digitale zwemkaart.
- **Inschrijving**: volledig publiek aanmeldformulier (zwemles én activiteit),
  `soort`, gezondheidsvragen, akkoorden, status (in-behandeling|goedgekeurd|
  afgewezen). Coordinator keurt goed → maakt Leerling-dossier.
- **Badindeling**: activiteit (ref) + datum (uniek samen), `blokken[]` →
  `zones[]` (naam, vrijwilliger ref, kinderen[{leerling, status, niveau}]),
  notities. Status: aanwezig|nieuw|oproep|afwezig|verplaatst|taxi. Niveau: A/B/C.
- **Badindelingtemplate**: naam, locatie (ref), `blokken[]` (label + zone-namen).
  Vaste structuur zonder vrijwilligers/kinderen, herbruikbaar per locatie.

## 6. Belangrijkste features (alle werkend, getest tegen Atlas)

1. Auth + 3 rollen; zelfregistratie vrijwilliger met goedkeuringsstap.
2. Leerlingdossiers + digitale zwemkaart (voortgang).
3. Kennisbank (oefeningen/protocollen/diploma-eisen ENVOZ A/B/C) — seed-data.
4. Publieke inschrijfformulieren (zwemles + overige activiteiten) → beoordeling
   door coordinator → omzetten naar leerlingdossier.
5. Locaties + activiteiten (9 echte zwembaden, ~27 activiteiten).
6. Gebruikersbeheer met locatie-scoping en goedkeuring.
7. **Badindeling**: per activiteit+datum een rooster met **tijdsblokken** en
   **instelbare zones/banen**; kinderen via **drag & drop** indelen; status +
   diplomaniveau per kind; **accordion per tijdsblok** (1 open tegelijk, kind
   kan in meerdere blokken); "nog in te delen"-lijst per blok; **kopieer vorige
   week / specifieke datum**; **templates** toepassen + auto-voorvullen;
   **export naar PNG en PDF** voor de groepsapp; pagina op volle schermbreedte.

## 7. Testaccounts (wachtwoord overal `Wachtwoord1!`)

- directie@startblok.nl (directie, alle locaties)
- coordinator@startblok.nl (coordinator, Pijnacker)
- vrijwilliger@startblok.nl (vrijwilliger, maandag-zwemles)
- coordinator@<locatie>.nl per zwembad: viergang, alexanderhof, watergeus,
  kerkpolder, hogebomen, albrandswaard, groenoord, deveur, dekulk
- maarten@test.com (directie) — handmatig aangemaakt, niet in seed

## 8. Werkwijze / conventies

- Git: branch `initial-platform`, remote `r00tn00t/Stichting_het_startblok`
  (via SSH). Pushen naar `main` gaat via PR #1.
- Commit-messages in het Nederlands; eindigen met
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- `.env` (Atlas-wachtwoord) staat in `.gitignore` — nooit committen.
- Async route-handlers altijd in `asyncHandler(...)` wikkelen (Express 4 vangt
  async errors niet; centrale error-handler vertaalt Mongoose-fouten → 400/409).
- Lege ObjectId-velden ("") opschonen vóór opslaan (anders CastError).
- Test wijzigingen tegen Atlas met een tijdelijke server + curl; ruim testdata op
  (re-seed of gericht verwijderen). Geen `node_modules` committen.

## 9. Bekende open punten / mogelijke vervolgstappen

- Albrandswaard heeft een template "Standaard woensdagavond" (handmatig in Atlas
  gezet, NIET in seed — verdwijnt bij herseed). Eventueel in seed zetten.
- Mock-data: 6 vrijwilligers + 35 leerlingen op Albrandswaard-woensdagavond was
  de eerstvolgende taak (eenmalig script, data behouden) — mogelijk nog te doen.
- Template als "standaard per activiteit" markeren (nu pakt auto-voorvullen de
  eerste template van de locatie).
- Drag & drop op touch/tablet kan wisselvallig zijn; eventueel tik-om-te-plaatsen
  als alternatief.
- Productie-hardening uit DPID/DPIA: HTTPS, sterk JWT_SECRET, rate-limiting +
  CAPTCHA op publieke formulieren, audit-logging, bewaartermijnen.
- Coordinator kan vrijwilligers (nog) niet verwijderen, alleen deactiveren.

## 10. Lokaal draaien

```bash
cp server/.env.example server/.env   # vul MONGODB_URI + JWT_SECRET in
npm run install:all
npm run seed                         # vult testdata (wist bestaande!)
npm run dev:all                      # backend :4000 + frontend :5173
```

---

**Wat ik nu wil:** _(vul hier je volgende vraag in)_
