import mongoose from 'mongoose';

export const AANWEZIGHEID_STATUSSEN = ['aanwezig', 'afgemeld', 'afwezig'];

// Aanwezigheidsregistratie per leerling, per activiteit, per datum. Onafhankelijk
// van de badindeling: een coördinator kan snel afvinken wie er was, ook zonder
// dat er ingedeeld is. 'afgemeld' = op tijd afgemeld; 'afwezig' = niet gekomen.
const aanwezigheidSchema = new mongoose.Schema(
  {
    leerling: { type: mongoose.Schema.Types.ObjectId, ref: 'Leerling', required: true, index: true },
    activiteit: { type: mongoose.Schema.Types.ObjectId, ref: 'Activiteit', required: true, index: true },
    datum: { type: Date, required: true, index: true },
    status: { type: String, enum: AANWEZIGHEID_STATUSSEN, default: 'aanwezig', required: true },
    geregistreerdDoor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Eén registratie per leerling per activiteit per dag.
aanwezigheidSchema.index({ leerling: 1, activiteit: 1, datum: 1 }, { unique: true });

export const Aanwezigheid = mongoose.model('Aanwezigheid', aanwezigheidSchema);
