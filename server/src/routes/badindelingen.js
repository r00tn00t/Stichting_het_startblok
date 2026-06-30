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

// Populatie van de hele indeling (zones -> vrijwilliger + kinderen).
function populeer(query) {
  return query
    .populate('blokken.zones.vrijwilliger', 'naam')
    .populate('blokken.zones.kinderen.leerling', 'naam typeBeperking');
}

// GET /api/badindelingen?activiteit=..&datum=YYYY-MM-DD
router.get('/', asyncHandler(async (req, res) => {
  const { activiteit, datum } = req.query;
  if (!activiteit || !datum) {
    return res.status(400).json({ error: 'activiteit en datum zijn verplicht' });
  }
  const dag = dagStart(datum);
  if (!dag) return res.status(400).json({ error: 'Ongeldige datum' });

  const act = await Activiteit.findById(activiteit).populate('locatie', 'naam plaats');
  if (!act) return res.status(404).json({ error: 'Activiteit niet gevonden' });

  const magBeheren = magActiviteitBeheren(req.user, act);
  if (!magBeheren && !zitOpActiviteit(req.user, act._id)) {
    return res.status(403).json({ error: 'Geen toegang tot deze activiteit' });
  }

  const indeling = await populeer(Badindeling.findOne({ activiteit, datum: dag }));
  res.json({ indeling, magBeheren, activiteit: act });
}));

// PUT /api/badindelingen — maak of werk de indeling bij (upsert).
router.put('/', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const { activiteit, datum, blokken = [], notities = '' } = req.body || {};
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

  // Lege ObjectId-velden (""), die niet casten, opschonen: een zone zonder
  // vrijwilliger en kinderen zonder leerling-id worden genegeerd.
  const schoneBlokken = (blokken || []).map((b) => ({
    label: b.label,
    zones: (b.zones || []).map((z) => ({
      naam: z.naam,
      vrijwilliger: z.vrijwilliger || undefined,
      kinderen: (z.kinderen || [])
        .filter((k) => k.leerling)
        .map((k) => ({ leerling: k.leerling, status: k.status || 'aanwezig', niveau: k.niveau || '' })),
    })),
  }));

  const indeling = await populeer(
    Badindeling.findOneAndUpdate(
      { activiteit, datum: dag },
      { activiteit, datum: dag, blokken: schoneBlokken, notities, gemaaktDoor: req.user.id },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
  );
  res.json(indeling);
}));

// GET /api/badindelingen/mijn?datum=YYYY-MM-DD — "mijn kinderen vandaag".
// Vrijwilliger ziet, over al zijn activiteiten heen, de zones waarin hij staat.
router.get('/mijn', asyncHandler(async (req, res) => {
  const dag = dagStart(req.query.datum || new Date().toISOString());
  if (!dag) return res.status(400).json({ error: 'Ongeldige datum' });
  const dagEinde = new Date(dag.getTime() + 24 * 60 * 60 * 1000);

  // Voor 'mijn dag' tonen we ook de belangrijke opmerkingen, dus extra velden.
  const indelingen = await Badindeling.find({ datum: { $gte: dag, $lt: dagEinde } })
    .populate('activiteit', 'naam weekdag tijd')
    .populate('blokken.zones.vrijwilliger', 'naam')
    .populate('blokken.zones.kinderen.leerling', 'naam typeBeperking zwemtijd communicatieTips medischeAandachtspunten');

  const resultaat = [];
  for (const ind of indelingen) {
    for (const blok of ind.blokken) {
      for (const zone of blok.zones) {
        if (zone.vrijwilliger?._id?.toString() === req.user.id) {
          resultaat.push({
            activiteit: ind.activiteit,
            blok: blok.label,
            zone: zone.naam,
            kinderen: zone.kinderen,
          });
        }
      }
    }
  }
  res.json(resultaat);
}));

export default router;
