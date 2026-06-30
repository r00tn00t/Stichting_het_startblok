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
  const [fout, setFout] = useState('');

  useEffect(() => {
    api(`/badindelingen/mijn?datum=${datum}`).then(setVandaag).catch((e) => setFout(e.message));
  }, [datum]);

  useEffect(() => {
    api('/leerlingen').then(setDeelnemers).catch((e) => setFout(e.message));
  }, []);

  const aantalVandaag = vandaag.reduce((n, g) => n + (g.kinderen?.length || 0), 0);

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
            <div key={i} className="card" style={{ overflowX: 'auto' }}>
              <h3>
                {groep.activiteit?.naam || 'Activiteit'}
                <span className="muted"> · {groep.blok} · zone {groep.zone}</span>
              </h3>
              <table className="tabel leerlingen-tabel">
                <thead>
                  <tr><th>Naam</th><th>Beperking</th><th>Niveau</th><th>Status</th><th>Belangrijke opmerkingen</th></tr>
                </thead>
                <tbody>
                  {groep.kinderen.map((k) => {
                    const l = k.leerling || {};
                    return (
                      <tr key={l._id} className="leerling-rij" onClick={() => navigate(`/leerlingen/${l._id}`)}>
                        <td><strong>{l.naam}</strong></td>
                        <td className="muted">{l.typeBeperking || '—'}</td>
                        <td>{k.niveau || l.niveau ? <span className="badge">{k.niveau || l.niveau}</span> : '—'}</td>
                        <td>{k.status !== 'aanwezig' ? <span className={`aw-chip status-kind-${k.status}`}>{k.status}</span> : <span className="muted">aanwezig</span>}</td>
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
