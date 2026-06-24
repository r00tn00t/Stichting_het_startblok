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

```bash
# 1. Backend
cd server
cp .env.example .env        # pas waarden aan
npm install
npm run seed                # vult testdata + 3 testgebruikers
npm run dev                 # http://localhost:4000

# 2. Frontend (nieuwe terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

## Testgebruikers (na `npm run seed`)

| Rol         | E-mail                  | Wachtwoord   | Rechten              |
|-------------|-------------------------|--------------|----------------------|
| Coördinator | coordinator@startblok.nl| Wachtwoord1! | volledig beheer      |
| Hoofdtrainer| trainer@startblok.nl    | Wachtwoord1! | lezen + schrijven    |
| Vrijwilliger| vrijwilliger@startblok.nl| Wachtwoord1!| alleen lezen         |

## Privacy / AVG

Dit platform verwerkt **bijzondere persoonsgegevens** (gezondheid). Zie
[`docs/DPIA.md`](docs/DPIA.md) voor de verwerkingsgrondslag, risico's, maatregelen
en bewaartermijnen. Gegevens worden niet met derden gedeeld.
