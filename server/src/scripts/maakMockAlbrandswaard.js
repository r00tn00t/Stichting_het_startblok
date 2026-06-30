// Eenmalig script: voegt 6 vrijwilligers en 35 leerlingen toe aan de bestaande
// database, gekoppeld aan "Zwemles - woensdagavond" @ Zwembad Albrandswaard.
// Alle velden worden gevuld (volledig mock-dossier). Wist niets.
// Idempotent: bestaande mock-records (zelfde e-mail / naam+locatie) overslaan.
//
// Draaien:  node src/scripts/maakMockAlbrandswaard.js
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Leerling } from '../models/Leerling.js';
import { Locatie } from '../models/Locatie.js';
import { Activiteit } from '../models/Activiteit.js';
import { ROLES } from '../config/roles.js';

const WACHTWOORD = 'Wachtwoord1!';
const TIJDSLOTS = ['19.00-19.30', '19.30-20.00', '20.00-20.45'];

const VRIJWILLIGERS = [
  'Bram Visser', 'Sanne de Boer', 'Tom Bakker', 'Lotte Jansen', 'Daan Smit', 'Eva Mulder',
];

const VOORNAMEN = [
  'Sem', 'Liam', 'Noud', 'Finn', 'Luuk', 'Mees', 'Lars', 'Tess', 'Saar', 'Fenna',
  'Noa', 'Roos', 'Julia', 'Loïs', 'Sofie', 'Milan', 'Jesse', 'Bo', 'Cas', 'Joris',
  'Lieke', 'Mila', 'Yara', 'Sven', 'Thijs', 'Nina', 'Guus', 'Pim', 'Maud', 'Hugo',
  'Anne', 'Teun', 'Ruben', 'Floor', 'Kayleigh',
];
const ACHTERNAMEN = [
  'de Vries', 'Jansen', 'van den Berg', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer',
  'Mulder', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer',
  'de Wit', 'Dijkstra', 'Smeets', 'de Graaf',
];
const STRATEN = ['Zwemlaan', 'Baanstraat', 'Waterweg', 'Duikersingel', 'Schoolslagpad', 'Vrijeslaglaan'];
const PLAATSEN_POSTCODE = [['Poortugaal', '3171'], ['Rhoon', '3161'], ['Hoogvliet', '3191'], ['Spijkenisse', '3201']];
const SCHOLEN = ['De Regenboog (SO)', 'Mytylschool', 'Reguliere basisschool', 'Dagbesteding Het Anker', 'VSO De Brug'];

const BEPERKINGEN = [
  { type: 'Autisme (ASS)', cat: 'gedrag-ontwikkeling', oms: 'Houdt van structuur en voorspelbaarheid.' },
  { type: 'Downsyndroom', cat: 'verstandelijk', oms: 'Vrolijk, leert via herhaling en nabootsing.' },
  { type: 'ADHD', cat: 'gedrag-ontwikkeling', oms: 'Veel energie, korte spanningsboog.' },
  { type: 'Spasticiteit', cat: 'lichamelijk', oms: 'Verhoogde spierspanning in de benen.' },
  { type: 'Slechtziend', cat: 'zintuiglijk', oms: 'Beperkt zicht; werkt op gehoor en tast.' },
  { type: 'Slechthorend', cat: 'zintuiglijk', oms: 'Draagt gehoorapparaat (uit in het water).' },
  { type: 'Verstandelijke beperking (licht)', cat: 'verstandelijk', oms: 'Heeft eenvoudige, korte instructies nodig.' },
  { type: 'Meervoudige beperking', cat: 'meervoudig', oms: 'Combinatie van motorische en zintuiglijke beperking.' },
  { type: 'DCD (motorisch)', cat: 'lichamelijk', oms: 'Moeite met motorische coördinatie.' },
];
const TIPS = [
  'Korte, duidelijke instructies. Werk met vaste structuur.',
  'Geef ruim de tijd om te reageren; vermijd haast.',
  'Werkt goed met visuele ondersteuning / pictogrammen.',
  'Heeft baat bij veel positieve bevestiging.',
  'Rustige benadering, vermijd plotselinge prikkels.',
];
const AANDACHTSPUNTEN = ['waterangst', 'concentratieproblemen', 'bewegingsonrust', 'evenwichtsstoornissen', 'gehoor-/gezichtsproblemen'];

const pick = (arr, i) => arr[i % arr.length];

async function run() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zwemstart');

  const locatie = await Locatie.findOne({ naam: 'Zwembad Albrandswaard' });
  if (!locatie) throw new Error('Locatie Zwembad Albrandswaard niet gevonden — draai eerst de seed.');
  const activiteit = await Activiteit.findOne({ naam: 'Zwemles - woensdagavond', locatie: locatie._id });
  if (!activiteit) throw new Error('Activiteit "Zwemles - woensdagavond" niet gevonden voor Albrandswaard.');

  // --- 6 vrijwilligers (alle velden) ---
  let nieuweVrij = 0;
  for (let i = 0; i < VRIJWILLIGERS.length; i++) {
    const naam = VRIJWILLIGERS[i];
    const email = `${naam.split(' ')[0].toLowerCase()}.albrandswaard@startblok.nl`;
    const bestaand = await User.findOne({ email });
    const velden = {
      naam, email, role: ROLES.VRIJWILLIGER,
      telefoon: `06-${String(20000000 + i * 314159).slice(0, 8)}`,
      goedgekeurd: true, actief: true, geheimhoudingAkkoord: true,
      activiteiten: [activiteit._id],
    };
    if (bestaand) {
      // Vul ontbrekende velden aan (bv. telefoon die er eerder niet was).
      bestaand.telefoon = bestaand.telefoon || velden.telefoon;
      bestaand.goedgekeurd = true; bestaand.actief = true; bestaand.geheimhoudingAkkoord = true;
      if (!(bestaand.activiteiten || []).length) bestaand.activiteiten = [activiteit._id];
      await bestaand.save();
      console.log(`[update] vrijwilliger ${email}`);
      continue;
    }
    const u = new User(velden);
    await u.setPassword(WACHTWOORD);
    await u.save();
    nieuweVrij++;
    console.log(`[nieuw] vrijwilliger ${email}`);
  }

  // --- 35 leerlingen (alle velden) ---
  let nieuweLeer = 0, bijgewerkt = 0;
  for (let i = 0; i < 35; i++) {
    const voor = pick(VOORNAMEN, i);
    const naam = `${voor} ${pick(ACHTERNAMEN, i * 3 + 1)}`;
    const bep = pick(BEPERKINGEN, i);
    const [plaats, pcCijfers] = pick(PLAATSEN_POSTCODE, i);

    const aandacht = [];
    if (i % 4 === 0) aandacht.push({ titel: 'Toevallen / epilepsie', omschrijving: 'Let op bij vermoeidheid; volg het protocol.', urgentie: 'kritiek' });
    if (i % 3 === 0) aandacht.push({ titel: 'Medicijngebruik', omschrijving: 'Gebruikt medicatie; navragen bij ouders.', urgentie: 'belangrijk' });
    if (i % 5 === 0) aandacht.push({ titel: 'Allergieën', omschrijving: 'Pinda-allergie.', urgentie: 'belangrijk' });

    const velden = {
      naam,
      voorletters: `${voor[0]}.`,
      geslacht: i % 2 === 0 ? 'Jongen' : 'Meisje',
      geboortedatum: new Date(2012 + (i % 8), i % 12, (i % 27) + 1),
      typeBeperking: bep.type,
      beperkingCategorie: bep.cat,
      beperkingOmschrijving: bep.oms,
      medischeAandachtspunten: aandacht,
      aandachtspunten: [pick(AANDACHTSPUNTEN, i), pick(AANDACHTSPUNTEN, i + 2)].filter((v, idx, a) => a.indexOf(v) === idx),
      communicatieTips: pick(TIPS, i),
      watWerktWel: pick(['Herhaling', 'Spelvorm', 'Vaste begeleider', 'Belonen met sticker'], i),
      watWerktNiet: pick(['Tijdsdruk', 'Wisselende begeleiders', 'Drukke omgeving'], i),
      locatie: locatie._id,
      activiteiten: [activiteit._id],
      zwemtijd: pick(TIJDSLOTS, i),
      fysiotherapie: i % 3 === 0,
      fysiotherapiePraktijk: i % 3 === 0 ? 'FysioCentrum Albrandswaard' : '',
      eerderGezwommen: i % 2 === 0,
      eerderToelichting: i % 2 === 0 ? 'Eerder Badje 1 gevolgd bij een andere club (half jaar).' : '',
      // Adres & contact
      straatnaam: pick(STRATEN, i),
      huisnummer: String((i % 80) + 1),
      postcode: `${pcCijfers} ${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i + 7) % 26))}`,
      plaats,
      email: `ouder.${voor.toLowerCase()}${i}@example.nl`,
      dagbestedingSchool: pick(SCHOLEN, i),
      contactNaam: `Ouder van ${voor}`,
      contactTelefoon: `06-${String(10000000 + i * 137).slice(0, 8)}`,
      // Media-toestemming
      mediaWebsite: i % 2 === 0,
      mediaSocial: i % 3 === 0,
      mediaKrant: i % 4 === 0,
    };

    const bestaand = await Leerling.findOne({ naam, locatie: locatie._id });
    if (bestaand) {
      Object.assign(bestaand, velden);
      await bestaand.save();
      bijgewerkt++;
      continue;
    }
    await Leerling.create({ ...velden, laatstGewijzigdDoor: undefined });
    nieuweLeer++;
  }

  console.log(`\nKlaar. Vrijwilligers: ${nieuweVrij} nieuw. Leerlingen: ${nieuweLeer} nieuw, ${bijgewerkt} bijgewerkt`);
  console.log(`aan "Zwemles - woensdagavond" @ Zwembad Albrandswaard. Wachtwoord: ${WACHTWOORD}`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error('[fout]', err); process.exit(1); });
