import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LeerlingenPage() {
  const { heeftRol } = useAuth();
  const [leerlingen, setLeerlingen] = useState([]);
  const [aanwezigheid, setAanwezigheid] = useState({}); // { leerlingId: {percentage, aanwezig, totaal} }
  const [fout, setFout] = useState('');
  const [zoek, setZoek] = useState('');

  useEffect(() => {
    api('/leerlingen').then(setLeerlingen).catch((e) => setFout(e.message));
    api('/aanwezigheid/samenvatting').then(setAanwezigheid).catch(() => {});
  }, []);

  // Kleur op basis van percentage: groen hoog, oranje midden, rood laag.
  const awKlasse = (p) => (p >= 80 ? 'aw-aanwezig' : p >= 50 ? 'aw-afgemeld' : 'aw-afwezig');

  const gefilterd = leerlingen.filter((l) =>
    l.naam.toLowerCase().includes(zoek.toLowerCase())
  );

  return (
    <div>
      <div className="kop-rij">
        <h1>Leerlingen</h1>
        {heeftRol('coordinator') && (
          <Link to="/leerlingen/nieuw" className="knop-link">+ Nieuwe leerling</Link>
        )}
      </div>
      {fout && <div className="alert">{fout}</div>}
      <input
        className="zoek"
        placeholder="Zoek op naam…"
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
      />
      <div className="grid">
        {gefilterd.map((l) => (
          <Link key={l._id} to={`/leerlingen/${l._id}`} className="card leerling-card">
            <h3>{l.naam}</h3>
            <p className="muted">{l.typeBeperking || 'Geen beperking opgegeven'}</p>
            {l.niveau && <span className="badge">{l.niveau}</span>}
            {l.medischeAandachtspunten?.some((a) => a.urgentie === 'kritiek') && (
              <span className="badge kritiek">⚠ Kritiek aandachtspunt</span>
            )}
            {aanwezigheid[l._id] && (
              <span className={`aw-chip ${awKlasse(aanwezigheid[l._id].percentage)}`} style={{ marginTop: 8, display: 'inline-block' }}>
                {aanwezigheid[l._id].percentage}% ({aanwezigheid[l._id].aanwezig}/{aanwezigheid[l._id].totaal})
              </span>
            )}
          </Link>
        ))}
        {gefilterd.length === 0 && <p className="muted">Geen leerlingen gevonden.</p>}
      </div>
    </div>
  );
}
