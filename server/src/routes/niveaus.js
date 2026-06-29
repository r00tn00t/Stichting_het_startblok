import { Router } from 'express';
import { Niveau } from '../models/Niveau.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(requireAuth);

// GET /api/niveaus — lijst (lezen mag iedereen die is ingelogd), op volgorde.
router.get('/', asyncHandler(async (_req, res) => {
  const niveaus = await Niveau.find({ actief: true }).sort({ volgorde: 1, naam: 1 });
  res.json(niveaus);
}));

// Beheer is voorbehouden aan coördinator/directie (niveaulijst is organisatiebreed).
// POST /api/niveaus
router.post('/', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const { naam, volgorde } = req.body || {};
  if (!naam) return res.status(400).json({ error: 'Naam is verplicht' });
  if (await Niveau.findOne({ naam: naam.trim() })) {
    return res.status(409).json({ error: 'Dit niveau bestaat al' });
  }
  const aantal = await Niveau.countDocuments();
  const niveau = await Niveau.create({ naam: naam.trim(), volgorde: volgorde ?? aantal });
  res.status(201).json(niveau);
}));

// PUT /api/niveaus/:id — naam of volgorde wijzigen
router.put('/:id', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const { naam, volgorde, actief } = req.body || {};
  const niveau = await Niveau.findByIdAndUpdate(
    req.params.id,
    {
      ...(naam && { naam: naam.trim() }),
      ...(volgorde !== undefined && { volgorde }),
      ...(actief !== undefined && { actief }),
    },
    { new: true, runValidators: true }
  );
  if (!niveau) return res.status(404).json({ error: 'Niveau niet gevonden' });
  res.json(niveau);
}));

// DELETE /api/niveaus/:id
router.delete('/:id', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const niveau = await Niveau.findByIdAndDelete(req.params.id);
  if (!niveau) return res.status(404).json({ error: 'Niveau niet gevonden' });
  res.json({ ok: true });
}));

export default router;
