import mongoose from 'mongoose';

// Subdocument voor medische / aandachtspunten. Bewust gestructureerd zodat
// belangrijke veiligheidsinfo (bv. epilepsie) niet in vrije tekst verdwijnt.
const aandachtspuntSchema = new mongoose.Schema(
  {
    titel: { type: String, required: true },        // bv. "Epilepsie"
    omschrijving: { type: String, default: '' },    // wat te doen / waarop letten
    urgentie: {
      type: String,
      enum: ['info', 'belangrijk', 'kritiek'],
      default: 'info',
    },
  },
  { _id: true }
);

const leerlingSchema = new mongoose.Schema(
  {
    naam: { type: String, required: true, trim: true },
    geboortedatum: { type: Date },
    // Type beperking — vrij veld + categorie voor filtering/kennisbank-koppeling.
    typeBeperking: { type: String, trim: true },          // bv. "Autisme (ASS)"
    beperkingCategorie: {
      type: String,
      enum: [
        'lichamelijk',
        'verstandelijk',
        'zintuiglijk',
        'gedrag-ontwikkeling',
        'meervoudig',
        'overig',
      ],
      default: 'overig',
    },

    medischeAandachtspunten: [aandachtspuntSchema],
    communicatieTips: { type: String, default: '' },     // hoe communiceer je het best
    watWerktWel: { type: String, default: '' },
    watWerktNiet: { type: String, default: '' },

    niveau: { type: String, default: '' },               // huidige vaardigheid (zie data/niveaus.js)
    niveauToelichting: { type: String, default: '' },    // vrije toelichting bij het niveau

    // Koppeling aan locatie en activiteit(en). Bepaalt wie het kind mag zien:
    // coördinator van de locatie, en vrijwilligers die op dezelfde activiteit zitten.
    locatie: { type: mongoose.Schema.Types.ObjectId, ref: 'Locatie', index: true },
    activiteiten: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activiteit' }],

    // Contactpersoon (ouder/verzorger) — minimale dataverzameling.
    contactNaam: { type: String, default: '' },
    contactTelefoon: { type: String, default: '' },

    actief: { type: Boolean, default: true },

    // Audit: wie heeft dit dossier laatst aangepast.
    laatstGewijzigdDoor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Leerling = mongoose.model('Leerling', leerlingSchema);
