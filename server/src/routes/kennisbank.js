import { Router } from 'express';
import { KennisbankItem } from '../models/KennisbankItem.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(requireAuth);

// GET /api/kennisbank?categorie=...  (lezen)
router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.categorie) filter.categorie = req.query.categorie;
  const items = await KennisbankItem.find(filter).sort({ type: 1, titel: 1 });
  res.json(items);
}));

// POST /api/kennisbank — toevoegen (schrijven)
router.post('/', requireRole(ROLES.HOOFDTRAINER), asyncHandler(async (req, res) => {
  const item = await KennisbankItem.create({ ...req.body, aangemaaktDoor: req.user.id });
  res.status(201).json(item);
}));

// DELETE /api/kennisbank/:id — coördinator
router.delete('/:id', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const item = await KennisbankItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item niet gevonden' });
  res.json({ ok: true });
}));

export default router;
