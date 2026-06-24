import mongoose from 'mongoose';

// Een zwembad/locatie waar Het Startblok lessen en activiteiten geeft.
const locatieSchema = new mongoose.Schema(
  {
    naam: { type: String, required: true, trim: true },   // bv. "Zwembad de Viergang"
    plaats: { type: String, default: '' },                 // bv. "Pijnacker"
    actief: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Locatie = mongoose.model('Locatie', locatieSchema);
