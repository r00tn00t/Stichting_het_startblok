import { Router } from 'express';
import { Leerling } from '../models/Leerling.js';
import { Voortgang } from '../models/Voortgang.js';
import { requireAuth, requireRole, loadUserScope } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { leerlingZichtbaarheidFilter, magLeerlingZien } from '../middleware/scope.js';

const router = Router();

// Alle endpoints vereisen login. Lezen is gefilterd op rol/locatie/activiteit;
// schrijven >= coördinator (eigen locatie); verwijderen idem.
router.use(requireAuth);
router.use(loadUserScope);

// GET /api/leerlingen — lijst, gefilterd op zichtbaarheid (rol + locatie/activiteit)
router.get('/', asyncHandler(async (req, res) => {
  const filter = { actief: true, ...leerlingZichtbaarheidFilter(req.user) };
  const leerlingen = await Leerling.find(filter).sort({ naam: 1 });
  res.json(leerlingen);
}));

// GET /api/leerlingen/:id — detail incl. zwemkaart (lezen)
router.get('/:id', asyncHandler(async (req, res) => {
  const leerling = await Leerling.findById(req.params.id);
  if (!leerling) return res.status(404).json({ error: 'Leerling niet gevonden' });
  if (!magLeerlingZien(req.user, leerling)) {
    return res.status(403).json({ error: 'Je hebt geen toegang tot dit dossier' });
  }
  const voortgang = await Voortgang.find({ leerling: leerling._id }).sort({ categorie: 1, onderdeel: 1 });
  res.json({ leerling, voortgang });
}));

// POST /api/leerlingen — nieuw (schrijven)
router.post('/', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const leerling = await Leerling.create({
    ...req.body,
    laatstGewijzigdDoor: req.user.id,
  });
  res.status(201).json(leerling);
}));

// PUT /api/leerlingen/:id — bewerken (schrijven)
router.put('/:id', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const leerling = await Leerling.findByIdAndUpdate(
    req.params.id,
    { ...req.body, laatstGewijzigdDoor: req.user.id },
    { new: true, runValidators: true }
  );
  if (!leerling) return res.status(404).json({ error: 'Leerling niet gevonden' });
  res.json(leerling);
}));

// DELETE /api/leerlingen/:id — alleen coördinator (soft delete)
router.delete('/:id', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const leerling = await Leerling.findByIdAndUpdate(
    req.params.id,
    { actief: false, laatstGewijzigdDoor: req.user.id },
    { new: true }
  );
  if (!leerling) return res.status(404).json({ error: 'Leerling niet gevonden' });
  res.json({ ok: true });
}));

// --- Voortgang (digitale zwemkaart) ---

// POST /api/leerlingen/:id/voortgang — nieuwe regel (schrijven)
router.post('/:id/voortgang', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const regel = await Voortgang.create({
    ...req.body,
    leerling: req.params.id,
    geregistreerdDoor: req.user.id,
    behaaldOp: req.body.status === 'behaald' ? new Date() : undefined,
  });
  res.status(201).json(regel);
}));

// PUT /api/leerlingen/:id/voortgang/:vid — status bijwerken (schrijven)
router.put('/:id/voortgang/:vid', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const update = { ...req.body, geregistreerdDoor: req.user.id };
  if (req.body.status === 'behaald') update.behaaldOp = new Date();
  const regel = await Voortgang.findByIdAndUpdate(req.params.vid, update, {
    new: true,
    runValidators: true,
  });
  if (!regel) return res.status(404).json({ error: 'Voortgangsregel niet gevonden' });
  res.json(regel);
}));

export default router;
