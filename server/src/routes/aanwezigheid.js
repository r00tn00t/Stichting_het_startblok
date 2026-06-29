import { Router } from 'express';
import { Aanwezigheid } from '../models/Aanwezigheid.js';
import { Activiteit } from '../models/Activiteit.js';
import { Leerling } from '../models/Leerling.js';
import { requireAuth, requireRole, loadUserScope } from '../middleware/auth.js';
import { ROLES } from '../config/roles.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { magActiviteitBeheren, zitOpActiviteit, magLeerlingZien } from '../middleware/scope.js';

const router = Router();
router.use(requireAuth);
router.use(loadUserScope);

function dagStart(datumStr) {
  const d = new Date(datumStr);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// GET /api/aanwezigheid?activiteit=..&datum=YYYY-MM-DD
// Geeft de leerlingen van de activiteit + hun status op die datum (default 'aanwezig').
router.get('/', asyncHandler(async (req, res) => {
  const { activiteit, datum } = req.query;
  if (!activiteit || !datum) return res.status(400).json({ error: 'activiteit en datum zijn verplicht' });
  const dag = dagStart(datum);
  if (!dag) return res.status(400).json({ error: 'Ongeldige datum' });

  const act = await Activiteit.findById(activiteit);
  if (!act) return res.status(404).json({ error: 'Activiteit niet gevonden' });
  const magBeheren = magActiviteitBeheren(req.user, act);
  if (!magBeheren && !zitOpActiviteit(req.user, act._id)) {
    return res.status(403).json({ error: 'Geen toegang tot deze activiteit' });
  }

  const leerlingen = await Leerling.find({ activiteiten: activiteit, actief: true }).sort({ naam: 1 }).select('naam niveau');
  const registraties = await Aanwezigheid.find({ activiteit, datum: dag });
  const perLeerling = new Map(registraties.map((r) => [r.leerling.toString(), r.status]));

  const lijst = leerlingen.map((l) => ({
    leerling: l._id,
    naam: l.naam,
    niveau: l.niveau,
    status: perLeerling.get(l._id.toString()) || null, // null = nog niet geregistreerd
  }));
  res.json({ lijst, magBeheren });
}));

// PUT /api/aanwezigheid — bulk upsert voor activiteit+datum. Alleen coördinator/directie.
// body: { activiteit, datum, registraties: [{ leerling, status }] }
router.put('/', requireRole(ROLES.COORDINATOR), asyncHandler(async (req, res) => {
  const { activiteit, datum, registraties = [] } = req.body || {};
  if (!activiteit || !datum) return res.status(400).json({ error: 'activiteit en datum zijn verplicht' });
  const dag = dagStart(datum);
  if (!dag) return res.status(400).json({ error: 'Ongeldige datum' });

  const act = await Activiteit.findById(activiteit);
  if (!act) return res.status(404).json({ error: 'Activiteit niet gevonden' });
  if (!magActiviteitBeheren(req.user, act)) {
    return res.status(403).json({ error: 'Je mag deze activiteit niet registreren' });
  }

  const ops = registraties
    .filter((r) => r.leerling && r.status)
    .map((r) => ({
      updateOne: {
        filter: { leerling: r.leerling, activiteit, datum: dag },
        update: { $set: { status: r.status, geregistreerdDoor: req.user.id } },
        upsert: true,
      },
    }));
  if (ops.length) await Aanwezigheid.bulkWrite(ops);
  res.json({ ok: true, aantal: ops.length });
}));

// GET /api/aanwezigheid/leerling/:id — statistiek + recente historie van één leerling.
router.get('/leerling/:id', asyncHandler(async (req, res) => {
  const leerling = await Leerling.findById(req.params.id);
  if (!leerling) return res.status(404).json({ error: 'Leerling niet gevonden' });
  if (!magLeerlingZien(req.user, leerling)) {
    return res.status(403).json({ error: 'Geen toegang tot deze leerling' });
  }

  const registraties = await Aanwezigheid.find({ leerling: leerling._id })
    .populate('activiteit', 'naam')
    .sort({ datum: -1 });

  const totaal = registraties.length;
  const aanwezig = registraties.filter((r) => r.status === 'aanwezig').length;
  const afgemeld = registraties.filter((r) => r.status === 'afgemeld').length;
  const afwezig = registraties.filter((r) => r.status === 'afwezig').length;
  const percentage = totaal ? Math.round((aanwezig / totaal) * 100) : null;

  res.json({
    totaal, aanwezig, afgemeld, afwezig, percentage,
    historie: registraties.slice(0, 20).map((r) => ({
      datum: r.datum, status: r.status, activiteit: r.activiteit?.naam || '',
    })),
  });
}));

export default router;
