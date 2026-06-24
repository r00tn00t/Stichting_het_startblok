import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, naam: user.naam },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, wachtwoord } = req.body || {};
  if (!email || !wachtwoord) {
    return res.status(400).json({ error: 'E-mail en wachtwoord verplicht' });
  }
  // passwordHash heeft select:false, dus expliciet selecteren.
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.actief || !(await user.checkPassword(wachtwoord))) {
    return res.status(401).json({ error: 'Onjuiste inloggegevens' });
  }
  res.json({ token: signToken(user), user: user.toJSON() });
}));

// GET /api/auth/me — huidige gebruiker
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Gebruiker niet gevonden' });
  res.json(user);
}));

export default router;
