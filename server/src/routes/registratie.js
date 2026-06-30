import { Router } from 'express';
import { User } from '../models/User.js';
import { Inschrijving } from '../models/Inschrijving.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// PUBLIEKE routes (geen auth). Voor aanmeldingen vanaf de website.
const router = Router();

// POST /api/registratie/vrijwilliger — open zelfregistratie van een vrijwilliger.
// Een zelf-geregistreerde vrijwilliger komt 'in afwachting' binnen (goedgekeurd:
// false) en heeft GEEN toegang tot dossiers tot de coördinator goedkeurt. Zo
// kan niet iedereen met de aanmeldlink direct gezondheidsgegevens inzien (AVG).
router.post('/vrijwilliger', asyncHandler(async (req, res) => {
  const { achternaam, email, telefoon, wachtwoord } = req.body || {};
  if (!achternaam || !email || !wachtwoord) {
    return res.status(400).json({ error: 'Achternaam, e-mail en wachtwoord zijn verplicht' });
  }
  if (String(wachtwoord).length < 8) {
    return res.status(400).json({ error: 'Wachtwoord moet minimaal 8 tekens zijn' });
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(409).json({ error: 'Er bestaat al een account met dit e-mailadres' });
  }
  const user = new User({
    naam: achternaam,
    email,
    telefoon,
    role: ROLES.VRIJWILLIGER,
    goedgekeurd: false, // wacht op goedkeuring door de coördinator
  });
  await user.setPassword(wachtwoord);
  await user.save();
  res.status(201).json({
    ok: true,
    message: 'Account aangemaakt. Een coördinator beoordeelt je aanmelding; je kunt inloggen zodra deze is goedgekeurd.',
  });
}));

// POST /api/registratie/inschrijving — leerling-inschrijving door ouder/verzorger.
// Komt binnen als status 'in-behandeling' (beoordelingscommissie / coördinator).
router.post('/inschrijving', asyncHandler(async (req, res) => {
  const { achternaam, roepnaam } = req.body || {};
  if (!achternaam || !roepnaam) {
    return res.status(400).json({ error: 'Achternaam en roepnaam zijn verplicht' });
  }
  if (!req.body.akkoordAlgemeneVoorwaarden) {
    return res.status(400).json({ error: 'Akkoord met de algemene voorwaarden is verplicht' });
  }
  // status forceren — mag niet door de client gezet worden.
  const inschrijving = await Inschrijving.create({
    ...req.body,
    status: 'in-behandeling',
    beoordeeldDoor: undefined,
    leerling: undefined,
  });
  res.status(201).json({
    ok: true,
    message: 'Bedankt! Je inschrijving is ontvangen en wordt beoordeeld.',
    id: inschrijving._id,
  });
}));

export default router;
