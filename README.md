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

| Rol         | E-mail                    | Wachtwoord   | Ziet                                   |
|-------------|---------------------------|--------------|----------------------------------------|
| Directie    | directie@startblok.nl     | Wachtwoord1! | alles, alle locaties                   |
| Coördinator | coordinator@startblok.nl  | Wachtwoord1! | kinderen/activiteiten van eigen locatie (Pijnacker) + goedkeuren |
| Vrijwilliger| vrijwilliger@startblok.nl | Wachtwoord1! | kinderen van eigen activiteit (maandag-zwemles) |

## Privacy / AVG

Dit platform verwerkt **bijzondere persoonsgegevens** (gezondheid). Zie
[`docs/DPIA.md`](docs/DPIA.md) voor de verwerkingsgrondslag, risico's, maatregelen
en bewaartermijnen. Gegevens worden niet met derden gedeeld.
