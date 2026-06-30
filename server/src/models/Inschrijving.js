import mongoose from 'mongoose';

// Een publiek ingediende leerling-inschrijving (door ouder/verzorger).
// Bevat bijzondere persoonsgegevens (gezondheid) -> AVG: vertrouwelijk, alleen
// toegankelijk voor de coördinator (beoordelingscommissie). Wordt na goedkeuring
// omgezet naar een Leerling-dossier.
const inschrijvingSchema = new mongoose.Schema(
  {
    // Soort inschrijving: zwemles (kind, met inschrijfgeld) of overige activiteit
    // (volwassenen/recreatief, alleen contributie).
    soort: {
      type: String,
      enum: ['zwemles', 'activiteit'],
      default: 'zwemles',
      index: true,
    },

    // --- Lid / kind ---
    achternaam: { type: String, required: true, trim: true },
    voorletters: { type: String, default: '' },
    roepnaam: { type: String, required: true, trim: true },
    geslacht: { type: String, default: '' },
    geboortedatum: { type: Date },

    // --- Adres ---
    straatnaam: { type: String, default: '' },
    huisnummer: { type: String, default: '' },
    postcode: { type: String, default: '' },
    plaats: { type: String, default: '' },

    // --- Contact ---
    telefoon: { type: String, default: '' },
    email: { type: String, default: '', lowercase: true, trim: true },
    dagbestedingSchool: { type: String, default: '' },
    bankrekeningnummer: { type: String, default: '' },

    // --- Akkoorden (financieel) ---
    akkoordInschrijfgeld: { type: Boolean, default: false },
    akkoordContributie: { type: Boolean, default: false },
    akkoordAlgemeneVoorwaarden: { type: Boolean, default: false },

    // --- Zwemles-keuze ---
    gekozenLessen: [{ type: String }],
    eerderGezwommen: { type: Boolean, default: false },
    eerderToelichting: { type: String, default: '' },

    // --- Vragenlijst aard van de beperking (gezondheid) ---
    beperkingNaam: { type: String, default: '' },
    beperkingOmschrijving: { type: String, default: '' },
    toevallen: { type: Boolean, default: false },
    toevallenWaarneming: { type: String, default: '' },
    allergieen: { type: Boolean, default: false },
    allergieenWelke: { type: String, default: '' },
    medicijnen: { type: Boolean, default: false },
    medicijnenWelke: { type: String, default: '' },
    // Moeten de lesgevers rekening houden met de medicijnen, en zo ja waarmee?
    medicijnenLetOp: { type: Boolean, default: false },
    medicijnenInstructie: { type: String, default: '' },
    fysiotherapie: { type: Boolean, default: false },
    fysiotherapiePraktijk: { type: String, default: '' },
    overigeInformatie: { type: String, default: '' },

    // --- Aankruislijst aandoeningen ---
    aandoeningen: [{ type: String }],     // bv. 'KNO-problemen', 'Astma/COPD', 'ADHD'
    aandoeningOverig: { type: String, default: '' },

    // --- Aanvullende aandachtspunten ---
    aandachtspunten: [{ type: String }],  // bv. 'waterangst', 'concentratieproblemen'
    aandachtspuntOverig: { type: String, default: '' },

    // --- Media-toestemming ---
    mediaWebsite: { type: Boolean, default: false },
    mediaSocial: { type: Boolean, default: false },
    mediaKrant: { type: Boolean, default: false },

    // --- Verwerkingsstatus (beoordeling) ---
    status: {
      type: String,
      enum: ['in-behandeling', 'goedgekeurd', 'afgewezen'],
      default: 'in-behandeling',
      index: true,
    },
    beoordeeldDoor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Verwijzing naar het aangemaakte leerlingdossier (na goedkeuring).
    leerling: { type: mongoose.Schema.Types.ObjectId, ref: 'Leerling' },
  },
  { timestamps: true }
);

export const Inschrijving = mongoose.model('Inschrijving', inschrijvingSchema);
