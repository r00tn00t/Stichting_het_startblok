import mongoose from 'mongoose';

// Een losse agenda-afspraak/event (bv. diplomazwemmen, vergadering, uitje).
// Naast de terugkerende lessen. Beheer is voorbehouden aan de directie.
const afspraakSchema = new mongoose.Schema(
  {
    titel: { type: String, required: true, trim: true },
    datum: { type: Date, required: true, index: true },
    tijd: { type: String, default: '' },          // vrij veld, bv. "14:00-15:00"
    locatie: { type: mongoose.Schema.Types.ObjectId, ref: 'Locatie' }, // optioneel
    omschrijving: { type: String, default: '' },
    gemaaktDoor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Afspraak = mongoose.model('Afspraak', afspraakSchema);
