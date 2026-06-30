// Eenmalig script: maakt 100 leerlingen + 30 vrijwilligers als mockdata,
// verspreid over alle locaties en hun activiteiten. Alle velden worden gevuld.
//
// Verwijdert eerst de eerdere mockdata (herkenbaar aan e-mailpatronen /
// example.nl en *.mock@startblok.nl) zodat je een schone set krijgt.
//
// Draaien:  node src/scripts/maakMockData.js
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Leerling } from '../models/Leerling.js';
import { Locatie } from '../models/Locatie.js';
import { Activiteit } from '../models/Activiteit.js';
import { ROLES } from '../config/roles.js';

const WACHTWOORD = 'Wachtwoord1!';

const VOORNAMEN = [
  'Sem', 'Liam', 'Noud', 'Finn', 'Luuk', 'Mees', 'Lars', 'Tess', 'Saar', 'Fenna',
  'Noa', 'Roos', 'Julia', 'Loïs', 'Sofie', 'Milan', 'Jesse', 'Bo', 'Cas', 'Joris',
  'Lieke', 'Mila', 'Yara', 'Sven', 'Thijs', 'Nina', 'Guus', 'Pim', 'Maud', 'Hugo',
  'Anne', 'Teun', 'Ruben', 'Floor', 'Kayleigh', 'Daan', 'Bram', 'Lotte', 'Eva', 'Tom',
  'Sanne', 'Jens', 'Lue', 'Fleur', 'Stijn', 'Isa', 'Jip', 'Sara', 'Kai', 'Noor',
  'Lena', 'Tygo', 'Vince', 'Benthe', 'Robin', 'Amber', 'Niels', 'Britt', 'Siem', 'Mara',
];
const ACHTERNAMEN = [
  'de Vries', 'Jansen', 'van den Berg', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer',
  'Mulder', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer',
  'de Wit', 'Dijkstra', 'Smeets', 'de Graaf', 'van Dijk', 'Janssen', 'Willems', 'Koster',
  'Prins', 'Huisman', 'Postma', 'Kuijpers', 'Veenstra', 'Kramer',
];
const STRATEN = ['Zwemlaan', 'Baanstraat', 'Waterweg', 'Duikersingel', 'Schoolslagpad', 'Vrijeslaglaan', 'Kanaalweg', 'Sportlaan'];
const SCHOLEN = ['De Regenboog (SO)', 'Mytylschool', 'Reguliere basisschool', 'Dagbesteding Het Anker', 'VSO De Brug', 'Tyltylschool'];

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
const TIJDSLOTS = ['18.00-18.30', '18.30-19.00', '19.00-19.30', '19.30-20.00', '20.00-20.45'];

const pick = (arr, i) => arr[i % arr.length];

async function run() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zwemstart');

  const locaties = await Locatie.find().lean();
  const activiteiten = await Activiteit.find().lean();
  if (!locaties.length || !activiteiten.length) {
    throw new Error('Geen locaties/activiteiten gevonden — draai eerst de seed.');
  }
  const actVoorLocatie = (locId) => activiteiten.filter((a) => String(a.locatie) === String(locId));

  // --- Oude mockdata opruimen ---
  const oudeLeer = await Leerling.deleteMany({ email: /@example\.nl$/ });
  const oudeVrij = await User.deleteMany({ email: /\.mock@startblok\.nl$/ });
  // ook de eerdere Albrandswaard-mock-vrijwilligers (vast patroon)
  const oudeAlb = await User.deleteMany({ email: /\.albrandswaard@startblok\.nl$/ });
  console.log(`[opschoning] leerlingen: ${oudeLeer.deletedCount}, vrijwilligers: ${oudeVrij.deletedCount + oudeAlb.deletedCount}`);

  // --- 30 vrijwilligers, rond-verdeeld over de activiteiten ---
  let nieuweVrij = 0;
  for (let i = 0; i < 30; i++) {
    const naam = `${pick(VOORNAMEN, i + 5)} ${pick(ACHTERNAMEN, i * 2 + 3)}`;
    const email = `vrijwilliger${i + 1}.mock@startblok.nl`;
    if (await User.findOne({ email })) continue;
    const act = activiteiten[i % activiteiten.length];
    const u = new User({
      naam, email, role: ROLES.VRIJWILLIGER,
      telefoon: `06-${String(20000000 + i * 271828).slice(0, 8)}`,
      goedgekeurd: true, actief: true, geheimhoudingAkkoord: true,
      activiteiten: [act._id],
    });
    await u.setPassword(WACHTWOORD);
    await u.save();
    nieuweVrij++;
  }

  // --- 100 leerlingen, rond-verdeeld over locaties + activiteiten ---
  let nieuweLeer = 0;
  for (let i = 0; i < 100; i++) {
    const voor = pick(VOORNAMEN, i);
    const naam = `${voor} ${pick(ACHTERNAMEN, i * 3 + 1)}`;
    const locatie = locaties[i % locaties.length];
    const locActs = actVoorLocatie(locatie._id);
    const act = locActs.length ? locActs[i % locActs.length] : null;
    const bep = pick(BEPERKINGEN, i);

    const aandacht = [];
    if (i % 4 === 0) aandacht.push({ titel: 'Toevallen / epilepsie', omschrijving: 'Let op bij vermoeidheid; volg het protocol.', urgentie: 'kritiek' });
    if (i % 3 === 0) aandacht.push({ titel: 'Medicijngebruik', omschrijving: 'Gebruikt medicatie; navragen bij ouders.', urgentie: 'belangrijk' });
    if (i % 5 === 0) aandacht.push({ titel: 'Allergieën', omschrijving: 'Pinda-allergie.', urgentie: 'belangrijk' });

    await Leerling.create({
      naam,
      voorletters: `${voor[0]}.`,
      geslacht: i % 2 === 0 ? 'Jongen' : 'Meisje',
      geboortedatum: new Date(2010 + (i % 10), i % 12, (i % 27) + 1),
      typeBeperking: bep.type,
      beperkingCategorie: bep.cat,
      beperkingOmschrijving: bep.oms,
      medischeAandachtspunten: aandacht,
      aandachtspunten: [pick(AANDACHTSPUNTEN, i)],
      communicatieTips: pick(TIPS, i),
      watWerktWel: pick(['Herhaling', 'Spelvorm', 'Vaste begeleider', 'Belonen met sticker'], i),
      watWerktNiet: pick(['Tijdsdruk', 'Wisselende begeleiders', 'Drukke omgeving'], i),
      locatie: locatie._id,
      activiteiten: act ? [act._id] : [],
      zwemtijd: pick(TIJDSLOTS, i),
      fysiotherapie: i % 3 === 0,
      fysiotherapiePraktijk: i % 3 === 0 ? 'FysioCentrum' : '',
      eerderGezwommen: i % 2 === 0,
      eerderToelichting: i % 2 === 0 ? 'Eerder Badje 1 gevolgd bij een andere club (half jaar).' : '',
      straatnaam: pick(STRATEN, i),
      huisnummer: String((i % 120) + 1),
      postcode: `${3000 + (i % 900)} ${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i + 7) % 26))}`,
      plaats: locatie.plaats,
      email: `ouder.${voor.toLowerCase()}${i}@example.nl`,
      dagbestedingSchool: pick(SCHOLEN, i),
      contactNaam: `Ouder van ${voor}`,
      contactTelefoon: `06-${String(10000000 + i * 137).slice(0, 8)}`,
      mediaWebsite: i % 2 === 0,
      mediaSocial: i % 3 === 0,
      mediaKrant: i % 4 === 0,
    });
    nieuweLeer++;
  }

  console.log(`\nKlaar. ${nieuweVrij} vrijwilligers en ${nieuweLeer} leerlingen aangemaakt,`);
  console.log(`verspreid over ${locaties.length} locaties. Wachtwoord: ${WACHTWOORD}`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error('[fout]', err); process.exit(1); });
