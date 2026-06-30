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

Er zijn **twee verwerkingen**:
1. **Interne dossiers** — leerlinggegevens die door kaderleden worden geraadpleegd en bijgehouden.
2. **Publieke intake** — aanmeldformulieren op de website (zwemles- en activiteit-inschrijving)
   waarmee ouders/verzorgers zélf bijzondere persoonsgegevens indienen. Deze inschrijvingen
   komen binnen met status *in behandeling* en zijn **uitsluitend** toegankelijk voor de
   coördinator (beoordelingscommissie). Pas na goedkeuring wordt een leerlingdossier aangemaakt.

## 2. Welke gegevens

| Categorie | Voorbeeld | Bijzonder? |
|-----------|-----------|------------|
| Identificatie | Naam, geboortedatum, geslacht | Gewoon |
| Adres | Straat, huisnummer, postcode, plaats (inschrijving) | Gewoon |
| Gezondheid | Type beperking, medische aandachtspunten, toevallen, allergieën, medicijnen, fysiotherapie | **Bijzonder (art. 9 AVG)** |
| Begeleiding | Communicatietips, wat werkt wel/niet, niveau, voortgang | Gewoon (kan herleidbaar zijn) |
| Contact | Naam + telefoon contactpersoon, e-mail | Gewoon |
| Financieel | Bankrekeningnummer (inschrijving t.b.v. contributie) | Gewoon |
| Media-toestemming | Toestemming foto/film website, social media, krant | Gewoon |
| Gebruikers | Naam, e-mail, telefoon, rol, wachtwoord-hash, goedkeuringsstatus | Gewoon |

**Let op (intake):** het inschrijfformulier verzamelt méér dan het interne dossier — o.a.
**adres** en **bankrekeningnummer**. Dit is nodig voor contributie-incasso, maar betekent dat
de `inschrijvingen`-collectie extra gevoelig is. Beperk de toegang tot de coördinator en
**verwijder/anonimiseer** afgewezen of verwerkte inschrijvingen (zie §7). Het
bankrekeningnummer wordt **niet** overgenomen in het leerlingdossier.

**Niet verzamelen:** BSN, etniciteit, of andere gegevens die niet nodig zijn voor veilige
begeleiding of contributie (dataminimalisatie).

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
| **Zelf-aangemelde vrijwilliger krijgt direct toegang tot gezondheidsgegevens** | Nieuwe vrijwilligers komen binnen als *wacht op goedkeuring* (`goedgekeurd:false`); inloggen kan pas ná goedkeuring door de coördinator. Zo krijgt niet iedereen met de aanmeldlink toegang. |
| **Publieke intake bevat bijzondere + financiële gegevens** | Inschrijvingen alleen leesbaar voor de coördinator; afgewezen/verwerkte inschrijvingen opschonen; bankrekeningnummer niet doorgezet naar het dossier. |
| Misbruik publieke formulieren (spam/scraping) | Rate-limiting + CAPTCHA op de publieke endpoints (nog te regelen, zie hieronder). |

**Nog te regelen in productie:** HTTPS, sterk `JWT_SECRET`, back-ups versleuteld,
logging van toegang tot dossiers (audit trail — basis aanwezig via
`laatstGewijzigdDoor`), rate-limiting **en CAPTCHA** op de login én de publieke
registratie-/inschrijfformulieren.

## 6. Rechten van betrokkenen

Procedure vastleggen voor: inzage, correctie, verwijdering ("vergeten"), en intrekken
van toestemming. Contactpunt: de coördinator.

## 7. Bewaartermijn

- Leerlingdossier: bewaren zolang de leerling lessen volgt + [X jaar] daarna
  (samen met Het Startblok bepalen, bv. tot diploma + 2 jaar).
- Na afloop: anonimiseren of verwijderen.
- Inschrijvingen: na goedkeuring (dossier aangemaakt) of afwijzing verwijderen/anonimiseren
  na [korte termijn, bv. 3 maanden] — ze bevatten o.a. een bankrekeningnummer.
- Gebruikersaccounts: deactiveren bij vertrek, verwijderen na [termijn].

## 8. Conclusie

In te vullen na overleg met Het Startblok: zijn de restrisico's aanvaardbaar, en is
raadpleging van de Autoriteit Persoonsgegevens nodig? (Doorgaans niet als
maatregelen afdoende zijn.)

---
*Openstaand: termijnen (§7) en het toestemmingsformulier samen met de opdrachtgever
invullen.*
