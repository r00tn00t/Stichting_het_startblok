// Eenmalig script: maakt/actualiseert één coördinator per locatie in de
// BESTAANDE database (wist niets). Koppelt elke coördinator aan zijn locatie.
//
// Draaien:  node src/scripts/maakLocatieCoordinatoren.js
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Locatie } from '../models/Locatie.js';
import { ROLES } from '../config/roles.js';
import { locatieData } from '../data/locaties.js';

const WACHTWOORD = 'Wachtwoord1!';

async function run() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zwemstart');

  for (const loc of locatieData) {
    // Locatie zoeken op naam + plaats (zo werkt het ook als id's anders zijn).
    const locatie = await Locatie.findOne({ naam: loc.naam, plaats: loc.plaats });
    if (!locatie) {
      console.warn(`[skip] Locatie niet gevonden: ${loc.naam} (${loc.plaats})`);
      continue;
    }
    const email = `coordinator@${loc.key}.nl`;
    let user = await User.findOne({ email });
    if (user) {
      user.role = ROLES.COORDINATOR;
      user.goedgekeurd = true;
      user.actief = true;
      user.locaties = [locatie._id];
      await user.save();
      console.log(`[update] ${email} -> ${loc.naam}`);
    } else {
      user = new User({
        naam: `Coördinator ${loc.plaats}`,
        email,
        role: ROLES.COORDINATOR,
        goedgekeurd: true,
        actief: true,
        locaties: [locatie._id],
      });
      await user.setPassword(WACHTWOORD);
      await user.save();
      console.log(`[nieuw]  ${email} -> ${loc.naam}`);
    }
  }

  console.log(`\nKlaar. Inloggen met wachtwoord: ${WACHTWOORD}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[fout]', err);
  process.exit(1);
});
