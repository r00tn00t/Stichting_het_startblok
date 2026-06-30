import { Router } from 'express';
import { Afspraak } from '../models/Afspraak.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(requireAuth);

function dagStart(s) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// GET /api/afspraken — lezen mag iedereen die is ingelogd.
router.get('/', asyncHandler(async (_req, res) => {
  const afspraken = await Afspraak.find().populate('locatie', 'naam plaats').sort({ datum: 1 });
  res.json(afspraken);
}));

// Beheer is voorbehouden aan de directie.
router.post('/', requireRole(ROLES.DIRECTIE), asyncHandler(async (req, res) => {
  const { titel, datum, tijd, locatie, omschrijving } = req.body || {};
  if (!titel || !datum) return res.status(400).json({ error: 'Titel en datum zijn verplicht' });
  const dag = dagStart(datum);
  if (!dag) return res.status(400).json({ error: 'Ongeldige datum' });
  const afspraak = await Afspraak.create({
    titel, datum: dag, tijd, omschrijving,
    ...(locatie && { locatie }),
    gemaaktDoor: req.user.id,
  });
  res.status(201).json(afspraak);
}));

router.put('/:id', requireRole(ROLES.DIRECTIE), asyncHandler(async (req, res) => {
  const { titel, datum, tijd, locatie, omschrijving } = req.body || {};
  const update = {};
  if (titel) update.titel = titel;
  if (datum) { const d = dagStart(datum); if (!d) return res.status(400).json({ error: 'Ongeldige datum' }); update.datum = d; }
  if (tijd !== undefined) update.tijd = tijd;
  if (omschrijving !== undefined) update.omschrijving = omschrijving;
  if (locatie !== undefined) update.locatie = locatie || undefined;
  const afspraak = await Afspraak.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!afspraak) return res.status(404).json({ error: 'Afspraak niet gevonden' });
  res.json(afspraak);
}));

router.delete('/:id', requireRole(ROLES.DIRECTIE), asyncHandler(async (req, res) => {
  const afspraak = await Afspraak.findByIdAndDelete(req.params.id);
  if (!afspraak) return res.status(404).json({ error: 'Afspraak niet gevonden' });
  res.json({ ok: true });
}));

export default router;
