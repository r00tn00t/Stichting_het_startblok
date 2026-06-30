import { Router } from 'express';
import { Locatie } from '../models/Locatie.js';
import { Activiteit } from '../models/Activiteit.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(requireAuth);

// GET /api/locaties — alle locaties (lezen mag iedereen die is ingelogd)
router.get('/', asyncHandler(async (_req, res) => {
  const locaties = await Locatie.find({ actief: true }).sort({ naam: 1 });
  res.json(locaties);
}));

// GET /api/locaties/:id/activiteiten — activiteiten van een locatie
router.get('/:id/activiteiten', asyncHandler(async (req, res) => {
  const activiteiten = await Activiteit.find({ locatie: req.params.id, actief: true }).sort({ naam: 1 });
  res.json(activiteiten);
}));

// Beheer alleen voor directie (locaties zijn organisatiebreed).
router.post('/', requireRole(ROLES.DIRECTIE), asyncHandler(async (req, res) => {
  const locatie = await Locatie.create({ naam: req.body.naam, plaats: req.body.plaats });
  res.status(201).json(locatie);
}));

router.put('/:id', requireRole(ROLES.DIRECTIE), asyncHandler(async (req, res) => {
  const { naam, plaats, actief } = req.body || {};
  const locatie = await Locatie.findByIdAndUpdate(
    req.params.id,
    { ...(naam && { naam }), ...(plaats !== undefined && { plaats }), ...(actief !== undefined && { actief }) },
    { new: true, runValidators: true }
  );
  if (!locatie) return res.status(404).json({ error: 'Locatie niet gevonden' });
  res.json(locatie);
}));

export default router;
