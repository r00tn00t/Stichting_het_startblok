# DPIA — ZwemStart Digitaal (Stichting Het Startblok)

Gegevensbeschermingseffectbeoordeling. Een DPIA is **verplicht** omdat er op grote
schaal **bijzondere persoonsgegevens** (gezondheid) worden verwerkt van een
**kwetsbare groep** (kinderen en mensen met een beperking). — *Concept, in te
vullen samen met Het Startblok.*

## 1. Beschrijving van de verwerking

| Vraag | Antwoord |
|-------|----------|
| Wat | Vastleggen van leerlinginformatie t.b.v. veilige, consistente zwembegeleiding |
| Wie verwerkt | Stichting Het Startblok (verwerkingsverantwoordelijke) |
| Wie heeft toegang | Vrijwilligers (lezen), hoofdtrainers (lezen+schrijven), coördinator (beheer) |
| Betrokkenen | Leerlingen (veelal kinderen / mensen met beperking) en hun contactpersonen |

## 2. Welke gegevens

| Categorie | Voorbeeld | Bijzonder? |
|-----------|-----------|------------|
| Identificatie | Naam, geboortedatum | Gewoon |
| Gezondheid | Type beperking, medische aandachtspunten | **Bijzonder (art. 9 AVG)** |
| Begeleiding | Communicatietips, wat werkt wel/niet, niveau, voortgang | Gewoon (kan herleidbaar zijn) |
| Contact | Naam + telefoon contactpersoon | Gewoon |
| Gebruikers | Naam, e-mail, rol, wachtwoord-hash | Gewoon |

**Niet verzamelen:** BSN, adres, etniciteit, of andere gegevens die niet nodig
zijn voor veilige begeleiding (dataminimalisatie).

## 3. Verwerkingsgrondslag (art. 6 + 9 AVG)

- Voorkeursgrondslag: **uitdrukkelijke toestemming** (art. 9 lid 2 sub a) van de
  betrokkene of wettelijk vertegenwoordiger (ouder/voogd), schriftelijk vastgelegd.
- Eventueel aanvullend: vitaal belang (art. 9 lid 2 sub c) bij acute veiligheid.
- Leg per leerling vast: datum toestemming + door wie gegeven.

## 4. Noodzaak & proportionaliteit

- Alleen gegevens die bijdragen aan **veiligheid en kwaliteit** van de les.
- Toegang strikt op basis van rol (need-to-know); vrijwilligers kunnen niet wijzigen
  of verwijderen.
- Geen koppeling of deling met derden.

## 5. Risico's en maatregelen

| Risico | Maatregel |
|--------|-----------|
| Ongeautoriseerde toegang | JWT-authenticatie + rol-gebaseerde autorisatie (3 rollen) |
| Wachtwoorddiefstal | Wachtwoorden gehasht (bcrypt), nooit in klaartekst opgeslagen of teruggestuurd |
| Datalek bij transport | HTTPS afdwingen in productie (TLS) |
| Te brede toegang | `select:false` op hash; vrijwilliger = alleen lezen |
| Kennis bij ex-vrijwilligers | Account deactiveren (`actief:false`) bij vertrek |
| Onnodige bewaring | Bewaartermijn + periodieke opschoning (zie §7) |
| Onbevoegd inzien door vrijwilligers | Geheimhoudingsverklaring vereist vóór toegang |

**Nog te regelen in productie:** HTTPS, sterk `JWT_SECRET`, back-ups versleuteld,
logging van toegang tot dossiers (audit trail — basis aanwezig via
`laatstGewijzigdDoor`), rate-limiting op de login.

## 6. Rechten van betrokkenen

Procedure vastleggen voor: inzage, correctie, verwijdering ("vergeten"), en intrekken
van toestemming. Contactpunt: de coördinator.

## 7. Bewaartermijn

- Leerlingdossier: bewaren zolang de leerling lessen volgt + [X jaar] daarna
  (samen met Het Startblok bepalen, bv. tot diploma + 2 jaar).
- Na afloop: anonimiseren of verwijderen.
- Gebruikersaccounts: deactiveren bij vertrek, verwijderen na [termijn].

## 8. Conclusie

In te vullen na overleg met Het Startblok: zijn de restrisico's aanvaardbaar, en is
raadpleging van de Autoriteit Persoonsgegevens nodig? (Doorgaans niet als
maatregelen afdoende zijn.)

---
*Openstaand: termijnen (§7) en het toestemmingsformulier samen met de opdrachtgever
invullen.*
