import mongoose from 'mongoose';

// Algemene kennis: oefeningen en tips per type beperking. Bevat GEEN
// persoonsgegevens — mag breed gelezen worden door alle rollen.
const kennisbankSchema = new mongoose.Schema(
  {
    titel: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['oefening', 'tip', 'pictogram', 'protocol'],
      default: 'tip',
    },
    // Voor welke beperkingscategorie(ën) relevant (leeg = algemeen).
    categorie: [{ type: String }],
    inhoud: { type: String, default: '' },          // uitleg / instructie (markdown)
    afbeeldingUrl: { type: String, default: '' },    // bv. pictogram
    tags: [{ type: String }],
    aangemaaktDoor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const KennisbankItem = mongoose.model('KennisbankItem', kennisbankSchema);
