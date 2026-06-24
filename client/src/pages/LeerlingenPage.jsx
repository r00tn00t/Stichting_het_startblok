import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LeerlingenPage() {
  const { heeftRol } = useAuth();
  const [leerlingen, setLeerlingen] = useState([]);
  const [fout, setFout] = useState('');
  const [zoek, setZoek] = useState('');

  useEffect(() => {
    api('/leerlingen').then(setLeerlingen).catch((e) => setFout(e.message));
  }, []);

  const gefilterd = leerlingen.filter((l) =>
    l.naam.toLowerCase().includes(zoek.toLowerCase())
  );

  return (
    <div>
      <div className="kop-rij">
        <h1>Leerlingen</h1>
        {heeftRol('hoofdtrainer') && (
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
          </Link>
        ))}
        {gefilterd.length === 0 && <p className="muted">Geen leerlingen gevonden.</p>}
      </div>
    </div>
  );
}
