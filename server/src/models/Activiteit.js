import mongoose from 'mongoose';

// Een terugkerende activiteit/les op een locatie, bv. "Zwemles - maandagavond".
// Vrijwilligers schrijven zich in op activiteiten; coördinatoren beheren alle
// activiteiten van hun locatie(s); per activiteit + datum wordt een badindeling
// gemaakt (fase 2).
const activiteitSchema = new mongoose.Schema(
  {
    naam: { type: String, required: true, trim: true },      // bv. "Zwemles - maandagavond"
    locatie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Locatie',
      required: true,
      index: true,
    },
    weekdag: {
      type: String,
      enum: ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag', ''],
      default: '',
    },
    tijd: { type: String, default: '' },     // bv. "18:30-19:15" (vrij veld)
    soort: {
      type: String,
      enum: ['zwemles', 'activiteit'],        // sluit aan op Inschrijving.soort
      default: 'zwemles',
    },
    actief: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Activiteit = mongoose.model('Activiteit', activiteitSchema);
