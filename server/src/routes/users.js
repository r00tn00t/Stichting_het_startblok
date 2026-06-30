import { Router } from 'express';
import { User } from '../models/User.js';
import { Activiteit } from '../models/Activiteit.js';
import { requireAuth, requireRole, loadUserScope } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(requireAuth);
// Gebruikersbeheer: minimaal coördinator. Directie mag alles; coördinator alleen
// vrijwilligers van de eigen locatie(s) — en kan geen coördinator/directie maken.
router.use(requireRole(ROLES.COORDINATOR));
router.use(loadUserScope);

const isDirectie = (req) => req.user.role === ROLES.DIRECTIE;

// Activiteit-id's die bij de locatie(s) van de coördinator horen.
async function eigenActiviteitIds(user) {
  const acts = await Activiteit.find({ locatie: { $in: user.locaties || [] } }).select('_id');
  return acts.map((a) => a._id.toString());
}

// Mag de coördinator deze (bestaande) gebruiker beheren? Vrijwilligers met een
// activiteit op de eigen locatie(s), of nog niet gekoppelde vrijwilligers (net
// aangemeld/aangemaakt — die moet de coördinator kunnen indelen).
function coordMagGebruiker(actIds, doelUser) {
  if (doelUser.role !== ROLES.VRIJWILLIGER) return false;
  if ((doelUser.activiteiten || []).length === 0) return true;
  const set = new Set(actIds);
  return doelUser.activiteiten.some((a) => set.has(a.toString()));
}

// GET /api/users — directie: iedereen; coördinator: eigen vrijwilligers +
// vrijwilligers die nog op goedkeuring wachten (zonder activiteit).
router.get('/', asyncHandler(async (req, res) => {
  if (isDirectie(req)) {
    return res.json(await User.find().sort({ naam: 1 }));
  }
  const actIds = await eigenActiviteitIds(req.user);
  const users = await User.find({
    role: ROLES.VRIJWILLIGER,
    $or: [
      { activiteiten: { $in: actIds } },
      { activiteiten: { $size: 0 } },   // nog niet gekoppeld (net aangemeld/aangemaakt)
      { goedgekeurd: false },           // wachtenden
    ],
  }).sort({ naam: 1 });
  res.json(users);
}));

// POST /api/users — nieuwe gebruiker
router.post('/', asyncHandler(async (req, res) => {
  const { naam, email, wachtwoord, role, locaties, activiteiten } = req.body || {};
  if (!naam || !email || !wachtwoord) {
    return res.status(400).json({ error: 'Naam, e-mail en wachtwoord verplicht' });
  }
  // Coördinator mag uitsluitend vrijwilligers aanmaken.
  const nieuweRol = role || ROLES.VRIJWILLIGER;
  if (!isDirectie(req) && nieuweRol !== ROLES.VRIJWILLIGER) {
    return res.status(403).json({ error: 'Een coördinator kan alleen vrijwilligers aanmaken' });
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(409).json({ error: 'E-mail al in gebruik' });
  }
  const user = new User({
    naam,
    email,
    role: nieuweRol,
    // Coördinator mag geen locaties toekennen (dat is een directie-recht).
    ...(isDirectie(req) && Array.isArray(locaties) && { locaties }),
    ...(Array.isArray(activiteiten) && { activiteiten }),
  });
  await user.setPassword(wachtwoord);
  await user.save();
  res.status(201).json(user);
}));

// PUT /api/users/:id — rol / actief / goedkeuring / koppelingen wijzigen
router.put('/:id', asyncHandler(async (req, res) => {
  const { role, actief, naam, goedgekeurd, locaties, activiteiten } = req.body || {};
  const doel = await User.findById(req.params.id);
  if (!doel) return res.status(404).json({ error: 'Gebruiker niet gevonden' });

  if (!isDirectie(req)) {
    // Coördinator: alleen eigen vrijwilligers, en niet promoveren.
    const actIds = await eigenActiviteitIds(req.user);
    const magAl = coordMagGebruiker(actIds, doel) || !doel.goedgekeurd;
    if (!magAl) {
      return res.status(403).json({ error: 'Je mag deze gebruiker niet beheren' });
    }
    if (role && role !== ROLES.VRIJWILLIGER) {
      return res.status(403).json({ error: 'Een coördinator kan geen coördinator of directie toekennen' });
    }
    if (locaties !== undefined) {
      return res.status(403).json({ error: 'Locaties toewijzen is voorbehouden aan directie' });
    }
  }

  Object.assign(doel, {
    ...(role && { role }),
    ...(naam && { naam }),
    ...(actief !== undefined && { actief }),
    ...(goedgekeurd !== undefined && { goedgekeurd }),
    ...(isDirectie(req) && Array.isArray(locaties) && { locaties }),
    ...(Array.isArray(activiteiten) && { activiteiten }),
  });
  await doel.save();
  res.json(doel);
}));

export default router;
