// Eenmalig: voegt de vakanties/feestdagen 2025/2026 toe aan de bestaande
// database zonder iets te wissen. Idempotent (op naam + van).
//
// Draaien:  node src/scripts/maakVakanties.js
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Vakantie } from '../models/Vakantie.js';
import { vakantieData } from '../data/vakanties.js';

async function run() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zwemstart');
  let nieuw = 0;
  for (const v of vakantieData) {
    const van = new Date(v.van);
    if (await Vakantie.findOne({ naam: v.naam, van })) { console.log(`[skip] ${v.naam}`); continue; }
    await Vakantie.create({ naam: v.naam, van, tot: new Date(v.tot) });
    nieuw++;
    console.log(`[nieuw] ${v.naam}`);
  }
  console.log(`\nKlaar. ${nieuw} vakanties toegevoegd.`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error('[fout]', err); process.exit(1); });
