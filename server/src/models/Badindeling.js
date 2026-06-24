import mongoose from 'mongoose';

// Eén toewijzing binnen een badindeling: een vrijwilliger met de kinderen die
// hij/zij die avond begeleidt (één vrijwilliger → meerdere kinderen).
const toewijzingSchema = new mongoose.Schema(
  {
    vrijwilliger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kinderen: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Leerling' }],
  },
  { _id: true }
);

// Een badindeling hoort bij één activiteit op één datum. De coördinator vinkt
// eerst de aanwezige kinderen aan (aanwezigheids-stap) en koppelt ze daarna
// aan vrijwilligers.
const badindelingSchema = new mongoose.Schema(
  {
    activiteit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activiteit',
      required: true,
      index: true,
    },
    // Datum (alleen de dag is relevant; opgeslagen als ISO-datum 00:00).
    datum: { type: Date, required: true, index: true },
    // Aanwezige kinderen die avond (subset van de kinderen van de activiteit).
    aanwezig: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Leerling' }],
    // Koppelingen vrijwilliger → kinderen.
    toewijzingen: [toewijzingSchema],
    gemaaktDoor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Eén badindeling per activiteit per dag.
badindelingSchema.index({ activiteit: 1, datum: 1 }, { unique: true });

export const Badindeling = mongoose.model('Badindeling', badindelingSchema);
