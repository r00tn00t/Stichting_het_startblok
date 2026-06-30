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

    // Koppeling aan locatie en activiteit(en). Bepaalt wie het kind mag zien:
    // coördinator van de locatie, en vrijwilligers die op dezelfde activiteit zitten.
    locatie: { type: mongoose.Schema.Types.ObjectId, ref: 'Locatie', index: true },
    activiteiten: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activiteit' }],
    // Vast tijdslot waarop het kind zwemt (bv. "19.00-19.30"), gekozen uit de
    // tijdsblokken van de activiteit/template. Getoond bij het indelen.
    zwemtijd: { type: String, default: '' },

    // Contactpersoon (ouder/verzorger) — minimale dataverzameling.
    contactNaam: { type: String, default: '' },
    contactTelefoon: { type: String, default: '' },

    // --- Overige gegevens overgenomen uit de inschrijving (volledig dossier) ---
    voorletters: { type: String, default: '' },
    geslacht: { type: String, default: '' },
    straatnaam: { type: String, default: '' },
    huisnummer: { type: String, default: '' },
    postcode: { type: String, default: '' },
    plaats: { type: String, default: '' },
    email: { type: String, default: '' },
    dagbestedingSchool: { type: String, default: '' },

    eerderGezwommen: { type: Boolean, default: false },
    eerderToelichting: { type: String, default: '' },

    beperkingOmschrijving: { type: String, default: '' },
    fysiotherapie: { type: Boolean, default: false },
    fysiotherapiePraktijk: { type: String, default: '' },

    // Medicijnen (eigen sectie op het dossier).
    medicijnen: { type: Boolean, default: false },
    medicijnenWelke: { type: String, default: '' },
    medicijnenLetOp: { type: Boolean, default: false },   // lesgevers rekening houden?
    medicijnenInstructie: { type: String, default: '' },  // waar op letten
    aandachtspunten: [{ type: String }],   // bv. waterangst, concentratieproblemen

    // Media-toestemming (AVG).
    mediaWebsite: { type: Boolean, default: false },
    mediaSocial: { type: Boolean, default: false },
    mediaKrant: { type: Boolean, default: false },

    // Verwijzing naar de oorspronkelijke inschrijving (herkomst).
    inschrijving: { type: mongoose.Schema.Types.ObjectId, ref: 'Inschrijving' },

    actief: { type: Boolean, default: true },

    // Audit: wie heeft dit dossier laatst aangepast.
    laatstGewijzigdDoor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Leerling = mongoose.model('Leerling', leerlingSchema);
