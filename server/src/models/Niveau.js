import mongoose from 'mongoose';

// Een zwemniveau (vaardigheid). Beheerbaar door de coördinator/directie, zodat
// de niveaulijst aangepast kan worden zonder code te wijzigen. `volgorde` bepaalt
// de weergavevolgorde (beginnend → volleerd).
const niveauSchema = new mongoose.Schema(
  {
    naam: { type: String, required: true, trim: true, unique: true },
    volgorde: { type: Number, default: 0 },
    actief: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Niveau = mongoose.model('Niveau', niveauSchema);
