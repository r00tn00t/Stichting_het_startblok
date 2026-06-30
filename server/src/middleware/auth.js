import jwt from 'jsonwebtoken';
import { ROLE_RANK } from '../config/roles.js';
import { User } from '../models/User.js';

// Verifieert het JWT en hangt { id, role } aan req.user.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Niet ingelogd' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role, naam: payload.naam };
    next();
  } catch {
    return res.status(401).json({ error: 'Ongeldige of verlopen sessie' });
  }
}

// Laadt locaties/activiteiten van de ingelogde gebruiker op req.user (nodig voor
// scope-checks). Gebruik na requireAuth, op routes die op locatie/activiteit filteren.
export async function loadUserScope(req, res, next) {
  try {
    const u = await User.findById(req.user.id).select('locaties activiteiten role');
    if (!u) return res.status(401).json({ error: 'Gebruiker bestaat niet meer' });
    req.user.locaties = u.locaties || [];
    req.user.activiteiten = u.activiteiten || [];
    next();
  } catch (err) {
    next(err);
  }
}

// Vereist minimaal de opgegeven rol (op basis van rangorde).
export function requireRole(minRole) {
  return (req, res, next) => {
    const have = ROLE_RANK[req.user?.role] || 0;
    const need = ROLE_RANK[minRole] || 0;
    if (have < need) {
      return res.status(403).json({ error: 'Onvoldoende rechten' });
    }
    next();
  };
}
