import { Router } from 'express';
import { Vakantie } from '../models/Vakantie.js';
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

// GET /api/vakanties — lijst (lezen mag iedereen die is ingelogd).
router.get('/', asyncHandler(async (_req, res) => {
  const vakanties = await Vakantie.find().sort({ van: 1 });
  res.json(vakanties);
}));

// POST /api/vakanties — coördinator/directie
router.post('/', requireRole(ROLES.DIRECTIE), asyncHandler(async (req, res) => {
  const { naam, van, tot } = req.body || {};
  if (!naam || !van || !tot) return res.status(400).json({ error: 'Naam, van en tot zijn verplicht' });
  const v1 = dagStart(van), v2 = dagStart(tot);
  if (!v1 || !v2) return res.status(400).json({ error: 'Ongeldige datum' });
  if (v2 < v1) return res.status(400).json({ error: 'Einddatum ligt voor de startdatum' });
  const vakantie = await Vakantie.create({ naam, van: v1, tot: v2 });
  res.status(201).json(vakantie);
}));

// PUT /api/vakanties/:id
router.put('/:id', requireRole(ROLES.DIRECTIE), asyncHandler(async (req, res) => {
  const { naam, van, tot } = req.body || {};
  const update = {};
  if (naam) update.naam = naam;
  if (van) { const d = dagStart(van); if (!d) return res.status(400).json({ error: 'Ongeldige van-datum' }); update.van = d; }
  if (tot) { const d = dagStart(tot); if (!d) return res.status(400).json({ error: 'Ongeldige tot-datum' }); update.tot = d; }
  const vakantie = await Vakantie.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!vakantie) return res.status(404).json({ error: 'Vakantie niet gevonden' });
  res.json(vakantie);
}));

// DELETE /api/vakanties/:id
router.delete('/:id', requireRole(ROLES.DIRECTIE), asyncHandler(async (req, res) => {
  const vakantie = await Vakantie.findByIdAndDelete(req.params.id);
  if (!vakantie) return res.status(404).json({ error: 'Vakantie niet gevonden' });
  res.json({ ok: true });
}));

export default router;
