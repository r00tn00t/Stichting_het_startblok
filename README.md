# ZwemStart Digitaal

Digitaal zwemondersteuningsplatform voor **Stichting Het Startblok** — een centrale,
beveiligde plek waar vrijwilligers en instructeurs leerlinginformatie (beperkingen,
medische aandachtspunten, communicatietips en voortgang) veilig vastleggen en
terugvinden.

## Stack

| Laag      | Keuze                          |
|-----------|--------------------------------|
| Frontend  | React + Vite                   |
| Backend   | Node.js + Express              |
| Database  | MongoDB (Mongoose)             |
| Auth      | JWT, role-based (3 rollen)     |

## Mappenstructuur

```
.
├── server/        Express + Mongoose API
│   └── src/
│       ├── config/      DB-connectie
│       ├── models/      Mongoose-schemas
│       ├── middleware/  auth + rollen
│       └── routes/      API-endpoints
├── client/        React + Vite frontend
│   └── src/
│       ├── api/         fetch-helpers
│       ├── context/     auth-context
│       ├── components/  herbruikbare UI
│       └── pages/       schermen
└── docs/          DPIA / AVG-documentatie
```

## Snel starten (lokaal)

Vereist: Node 18+ en een draaiende MongoDB (`mongod`).

### Snelste weg (alles in één terminal)

```bash
cp server/.env.example server/.env   # pas waarden aan (MONGODB_URI, JWT_SECRET)
npm run install:all                  # installeert root + server + client
npm run seed                         # vult testdata + testgebruikers
npm run dev:all                      # start backend (4000) én frontend (5173)
```

`dev:all` draait beide processen tegelijk met gekleurde labels (`server` / `client`).
Stoppen: `Ctrl+C`.

### Apart starten (twee terminals)

```bash
# 1. Backend
cd server && cp .env.example .env && npm install && npm run seed && npm run dev   # :4000

# 2. Frontend (nieuwe terminal)
cd client && npm install && npm run dev                                          # :5173
```

## Testgebruikers (na `npm run seed`)

Alle accounts hebben wachtwoord **`Wachtwoord1!`**.

### Demo-accounts

| Rol         | E-mail                    | Ziet                                                            |
|-------------|---------------------------|-----------------------------------------------------------------|
| Directie    | directie@startblok.nl     | alles, alle locaties                                            |
| Coördinator | coordinator@startblok.nl  | kinderen/activiteiten van eigen locatie (Pijnacker) + goedkeuren |
| Vrijwilliger| vrijwilliger@startblok.nl | kinderen van eigen activiteit (maandag-zwemles)                 |

### Coördinator per locatie

Eén coördinator per zwembad; ziet alleen de leerlingen/activiteiten van die locatie.

| E-mail                        | Locatie                              |
|-------------------------------|--------------------------------------|
| coordinator@viergang.nl       | Zwembad de Viergang, Pijnacker       |
| coordinator@alexanderhof.nl   | Het Alexanderhof, Rotterdam          |
| coordinator@watergeus.nl      | De Watergeus, Zoetermeer             |
| coordinator@kerkpolder.nl     | Zwembad Kerkpolder, Delft            |
| coordinator@hogebomen.nl      | De Hoge Bomen, Naaldwijk             |
| coordinator@albrandswaard.nl  | Zwembad Albrandswaard, Poortugaal    |
| coordinator@groenoord.nl      | Zwembad Groenoord, Schiedam          |
| coordinator@deveur.nl         | Zwembad de Veur, Zoetermeer          |
| coordinator@dekulk.nl         | Zwembad de Kulk, Vlaardingen         |

> De locatie-coördinatoren kun je ook in een bestaande database (zonder te seeden)
> aanmaken met: `node src/scripts/maakLocatieCoordinatoren.js` (vanuit `server/`).

## Privacy / AVG

Dit platform verwerkt **bijzondere persoonsgegevens** (gezondheid). Zie
[`docs/DPIA.md`](docs/DPIA.md) voor de verwerkingsgrondslag, risico's, maatregelen
en bewaartermijnen. Gegevens worden niet met derden gedeeld.
