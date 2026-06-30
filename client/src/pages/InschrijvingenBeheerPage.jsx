import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

const statusLabel = {
  'in-behandeling': 'In behandeling',
  goedgekeurd: 'Goedgekeurd',
  afgewezen: 'Afgewezen',
};

export default function InschrijvingenBeheerPage() {
  const navigate = useNavigate();
  const [lijst, setLijst] = useState([]);
  const [filter, setFilter] = useState('in-behandeling');
  const [open, setOpen] = useState(null); // volledige inschrijving die uitgeklapt is
  const [fout, setFout] = useState('');

  function laad() {
    const pad = filter ? `/inschrijvingen?status=${filter}` : '/inschrijvingen';
    api(pad).then(setLijst).catch((e) => setFout(e.message));
  }
  useEffect(laad, [filter]);

  async function bekijk(id) {
    if (open?._id === id) return setOpen(null);
    try {
      setOpen(await api(`/inschrijvingen/${id}`));
    } catch (e) {
      setFout(e.message);
    }
  }

  async function goedkeuren(id) {
    if (!confirm('Inschrijving goedkeuren en een leerlingdossier aanmaken?')) return;
    try {
      const { leerlingId } = await api(`/inschrijvingen/${id}/goedkeuren`, { method: 'POST' });
      navigate(`/leerlingen/${leerlingId}`);
    } catch (e) {
      setFout(e.message);
    }
  }

  async function afwijzen(id) {
    if (!confirm('Inschrijving afwijzen?')) return;
    try {
      await api(`/inschrijvingen/${id}/afwijzen`, { method: 'POST' });
      setOpen(null);
      laad();
    } catch (e) {
      setFout(e.message);
    }
  }

  return (
    <div>
      <h1>Inschrijvingen</h1>
      <p className="muted">Beoordeel binnengekomen leerling-inschrijvingen. Bij goedkeuring wordt automatisch een leerlingdossier aangemaakt.</p>
      {fout && <div className="alert">{fout}</div>}

      <div className="filter-rij">
        <label>Status:&nbsp;
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="in-behandeling">In behandeling</option>
            <option value="goedgekeurd">Goedgekeurd</option>
            <option value="afgewezen">Afgewezen</option>
            <option value="">Alle</option>
          </select>
        </label>
      </div>

      {lijst.length === 0 && <p className="muted">Geen inschrijvingen.</p>}

      {lijst.map((ins) => (
        <div key={ins._id} className="card">
          <div className="kop-rij">
            <h3>
              {ins.roepnaam} {ins.achternaam}
              <span className="badge" style={{ marginLeft: 8 }}>
                {ins.soort === 'activiteit' ? 'Activiteit' : 'Zwemles'}
              </span>
            </h3>
            <span className={`status status-${ins.status === 'goedgekeurd' ? 'behaald' : ins.status === 'afgewezen' ? 'nog-niet-begonnen' : 'in-uitvoering'}`}>
              {statusLabel[ins.status]}
            </span>
          </div>
          <p className="muted">
            {ins.beperkingNaam || 'Beperking niet opgegeven'} · {ins.email || 'geen e-mail'} · {ins.telefoon || 'geen tel'}
          </p>

          <button className="mini grijs" onClick={() => bekijk(ins._id)}>
            {open?._id === ins._id ? 'Verbergen' : 'Bekijk volledig'}
          </button>

          {open?._id === ins._id && (
            <dl className="dl" style={{ marginTop: 12 }}>
              <dt>Geboortedatum</dt><dd>{open.geboortedatum ? open.geboortedatum.slice(0, 10) : '—'}</dd>
              <dt>Adres</dt><dd>{open.straatnaam} {open.huisnummer}, {open.postcode} {open.plaats}</dd>
              <dt>School/dagbesteding</dt><dd>{open.dagbestedingSchool || '—'}</dd>
              <dt>Gekozen lessen</dt><dd>{open.gekozenLessen?.join(', ') || '—'}</dd>
              <dt>Eerder gezwommen</dt><dd>{open.eerderGezwommen ? `Ja — ${open.eerderToelichting}` : 'Nee'}</dd>
              <dt>Beperking</dt><dd>{open.beperkingOmschrijving || '—'}</dd>
              <dt>Toevallen</dt><dd>{open.toevallen ? `Ja — ${open.toevallenWaarneming}` : 'Nee'}</dd>
              <dt>Allergieën</dt><dd>{open.allergieen ? `Ja — ${open.allergieenWelke}` : 'Nee'}</dd>
              <dt>Medicijnen</dt><dd>{open.medicijnen ? `Ja — ${open.medicijnenWelke || '?'}` : 'Nee'}</dd>
              {open.medicijnen && open.medicijnenLetOp && (
                <>
                  <dt>Let op (medicijnen)</dt>
                  <dd><strong>Lesgevers rekening houden:</strong> {open.medicijnenInstructie || '—'}</dd>
                </>
              )}
              <dt>Fysiotherapie</dt><dd>{open.fysiotherapie ? `Ja — ${open.fysiotherapiePraktijk}` : 'Nee'}</dd>
              <dt>Aandoeningen</dt><dd>{[...(open.aandoeningen || []), open.aandoeningOverig].filter(Boolean).join(', ') || '—'}</dd>
              <dt>Aandachtspunten</dt><dd>{[...(open.aandachtspunten || []), open.aandachtspuntOverig].filter(Boolean).join(', ') || '—'}</dd>
              <dt>Overige info</dt><dd>{open.overigeInformatie || '—'}</dd>
              <dt>Media-toestemming</dt><dd>{[open.mediaWebsite && 'website', open.mediaSocial && 'social', open.mediaKrant && 'krant'].filter(Boolean).join(', ') || 'geen'}</dd>
              <dt>Bankrekening</dt><dd>{open.bankrekeningnummer || '—'}</dd>
            </dl>
          )}

          {ins.status === 'in-behandeling' && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button onClick={() => goedkeuren(ins._id)}>Goedkeuren → dossier</button>
              <button className="grijs" onClick={() => afwijzen(ins._id)}>Afwijzen</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
