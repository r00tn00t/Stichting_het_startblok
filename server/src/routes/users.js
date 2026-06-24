import { Router } from 'express';
import { User } from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(requireAuth);

// Gebruikersbeheer is voorbehouden aan de coördinator. Nieuwe gebruikers worden
// door de coördinator aangemaakt (geen zelfregistratie) — zie auth-flow keuze.
router.use(requireRole(ROLES.COORDINATOR));

// GET /api/users
router.get('/', asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ naam: 1 });
  res.json(users);
}));

// POST /api/users — nieuwe gebruiker
router.post('/', asyncHandler(async (req, res) => {
  const { naam, email, wachtwoord, role } = req.body || {};
  if (!naam || !email || !wachtwoord) {
    return res.status(400).json({ error: 'Naam, e-mail en wachtwoord verplicht' });
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(409).json({ error: 'E-mail al in gebruik' });
  }
  const user = new User({ naam, email, role });
  await user.setPassword(wachtwoord);
  await user.save();
  res.status(201).json(user);
}));

// PUT /api/users/:id — rol / actief / goedkeuring wijzigen
router.put('/:id', asyncHandler(async (req, res) => {
  const { role, actief, naam, goedgekeurd } = req.body || {};
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      ...(role && { role }),
      ...(naam && { naam }),
      ...(actief !== undefined && { actief }),
      ...(goedgekeurd !== undefined && { goedgekeurd }),
    },
    { new: true, runValidators: true }
  );
  if (!user) return res.status(404).json({ error: 'Gebruiker niet gevonden' });
  res.json(user);
}));

export default router;
