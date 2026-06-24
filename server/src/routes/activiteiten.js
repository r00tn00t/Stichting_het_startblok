import { Router } from 'express';
import { Activiteit } from '../models/Activiteit.js';
import { requireAuth, requireRole, loadUserScope } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { magLocatieBeheren } from '../middleware/scope.js';

const router = Router();
router.use(requireAuth);
router.use(loadUserScope);

// GET /api/activiteiten?locatie=...  — lijst (lezen)
router.get('/', asyncHandler(async (req, res) => {
  const filter = { actief: true };
  if (req.query.locatie) filter.locatie = req.query.locatie;
  const activiteiten = await Activiteit.find(filter).populate('locatie', 'naam plaats').sort({ naam: 1 });
  res.json(activiteiten);
}));

// POST /api/activiteiten — coördinator (eigen locatie) of directie
router.post('/', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const { naam, locatie, weekdag, tijd, soort } = req.body || {};
  if (!naam || !locatie) {
    return res.status(400).json({ error: 'Naam en locatie zijn verplicht' });
  }
  if (!magLocatieBeheren(req.user, locatie)) {
    return res.status(403).json({ error: 'Je mag geen activiteiten voor deze locatie beheren' });
  }
  const activiteit = await Activiteit.create({ naam, locatie, weekdag, tijd, soort });
  res.status(201).json(activiteit);
}));

// PUT /api/activiteiten/:id
router.put('/:id', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const activiteit = await Activiteit.findById(req.params.id);
  if (!activiteit) return res.status(404).json({ error: 'Activiteit niet gevonden' });
  if (!magLocatieBeheren(req.user, activiteit.locatie)) {
    return res.status(403).json({ error: 'Je mag deze activiteit niet beheren' });
  }
  const { naam, weekdag, tijd, soort, actief } = req.body || {};
  Object.assign(activiteit, {
    ...(naam && { naam }),
    ...(weekdag !== undefined && { weekdag }),
    ...(tijd !== undefined && { tijd }),
    ...(soort && { soort }),
    ...(actief !== undefined && { actief }),
  });
  await activiteit.save();
  res.json(activiteit);
}));

export default router;
