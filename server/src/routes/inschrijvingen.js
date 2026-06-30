import { Router } from 'express';
import { Inschrijving } from '../models/Inschrijving.js';
import { Leerling } from '../models/Leerling.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(requireAuth);
// Inschrijvingen bevatten gevoelige gezondheidsgegevens -> alleen coördinator.
router.use(requireRole(ROLES.COORDINATOR));

// GET /api/inschrijvingen?status=in-behandeling
router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const lijst = await Inschrijving.find(filter).sort({ createdAt: -1 });
  res.json(lijst);
}));

// GET /api/inschrijvingen/:id — volledige inschrijving
router.get('/:id', asyncHandler(async (req, res) => {
  const ins = await Inschrijving.findById(req.params.id);
  if (!ins) return res.status(404).json({ error: 'Inschrijving niet gevonden' });
  res.json(ins);
}));

// Bouwt gestructureerde medische aandachtspunten op uit de inschrijving.
function bouwAandachtspunten(ins) {
  const punten = [];
  if (ins.toevallen) {
    punten.push({ titel: 'Toevallen / epilepsie', omschrijving: ins.toevallenWaarneming || '', urgentie: 'kritiek' });
  }
  if (ins.allergieen) {
    punten.push({ titel: 'Allergieën', omschrijving: ins.allergieenWelke || '', urgentie: 'belangrijk' });
  }
  if (ins.medicijnen) {
    // Combineer 'welke' + eventuele instructie voor de begeleiders.
    const delen = [ins.medicijnenWelke, ins.medicijnenInstructie].filter(Boolean);
    punten.push({
      titel: 'Medicijngebruik',
      omschrijving: delen.join(' — ') || '',
      // Als de lesgevers er rekening mee moeten houden: kritiek, anders belangrijk.
      urgentie: ins.medicijnenLetOp ? 'kritiek' : 'belangrijk',
    });
  }
  for (const a of ins.aandoeningen || []) {
    punten.push({ titel: a, omschrijving: '', urgentie: 'info' });
  }
  return punten;
}

// POST /api/inschrijvingen/:id/goedkeuren — maakt een Leerling-dossier aan.
router.post('/:id/goedkeuren', asyncHandler(async (req, res) => {
  const ins = await Inschrijving.findById(req.params.id);
  if (!ins) return res.status(404).json({ error: 'Inschrijving niet gevonden' });
  if (ins.status === 'goedgekeurd') {
    return res.status(409).json({ error: 'Deze inschrijving is al goedgekeurd' });
  }

  // Aandachtspunten = aangekruiste lijst + 'overig' (vrije tekst), samengevoegd.
  const aandachtspunten = [...(ins.aandachtspunten || [])];
  if (ins.aandachtspuntOverig) aandachtspunten.push(ins.aandachtspuntOverig);

  const leerling = await Leerling.create({
    naam: `${ins.roepnaam} ${ins.achternaam}`.trim(),
    voorletters: ins.voorletters,
    geslacht: ins.geslacht,
    geboortedatum: ins.geboortedatum,
    typeBeperking: ins.beperkingNaam,
    beperkingOmschrijving: ins.beperkingOmschrijving,
    medischeAandachtspunten: bouwAandachtspunten(ins),
    aandachtspunten,
    fysiotherapie: ins.fysiotherapie,
    fysiotherapiePraktijk: ins.fysiotherapiePraktijk,
    communicatieTips: '',
    watWerktWel: '',
    watWerktNiet: ins.overigeInformatie || '',
    eerderGezwommen: ins.eerderGezwommen,
    eerderToelichting: ins.eerderToelichting,
    // Adres & contact
    straatnaam: ins.straatnaam,
    huisnummer: ins.huisnummer,
    postcode: ins.postcode,
    plaats: ins.plaats,
    email: ins.email,
    dagbestedingSchool: ins.dagbestedingSchool,
    contactNaam: '', // ouder/verzorger; in te vullen door trainer
    contactTelefoon: ins.telefoon,
    // Media-toestemming
    mediaWebsite: ins.mediaWebsite,
    mediaSocial: ins.mediaSocial,
    mediaKrant: ins.mediaKrant,
    inschrijving: ins._id,
    laatstGewijzigdDoor: req.user.id,
  });

  ins.status = 'goedgekeurd';
  ins.beoordeeldDoor = req.user.id;
  ins.leerling = leerling._id;
  await ins.save();

  res.json({ ok: true, leerlingId: leerling._id });
}));

// POST /api/inschrijvingen/:id/afwijzen
router.post('/:id/afwijzen', asyncHandler(async (req, res) => {
  const ins = await Inschrijving.findByIdAndUpdate(
    req.params.id,
    { status: 'afgewezen', beoordeeldDoor: req.user.id },
    { new: true }
  );
  if (!ins) return res.status(404).json({ error: 'Inschrijving niet gevonden' });
  res.json({ ok: true });
}));

export default router;
