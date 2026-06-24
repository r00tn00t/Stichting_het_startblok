import mongoose from 'mongoose';

// Statussen uit de papieren indeling (legenda): normaal aanwezig, nieuw,
// opgeroepen, afwezig, verplaatst, met taxi.
export const KIND_STATUSSEN = ['aanwezig', 'nieuw', 'oproep', 'afwezig', 'verplaatst', 'taxi'];
export const DIPLOMA_NIVEAUS = ['', 'A', 'B', 'C'];

// Eén kind binnen een zone: verwijzing + status + diplomaniveau (B/C-markering).
const kindplaatsSchema = new mongoose.Schema(
  {
    leerling: { type: mongoose.Schema.Types.ObjectId, ref: 'Leerling', required: true },
    status: { type: String, enum: KIND_STATUSSEN, default: 'aanwezig' },
    niveau: { type: String, enum: DIPLOMA_NIVEAUS, default: '' },
  },
  { _id: false }
);

// Eén zone/baan binnen een tijdsblok: naam (instelbaar door coördinator),
// een vrijwilliger en de kinderen die daar zwemmen.
const zoneSchema = new mongoose.Schema(
  {
    naam: { type: String, required: true },          // bv. "ondiep", "Baan 1", "Baan 3 diep"
    vrijwilliger: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    kinderen: [kindplaatsSchema],
  },
  { _id: true }
);

// Eén tijdsblok binnen een avond: label + zones.
const blokSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },         // bv. "19.00-19.30"
    zones: [zoneSchema],
  },
  { _id: true }
);

// Een badindeling hoort bij één activiteit op één datum en bevat tijdsblokken
// met instelbare zones. De coördinator richt de zones zelf in per locatie.
const badindelingSchema = new mongoose.Schema(
  {
    activiteit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activiteit',
      required: true,
      index: true,
    },
    datum: { type: Date, required: true, index: true },
    blokken: [blokSchema],
    // Vrije notities (bv. "Taxi Daisy", "Anneloes afwezig").
    notities: { type: String, default: '' },
    gemaaktDoor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Eén badindeling per activiteit per dag.
badindelingSchema.index({ activiteit: 1, datum: 1 }, { unique: true });

export const Badindeling = mongoose.model('Badindeling', badindelingSchema);
