import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

function vandaagISO() {
  return new Date().toISOString().slice(0, 10);
}

// Belangrijke opmerkingen: kritieke/belangrijke medische punten, anders tips.
function opmerkingen(l) {
  const punten = (l.medischeAandachtspunten || [])
    .filter((a) => a.urgentie === 'kritiek' || a.urgentie === 'belangrijk')
    .map((a) => a.titel);
  if (punten.length) return punten.join(', ');
  return l.communicatieTips || '—';
}
const heeftKritiek = (l) => (l.medischeAandachtspunten || []).some((a) => a.urgentie === 'kritiek');

export default function VrijwilligerDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('vandaag');
  const [datum, setDatum] = useState(vandaagISO());
  const [vandaag, setVandaag] = useState([]);      // [{ activiteit, kinderen[] }]
  const [deelnemers, setDeelnemers] = useState([]); // alle kinderen van mijn activiteit(en)
  const [awStatus, setAwStatus] = useState({});    // { leerlingId: 'aanwezig'|'afgemeld'|'afwezig' }
  const [fout, setFout] = useState('');
  const [melding, setMelding] = useState('');

  function laadDag() {
    api(`/badindelingen/mijn?datum=${datum}`).then(setVandaag).catch((e) => setFout(e.message));
  }
  useEffect(laadDag, [datum]);

  useEffect(() => {
    api('/leerlingen').then(setDeelnemers).catch((e) => setFout(e.message));
  }, []);

  // Bestaande aanwezigheidsstatus laden per activiteit van vandaag.
  useEffect(() => {
    const acts = [...new Set(vandaag.map((g) => g.activiteit?._id).filter(Boolean))];
    if (acts.length === 0) return;
    Promise.all(acts.map((a) => api(`/aanwezigheid?activiteit=${a}&datum=${datum}`).catch(() => ({ lijst: [] }))))
      .then((resultaten) => {
        const map = {};
        resultaten.forEach(({ lijst }) => (lijst || []).forEach((r) => { if (r.status) map[r.leerling] = r.status; }));
        setAwStatus(map);
      });
  }, [vandaag, datum]);

  const aantalVandaag = vandaag.reduce((n, g) => n + (g.kinderen?.length || 0), 0);

  const setStatus = (leerlingId, status) => setAwStatus((s) => ({ ...s, [leerlingId]: status }));

  // Aanwezigheid opslaan voor één activiteit-groep (alleen eigen kinderen).
  async function slaAanwezigheidOp(groep) {
    setFout(''); setMelding('');
    const registraties = groep.kinderen.map((k) => ({
      leerling: k.leerling?._id,
      status: awStatus[k.leerling?._id] || 'aanwezig',
    }));
    try {
      await api('/aanwezigheid/mijn', { method: 'PUT', body: { activiteit: groep.activiteit._id, datum, registraties } });
      setMelding('Aanwezigheid opgeslagen.');
    } catch (e) { setFout(e.message); }
  }

  return (
    <div>
      <h1>Welkom 👋</h1>
      {fout && <div className="alert">{fout}</div>}

      <div className="tabs">
        <button className={tab === 'vandaag' ? 'tab actief' : 'tab'} onClick={() => setTab('vandaag')}>
          Mijn kinderen vandaag
        </button>
        <button className={tab === 'deelnemers' ? 'tab actief' : 'tab'} onClick={() => setTab('deelnemers')}>
          Alle deelnemers van mijn activiteit
        </button>
      </div>

      {tab === 'vandaag' && (
        <div>
          <div className="filter-rij">
            <label>Datum:&nbsp;<input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} /></label>
          </div>
          {aantalVandaag === 0 && (
            <p className="muted">Je hebt vandaag nog geen kinderen toegewezen gekregen. Vraag je coördinator om de badindeling.</p>
          )}
          {melding && <div className="melding">{melding}</div>}
          {vandaag.map((groep, i) => (
            <div key={i} className="card" style={{ overflowX: 'auto' }}>
              <div className="kop-rij">
                <h3>
                  {groep.activiteit?.naam || 'Activiteit'}
                  <span className="muted"> · {groep.blok} · zone {groep.zone}</span>
                </h3>
                <button onClick={() => slaAanwezigheidOp(groep)}>Aanwezigheid opslaan</button>
              </div>
              <table className="tabel leerlingen-tabel">
                <thead>
                  <tr><th>Naam</th><th>Beperking</th><th>Niveau</th><th>Aanwezigheid</th><th>Belangrijke opmerkingen</th></tr>
                </thead>
                <tbody>
                  {groep.kinderen.map((k) => {
                    const l = k.leerling || {};
                    const status = awStatus[l._id] || 'aanwezig';
                    return (
                      <tr key={l._id}>
                        <td><a onClick={() => navigate(`/leerlingen/${l._id}`)} className="leerling-naam-link">{l.naam}</a></td>
                        <td className="muted">{l.typeBeperking || '—'}</td>
                        <td>{k.niveau || l.niveau ? <span className="badge">{k.niveau || l.niveau}</span> : '—'}</td>
                        <td>
                          <span className="aw-knoppen">
                            {['aanwezig', 'afgemeld', 'afwezig'].map((st) => (
                              <button
                                key={st}
                                className={`aw-btn aw-${st} ${status === st ? 'aw-actief' : ''}`}
                                onClick={() => setStatus(l._id, st)}
                              >
                                {st}
                              </button>
                            ))}
                          </span>
                        </td>
                        <td className="opmerkingen-cel">
                          {heeftKritiek(l) && <span className="badge kritiek">⚠ Kritiek</span>}
                          {opmerkingen(l)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {tab === 'deelnemers' && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="tabel leerlingen-tabel">
            <thead>
              <tr><th>Naam</th><th>Beperking</th><th>Niveau</th><th>Zwemtijd</th><th>Belangrijke opmerkingen</th></tr>
            </thead>
            <tbody>
              {deelnemers.map((l) => (
                <tr key={l._id} className="leerling-rij" onClick={() => navigate(`/leerlingen/${l._id}`)}>
                  <td><strong>{l.naam}</strong></td>
                  <td className="muted">{l.typeBeperking || '—'}</td>
                  <td>{l.niveau ? <span className="badge">{l.niveau}</span> : '—'}</td>
                  <td className="muted">{l.zwemtijd || '—'}</td>
                  <td className="opmerkingen-cel">
                    {heeftKritiek(l) && <span className="badge kritiek">⚠ Kritiek</span>}
                    {opmerkingen(l)}
                  </td>
                </tr>
              ))}
              {deelnemers.length === 0 && <tr><td colSpan={5} className="muted">Geen deelnemers gevonden.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
