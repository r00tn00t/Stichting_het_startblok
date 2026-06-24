import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

function vandaagISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function VrijwilligerDashboard() {
  const [tab, setTab] = useState('vandaag');
  const [datum, setDatum] = useState(vandaagISO());
  const [vandaag, setVandaag] = useState([]);      // [{ activiteit, kinderen[] }]
  const [deelnemers, setDeelnemers] = useState([]); // alle kinderen van mijn activiteit(en)
  const [fout, setFout] = useState('');

  useEffect(() => {
    api(`/badindelingen/mijn?datum=${datum}`).then(setVandaag).catch((e) => setFout(e.message));
  }, [datum]);

  useEffect(() => {
    api('/leerlingen').then(setDeelnemers).catch((e) => setFout(e.message));
  }, []);

  const aantalVandaag = vandaag.reduce((n, g) => n + g.kinderen.length, 0);

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
          {vandaag.map((groep, i) => (
            <div key={i} className="card">
              <h3>{groep.activiteit?.naam || 'Activiteit'}</h3>
              <div className="grid">
                {groep.kinderen.map((k) => (
                  <Link key={k._id} to={`/leerlingen/${k._id}`} className="card leerling-card">
                    <h3>{k.naam}</h3>
                    <p className="muted">{k.typeBeperking || '—'}</p>
                    {k.niveau && <span className="badge">{k.niveau}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'deelnemers' && (
        <div className="grid">
          {deelnemers.map((l) => (
            <Link key={l._id} to={`/leerlingen/${l._id}`} className="card leerling-card">
              <h3>{l.naam}</h3>
              <p className="muted">{l.typeBeperking || '—'}</p>
              {l.niveau && <span className="badge">{l.niveau}</span>}
            </Link>
          ))}
          {deelnemers.length === 0 && <p className="muted">Geen deelnemers gevonden.</p>}
        </div>
      )}
    </div>
  );
}
