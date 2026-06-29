// Eenmalig: voegt de standaard-niveaus (12 vaardigheden) toe aan de bestaande
// database zonder iets te wissen. Idempotent (bestaande namen overslaan).
//
// Draaien:  node src/scripts/maakNiveaus.js
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Niveau } from '../models/Niveau.js';
import { NIVEAUS } from '../data/niveaus.js';

async function run() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zwemstart');
  let nieuw = 0;
  for (let i = 0; i < NIVEAUS.length; i++) {
    const naam = NIVEAUS[i];
    if (await Niveau.findOne({ naam })) { console.log(`[skip] ${naam}`); continue; }
    await Niveau.create({ naam, volgorde: i });
    nieuw++;
    console.log(`[nieuw] ${naam}`);
  }
  console.log(`\nKlaar. ${nieuw} niveaus toegevoegd.`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error('[fout]', err); process.exit(1); });
