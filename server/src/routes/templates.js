import { Router } from 'express';
import { Badindelingtemplate } from '../models/Badindelingtemplate.js';
import { requireAuth, requireRole, loadUserScope } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { magLocatieBeheren } from '../middleware/scope.js';

const router = Router();
router.use(requireAuth);
router.use(loadUserScope);

// Schoon de blokken op: lege labels/zone-namen weglaten.
function schoneBlokken(blokken) {
  return (blokken || [])
    .filter((b) => b && b.label)
    .map((b) => ({
      label: b.label,
      zones: (b.zones || []).map((z) => (typeof z === 'string' ? z : z?.naam || '')).filter(Boolean),
    }));
}

// GET /api/templates?locatie=...  — gescoped: directie alle, coördinator eigen.
router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === ROLES.COORDINATOR) {
    filter.locatie = { $in: req.user.locaties || [] };
  }
  if (req.query.locatie && req.user.role === ROLES.DIRECTIE) {
    filter.locatie = req.query.locatie;
  }
  const templates = await Badindelingtemplate.find(filter).populate('locatie', 'naam plaats').sort({ naam: 1 });
  res.json(templates);
}));

// POST /api/templates — coördinator (eigen locatie) of directie
router.post('/', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const { naam, locatie, blokken } = req.body || {};
  if (!naam || !locatie) {
    return res.status(400).json({ error: 'Naam en locatie zijn verplicht' });
  }
  if (!magLocatieBeheren(req.user, locatie)) {
    return res.status(403).json({ error: 'Je mag geen template voor deze locatie maken' });
  }
  const template = await Badindelingtemplate.create({
    naam,
    locatie,
    blokken: schoneBlokken(blokken),
    gemaaktDoor: req.user.id,
  });
  res.status(201).json(template);
}));

// PUT /api/templates/:id
router.put('/:id', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const template = await Badindelingtemplate.findById(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template niet gevonden' });
  if (!magLocatieBeheren(req.user, template.locatie)) {
    return res.status(403).json({ error: 'Je mag deze template niet beheren' });
  }
  const { naam, blokken } = req.body || {};
  if (naam) template.naam = naam;
  if (blokken !== undefined) template.blokken = schoneBlokken(blokken);
  await template.save();
  res.json(template);
}));

// DELETE /api/templates/:id
router.delete('/:id', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const template = await Badindelingtemplate.findById(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template niet gevonden' });
  if (!magLocatieBeheren(req.user, template.locatie)) {
    return res.status(403).json({ error: 'Je mag deze template niet verwijderen' });
  }
  await template.deleteOne();
  res.json({ ok: true });
}));

export default router;
