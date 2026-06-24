import mongoose from 'mongoose';

// Eén voortgangsregel = een diploma-onderdeel / oefening voor één leerling.
// De "digitale zwemkaart" is de verzameling van deze regels per leerling.
const voortgangSchema = new mongoose.Schema(
  {
    leerling: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Leerling',
      required: true,
      index: true,
    },
    onderdeel: { type: String, required: true },   // bv. "Watertrappelen 10 sec"
    categorie: { type: String, default: '' },      // bv. "Diploma A", "Badje 1"
    status: {
      type: String,
      enum: ['nog-niet-begonnen', 'in-uitvoering', 'behaald'],
      default: 'nog-niet-begonnen',
    },
    notitie: { type: String, default: '' },        // observatie tijdens de les
    behaaldOp: { type: Date },
    geregistreerdDoor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Voortgang = mongoose.model('Voortgang', voortgangSchema);
