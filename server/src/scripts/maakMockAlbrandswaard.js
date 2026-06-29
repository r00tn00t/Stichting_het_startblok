// Eenmalig script: voegt 6 vrijwilligers en 35 leerlingen toe aan de bestaande
// database, gekoppeld aan "Zwemles - woensdagavond" @ Zwembad Albrandswaard.
// Wist niets. Idempotent: bestaande mock-records (zelfde e-mail/naam+locatie)
// worden overgeslagen.
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

const VRIJWILLIGERS = [
  'Bram Visser', 'Sanne de Boer', 'Tom Bakker', 'Lotte Jansen', 'Daan Smit', 'Eva Mulder',
];

// 35 leerlingen met gevarieerde mock-gegevens.
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

const BEPERKINGEN = [
  { type: 'Autisme (ASS)', cat: 'gedrag-ontwikkeling' },
  { type: 'Downsyndroom', cat: 'verstandelijk' },
  { type: 'ADHD', cat: 'gedrag-ontwikkeling' },
  { type: 'Spasticiteit', cat: 'lichamelijk' },
  { type: 'Slechtziend', cat: 'zintuiglijk' },
  { type: 'Slechthorend', cat: 'zintuiglijk' },
  { type: 'Verstandelijke beperking (licht)', cat: 'verstandelijk' },
  { type: 'Meervoudige beperking', cat: 'meervoudig' },
  { type: 'DCD (motorisch)', cat: 'lichamelijk' },
];
const NIVEAUS = ['Watervrij maken', 'Badje 1', 'Badje 2', 'Diploma A — in uitvoering', 'Diploma B — in uitvoering'];
const TIPS = [
  'Korte, duidelijke instructies. Werk met vaste structuur.',
  'Geef ruim de tijd om te reageren; vermijd haast.',
  'Werkt goed met visuele ondersteuning / pictogrammen.',
  'Heeft baat bij veel positieve bevestiging.',
  'Rustige benadering, vermijd plotselinge prikkels.',
];

const pick = (arr, i) => arr[i % arr.length];

async function run() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zwemstart');

  const locatie = await Locatie.findOne({ naam: 'Zwembad Albrandswaard' });
  if (!locatie) throw new Error('Locatie Zwembad Albrandswaard niet gevonden — draai eerst de seed.');
  const activiteit = await Activiteit.findOne({ naam: 'Zwemles - woensdagavond', locatie: locatie._id });
  if (!activiteit) throw new Error('Activiteit "Zwemles - woensdagavond" niet gevonden voor Albrandswaard.');

  // --- 6 vrijwilligers ---
  let nieuweVrij = 0;
  for (const naam of VRIJWILLIGERS) {
    const email = `${naam.split(' ')[0].toLowerCase()}.albrandswaard@startblok.nl`;
    if (await User.findOne({ email })) { console.log(`[skip] vrijwilliger ${email}`); continue; }
    const u = new User({
      naam, email, role: ROLES.VRIJWILLIGER,
      goedgekeurd: true, actief: true, geheimhoudingAkkoord: true,
      activiteiten: [activiteit._id],
    });
    await u.setPassword(WACHTWOORD);
    await u.save();
    nieuweVrij++;
    console.log(`[nieuw] vrijwilliger ${email}`);
  }

  // --- 35 leerlingen ---
  let nieuweLeer = 0;
  for (let i = 0; i < 35; i++) {
    const naam = `${pick(VOORNAMEN, i)} ${pick(ACHTERNAMEN, i * 3 + 1)}`;
    // Idempotent op naam + locatie.
    if (await Leerling.findOne({ naam, locatie: locatie._id })) { console.log(`[skip] leerling ${naam}`); continue; }
    const bep = pick(BEPERKINGEN, i);
    const aandacht = [];
    if (i % 4 === 0) aandacht.push({ titel: 'Epilepsie', omschrijving: 'Let op bij vermoeidheid; volg het protocol.', urgentie: 'kritiek' });
    if (i % 3 === 0) aandacht.push({ titel: 'Medicatie', omschrijving: 'Gebruikt medicatie; navragen bij ouders.', urgentie: 'belangrijk' });
    if (i % 5 === 0) aandacht.push({ titel: 'Prikkelgevoelig', omschrijving: 'Vermijd harde geluiden bij het bad.', urgentie: 'info' });

    await Leerling.create({
      naam,
      geboortedatum: new Date(2012 + (i % 8), i % 12, (i % 27) + 1),
      typeBeperking: bep.type,
      beperkingCategorie: bep.cat,
      medischeAandachtspunten: aandacht,
      communicatieTips: pick(TIPS, i),
      watWerktWel: pick(['Herhaling', 'Spelvorm', 'Vaste begeleider', 'Belonen met sticker'], i),
      watWerktNiet: pick(['Tijdsdruk', 'Wisselende begeleiders', 'Drukke omgeving'], i),
      niveau: pick(NIVEAUS, i),
      locatie: locatie._id,
      activiteiten: [activiteit._id],
      contactNaam: `Ouder van ${naam.split(' ')[0]}`,
      contactTelefoon: `06-${String(10000000 + i * 137).slice(0, 8)}`,
    });
    nieuweLeer++;
  }

  console.log(`\nKlaar. ${nieuweVrij} vrijwilligers en ${nieuweLeer} leerlingen toegevoegd`);
  console.log(`aan "Zwemles - woensdagavond" @ Zwembad Albrandswaard.`);
  console.log(`Vrijwilligers inloggen met wachtwoord: ${WACHTWOORD}`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error('[fout]', err); process.exit(1); });
