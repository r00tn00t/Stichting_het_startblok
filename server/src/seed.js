import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Leerling } from './models/Leerling.js';
import { Voortgang } from './models/Voortgang.js';
import { KennisbankItem } from './models/KennisbankItem.js';
import { kennisbankItems } from './data/kennisbank.js';
import { Inschrijving } from './models/Inschrijving.js';
import { ROLES } from './config/roles.js';

async function maakUser(naam, email, role) {
  const u = new User({ naam, email, role, geheimhoudingAkkoord: true });
  await u.setPassword('Wachtwoord1!');
  await u.save();
  return u;
}

async function run() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zwemstart');

  // Schone lei (alleen voor demo/seed — NIET in productie draaien).
  await Promise.all([
    User.deleteMany({}),
    Leerling.deleteMany({}),
    Voortgang.deleteMany({}),
    KennisbankItem.deleteMany({}),
    Inschrijving.deleteMany({}),
  ]);

  const coordinator = await maakUser('Coördinator Demo', 'coordinator@startblok.nl', ROLES.COORDINATOR);
  const trainer = await maakUser('Hoofdtrainer Demo', 'trainer@startblok.nl', ROLES.HOOFDTRAINER);
  await maakUser('Vrijwilliger Demo', 'vrijwilliger@startblok.nl', ROLES.VRIJWILLIGER);

  // Zelf-aangemelde vrijwilliger die nog op goedkeuring wacht (toont de goedkeur-UI).
  const wachtend = await maakUser('Sanne Wachtend', 'sanne@startblok.nl', ROLES.VRIJWILLIGER);
  wachtend.goedgekeurd = false;
  await wachtend.save();

  const sem = await Leerling.create({
    naam: 'Sem de Vries',
    typeBeperking: 'Autisme (ASS)',
    beperkingCategorie: 'gedrag-ontwikkeling',
    medischeAandachtspunten: [
      { titel: 'Prikkelgevoelig', omschrijving: 'Vermijd plotselinge harde geluiden bij het bad.', urgentie: 'belangrijk' },
    ],
    communicatieTips: 'Korte, duidelijke instructies. Gebruik pictogrammen. Geef vooraf aan wat er gaat gebeuren.',
    watWerktWel: 'Vaste structuur en herhaling.',
    watWerktNiet: 'Onverwachte wisselingen van begeleider.',
    niveau: 'Watervrij maken / Badje 1',
    contactNaam: 'Mevr. de Vries',
    contactTelefoon: '06-12345678',
    laatstGewijzigdDoor: trainer._id,
  });

  const lisa = await Leerling.create({
    naam: 'Lisa Jansen',
    typeBeperking: 'Spasticiteit (lichamelijk)',
    beperkingCategorie: 'lichamelijk',
    medischeAandachtspunten: [
      { titel: 'Beperkte beenkracht', omschrijving: 'Heeft drijfmiddel nodig bij benen.', urgentie: 'info' },
    ],
    communicatieTips: 'Spreekt goed, geef haar tijd om te reageren.',
    niveau: 'Zwemslag oefenen',
    laatstGewijzigdDoor: trainer._id,
  });

  await Voortgang.insertMany([
    { leerling: sem._id, onderdeel: 'Gezicht onder water', categorie: 'Watervrij', status: 'behaald', behaaldOp: new Date(), geregistreerdDoor: trainer._id },
    { leerling: sem._id, onderdeel: 'Drijven op de rug', categorie: 'Watervrij', status: 'in-uitvoering', notitie: 'Durft het bijna zonder steun.', geregistreerdDoor: trainer._id },
    { leerling: sem._id, onderdeel: 'Watertrappelen 10 sec', categorie: 'Diploma A', status: 'nog-niet-begonnen', geregistreerdDoor: trainer._id },
    { leerling: lisa._id, onderdeel: 'Schoolslag benen', categorie: 'Diploma A', status: 'in-uitvoering', notitie: 'Met drijfmiddel goed, zonder nog niet.', geregistreerdDoor: trainer._id },
  ]);

  await KennisbankItem.insertMany(
    kennisbankItems.map((item) => ({ ...item, aangemaaktDoor: coordinator._id }))
  );

  // Eén voorbeeld-inschrijving zodat het beheerscherm meteen iets toont.
  await Inschrijving.create({
    achternaam: 'Bakker',
    roepnaam: 'Noa',
    geslacht: 'Meisje',
    geboortedatum: new Date('2017-09-12'),
    straatnaam: 'Zwemlaan', huisnummer: '7', postcode: '1234 AB', plaats: 'Pijnacker',
    telefoon: '06-99887766', email: 'ouder.bakker@example.nl',
    bankrekeningnummer: 'NL00 BANK 0000 0000 00',
    gekozenLessen: ['Zwemles - maandagavond - de Viergang, Pijnacker'],
    beperkingNaam: 'Downsyndroom',
    beperkingOmschrijving: 'Vrolijk, maar heeft duidelijke structuur nodig.',
    medicijnen: false,
    aandoeningen: ['Motoriek-problemen'],
    aandachtspunten: ['waterangst'],
    mediaWebsite: true,
    akkoordInschrijfgeld: true, akkoordContributie: true, akkoordAlgemeneVoorwaarden: true,
    status: 'in-behandeling',
  });

  await Inschrijving.create({
    soort: 'activiteit',
    achternaam: 'de Wit',
    roepnaam: 'Karin',
    geslacht: 'Vrouw',
    geboortedatum: new Date('1979-02-20'),
    straatnaam: 'Baanlaan', huisnummer: '3', postcode: '2611 XY', plaats: 'Delft',
    telefoon: '06-11223344', email: 'karin.dewit@example.nl',
    bankrekeningnummer: 'NL00 BANK 1111 1111 11',
    gekozenLessen: ['Aquafit - dinsdagochtend - Zwembad de Veur, Zoetermeer'],
    beperkingNaam: 'Reuma',
    fysiotherapie: true, fysiotherapiePraktijk: 'FysioCentrum Delft',
    akkoordContributie: true, akkoordAlgemeneVoorwaarden: true,
    status: 'in-behandeling',
  });

  console.log('[seed] klaar. Login met *@startblok.nl / Wachtwoord1!');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed] mislukt:', err);
  process.exit(1);
});
