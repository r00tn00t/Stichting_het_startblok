import mongoose from 'mongoose';

// Een vakantie/feestdag-periode waarin de lessen vervallen. Eén dag = van en
// tot dezelfde datum. Wordt gebruikt om dagen in de agenda te blokkeren.
const vakantieSchema = new mongoose.Schema(
  {
    naam: { type: String, required: true, trim: true },   // bv. "Herfstvakantie"
    van: { type: Date, required: true },                    // eerste dag (incl.)
    tot: { type: Date, required: true },                    // laatste dag (incl.)
  },
  { timestamps: true }
);

export const Vakantie = mongoose.model('Vakantie', vakantieSchema);
