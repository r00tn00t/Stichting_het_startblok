import { Router } from 'express';
import { Badindeling } from '../models/Badindeling.js';
import { Activiteit } from '../models/Activiteit.js';
import { requireAuth, requireRole, loadUserScope } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { magActiviteitBeheren, zitOpActiviteit } from '../middleware/scope.js';

const router = Router();
router.use(requireAuth);
router.use(loadUserScope);

// Normaliseer een datum-string naar middernacht UTC, zodat 1 dag = 1 indeling.
function dagStart(datumStr) {
  const d = new Date(datumStr);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// GET /api/badindelingen?activiteit=..&datum=YYYY-MM-DD
// Coördinator/directie: de volledige indeling. Vrijwilliger: alleen als hij op
// de activiteit zit (hij ziet de hele indeling, incl. wie welke kinderen heeft).
router.get('/', asyncHandler(async (req, res) => {
  const { activiteit, datum } = req.query;
  if (!activiteit || !datum) {
    return res.status(400).json({ error: 'activiteit en datum zijn verplicht' });
  }
  const dag = dagStart(datum);
  if (!dag) return res.status(400).json({ error: 'Ongeldige datum' });

  const act = await Activiteit.findById(activiteit);
  if (!act) return res.status(404).json({ error: 'Activiteit niet gevonden' });

  const magBeheren = magActiviteitBeheren(req.user, act);
  if (!magBeheren && !zitOpActiviteit(req.user, act._id)) {
    return res.status(403).json({ error: 'Geen toegang tot deze activiteit' });
  }

  const indeling = await Badindeling.findOne({ activiteit, datum: dag })
    .populate('aanwezig', 'naam')
    .populate('toewijzingen.vrijwilliger', 'naam')
    .populate('toewijzingen.kinderen', 'naam');

  res.json({ indeling, magBeheren });
}));

// PUT /api/badindelingen — maak of werk de indeling bij (upsert) voor activiteit+datum.
// Alleen coördinator (eigen locatie) of directie.
router.put('/', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const { activiteit, datum, aanwezig = [], toewijzingen = [] } = req.body || {};
  if (!activiteit || !datum) {
    return res.status(400).json({ error: 'activiteit en datum zijn verplicht' });
  }
  const dag = dagStart(datum);
  if (!dag) return res.status(400).json({ error: 'Ongeldige datum' });

  const act = await Activiteit.findById(activiteit);
  if (!act) return res.status(404).json({ error: 'Activiteit niet gevonden' });
  if (!magActiviteitBeheren(req.user, act)) {
    return res.status(403).json({ error: 'Je mag deze activiteit niet indelen' });
  }

  const indeling = await Badindeling.findOneAndUpdate(
    { activiteit, datum: dag },
    {
      activiteit,
      datum: dag,
      aanwezig,
      // alleen toewijzingen met een vrijwilliger bewaren
      toewijzingen: toewijzingen.filter((t) => t.vrijwilliger),
      gemaaktDoor: req.user.id,
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  )
    .populate('aanwezig', 'naam')
    .populate('toewijzingen.vrijwilliger', 'naam')
    .populate('toewijzingen.kinderen', 'naam');

  res.json(indeling);
}));

// GET /api/badindelingen/mijn?datum=YYYY-MM-DD — "mijn kinderen vandaag".
// Vrijwilliger ziet de kinderen die hem op die datum zijn toegewezen, over al
// zijn activiteiten heen.
router.get('/mijn', asyncHandler(async (req, res) => {
  const datum = req.query.datum;
  const dag = dagStart(datum || new Date().toISOString());
  if (!dag) return res.status(400).json({ error: 'Ongeldige datum' });

  const dagEinde = new Date(dag.getTime() + 24 * 60 * 60 * 1000);
  const indelingen = await Badindeling.find({
    datum: { $gte: dag, $lt: dagEinde },
    'toewijzingen.vrijwilliger': req.user.id,
  })
    .populate('activiteit', 'naam weekdag tijd')
    .populate('toewijzingen.vrijwilliger', 'naam')
    .populate('toewijzingen.kinderen', 'naam typeBeperking niveau');

  // Trek per indeling alleen de eigen toewijzing eruit.
  const resultaat = indelingen.map((ind) => {
    const eigen = ind.toewijzingen.find(
      (t) => t.vrijwilliger?._id?.toString() === req.user.id
    );
    return {
      activiteit: ind.activiteit,
      datum: ind.datum,
      kinderen: eigen ? eigen.kinderen : [],
    };
  });
  res.json(resultaat);
}));

export default router;
