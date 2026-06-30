import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LeerlingenPage() {
  const { heeftRol } = useAuth();
  const navigate = useNavigate();
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

  // Medicijnen waar lesgevers rekening mee moeten houden = kritiek.
  const medicijnKritiek = (l) => l.medicijnen && l.medicijnenLetOp;
  const isKritiek = (l) =>
    medicijnKritiek(l) || (l.medischeAandachtspunten || []).some((a) => a.urgentie === 'kritiek');

  // Belangrijke opmerkingen: kritieke/belangrijke medische punten + medicijnen-let-op.
  const belangrijkePunten = (l) => {
    const punten = (l.medischeAandachtspunten || [])
      .filter((a) => a.urgentie === 'kritiek' || a.urgentie === 'belangrijk')
      .map((a) => a.titel);
    if (medicijnKritiek(l)) punten.unshift('Medicijnen (let op)');
    return punten;
  };

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

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="tabel leerlingen-tabel">
          <thead>
            <tr>
              <th>Naam</th>
              <th className="mobiel-verberg">Beperking</th>
              <th className="mobiel-verberg">Zwemtijd</th>
              <th>Aanwezigheid</th>
              <th>Belangrijke opmerkingen</th>
            </tr>
          </thead>
          <tbody>
            {gefilterd.map((l) => {
              const punten = belangrijkePunten(l);
              const kritiek = isKritiek(l);
              const aw = aanwezigheid[l._id];
              return (
                <tr key={l._id} className="leerling-rij" onClick={() => navigate(`/leerlingen/${l._id}`)}>
                  <td><strong>{l.naam}</strong></td>
                  <td className="muted mobiel-verberg">{l.typeBeperking || '—'}</td>
                  <td className="muted mobiel-verberg">{l.zwemtijd || '—'}</td>
                  <td>
                    {aw
                      ? <span className={`aw-chip ${awKlasse(aw.percentage)}`}>{aw.percentage}% ({aw.aanwezig}/{aw.totaal})</span>
                      : <span className="muted">—</span>}
                  </td>
                  <td className="opmerkingen-cel">
                    {kritiek && <span className="badge kritiek">⚠ Kritiek</span>}
                    {punten.length > 0
                      ? <span>{punten.join(', ')}</span>
                      : <span className="muted">{l.communicatieTips || '—'}</span>}
                  </td>
                </tr>
              );
            })}
            {gefilterd.length === 0 && (
              <tr><td colSpan={5} className="muted">Geen leerlingen gevonden.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
