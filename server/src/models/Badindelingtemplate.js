import mongoose from 'mongoose';

// Een template voor de badindeling: de vaste structuur (tijdsblokken met
// zone-/baannamen) zonder vrijwilligers of kinderen. Hoort bij een locatie en
// is herbruikbaar over de activiteiten van die locatie.
const templateBlokSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },   // bv. "19.00-19.30"
    zones: [{ type: String }],                   // alleen zone-namen, bv. ["ondiep", "Baan 1"]
  },
  { _id: true }
);

const badindelingtemplateSchema = new mongoose.Schema(
  {
    naam: { type: String, required: true, trim: true },   // bv. "Standaard maandag"
    locatie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Locatie',
      required: true,
      index: true,
    },
    blokken: [templateBlokSchema],
    gemaaktDoor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Badindelingtemplate = mongoose.model('Badindelingtemplate', badindelingtemplateSchema);
