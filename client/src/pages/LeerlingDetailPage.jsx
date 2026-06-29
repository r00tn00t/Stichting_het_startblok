import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const statusLabel = {
  'nog-niet-begonnen': 'Nog niet begonnen',
  'in-uitvoering': 'In uitvoering',
  behaald: 'Behaald',
};
const volgendeStatus = {
  'nog-niet-begonnen': 'in-uitvoering',
  'in-uitvoering': 'behaald',
  behaald: 'nog-niet-begonnen',
};

const leegRegel = { onderdeel: '', categorie: '', status: 'nog-niet-begonnen', notitie: '' };

export default function LeerlingDetailPage() {
  const { id } = useParams();
  const { heeftRol } = useAuth();
  const [data, setData] = useState(null);
  const [fout, setFout] = useState('');
  const [nieuw, setNieuw] = useState(leegRegel);
  const [toonNieuw, setToonNieuw] = useState(false);
  const [bewerktNotitie, setBewerktNotitie] = useState({}); // { regelId: tekst }
  const [aanwezigheid, setAanwezigheid] = useState(null);

  const magSchrijven = heeftRol('coordinator');

  function laad() {
    api(`/leerlingen/${id}`).then(setData).catch((e) => setFout(e.message));
  }
  useEffect(laad, [id]);
  useEffect(() => {
    api(`/aanwezigheid/leerling/${id}`).then(setAanwezigheid).catch(() => setAanwezigheid(null));
  }, [id]);

  async function wisselStatus(regel) {
    try {
      await api(`/leerlingen/${id}/voortgang/${regel._id}`, {
        method: 'PUT',
        body: { status: volgendeStatus[regel.status] },
      });
      laad();
    } catch (e) {
      setFout(e.message);
    }
  }

  async function voegRegelToe(e) {
    e.preventDefault();
    try {
      await api(`/leerlingen/${id}/voortgang`, { method: 'POST', body: nieuw });
      setNieuw(leegRegel);
      setToonNieuw(false);
      laad();
    } catch (e) {
      setFout(e.message);
    }
  }

  async function slaNotitieOp(regel) {
    try {
      await api(`/leerlingen/${id}/voortgang/${regel._id}`, {
        method: 'PUT',
        body: { notitie: bewerktNotitie[regel._id] ?? regel.notitie },
      });
      setBewerktNotitie((s) => {
        const k = { ...s };
        delete k[regel._id];
        return k;
      });
      laad();
    } catch (e) {
      setFout(e.message);
    }
  }

  if (fout) return <div className="alert">{fout}</div>;
  if (!data) return <p>Laden…</p>;

  const { leerling, voortgang } = data;
  const setNieuwVeld = (veld) => (e) => setNieuw({ ...nieuw, [veld]: e.target.value });

  return (
    <div>
      <Link to="/leerlingen" className="terug">← Terug</Link>
      <div className="kop-rij">
        <h1>{leerling.naam}</h1>
        {magSchrijven && (
          <Link to={`/leerlingen/${id}/bewerken`} className="knop-link">Profiel bewerken</Link>
        )}
      </div>

      <div className="card">
        <h2>Profiel</h2>
        <dl className="dl">
          <dt>Type beperking</dt><dd>{leerling.typeBeperking || '—'}</dd>
          <dt>Niveau</dt><dd>{leerling.niveau || '—'}</dd>
          <dt>Communicatietips</dt><dd>{leerling.communicatieTips || '—'}</dd>
          <dt>Wat werkt wel</dt><dd>{leerling.watWerktWel || '—'}</dd>
          <dt>Wat werkt niet</dt><dd>{leerling.watWerktNiet || '—'}</dd>
        </dl>
      </div>

      <div className="card">
        <h2>Medische aandachtspunten</h2>
        {leerling.medischeAandachtspunten?.length ? (
          <ul className="aandacht">
            {leerling.medischeAandachtspunten.map((a) => (
              <li key={a._id} className={`urgentie-${a.urgentie}`}>
                <strong>{a.titel}</strong> — {a.omschrijving}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Geen aandachtspunten vastgelegd.</p>
        )}
      </div>

      <div className="card">
        <h2>Aanwezigheid</h2>
        {!aanwezigheid || aanwezigheid.totaal === 0 ? (
          <p className="muted">Nog geen aanwezigheid geregistreerd.</p>
        ) : (
          <>
            <div className="aw-overzicht">
              <div className="aw-percentage">
                <span className="aw-percentage-getal">{aanwezigheid.percentage}%</span>
                <span className="muted">aanwezig</span>
              </div>
              <div className="aw-telling">
                <span className="aw-chip aw-aanwezig">Aanwezig: {aanwezigheid.aanwezig}</span>
                <span className="aw-chip aw-afgemeld">Afgemeld: {aanwezigheid.afgemeld}</span>
                <span className="aw-chip aw-afwezig">Afwezig: {aanwezigheid.afwezig}</span>
                <span className="muted">van {aanwezigheid.totaal} lessen</span>
              </div>
            </div>
            {aanwezigheid.historie?.length > 0 && (
              <table className="tabel" style={{ marginTop: 12 }}>
                <thead><tr><th>Datum</th><th>Activiteit</th><th>Status</th></tr></thead>
                <tbody>
                  {aanwezigheid.historie.map((h, i) => (
                    <tr key={i}>
                      <td>{new Date(h.datum).toLocaleDateString('nl-NL')}</td>
                      <td className="muted">{h.activiteit}</td>
                      <td><span className={`aw-chip aw-${h.status}`}>{h.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      <div className="card">
        <div className="kop-rij">
          <h2>Digitale zwemkaart</h2>
          {magSchrijven && (
            <button onClick={() => setToonNieuw((v) => !v)}>
              {toonNieuw ? 'Annuleren' : '+ Onderdeel'}
            </button>
          )}
        </div>

        {toonNieuw && magSchrijven && (
          <form className="nieuw-regel" onSubmit={voegRegelToe}>
            <input placeholder="Onderdeel (bv. Drijven op de rug)" value={nieuw.onderdeel} onChange={setNieuwVeld('onderdeel')} required />
            <input placeholder="Categorie (bv. Diploma A)" value={nieuw.categorie} onChange={setNieuwVeld('categorie')} />
            <select value={nieuw.status} onChange={setNieuwVeld('status')}>
              {Object.entries(statusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button type="submit" className="mini">Toevoegen</button>
          </form>
        )}

        <table className="tabel">
          <thead>
            <tr>
              <th>Onderdeel</th><th>Categorie</th><th>Status</th><th>Notitie</th>
              {magSchrijven && <th></th>}
            </tr>
          </thead>
          <tbody>
            {voortgang.map((v) => (
              <tr key={v._id}>
                <td>{v.onderdeel}</td>
                <td className="muted">{v.categorie}</td>
                <td><span className={`status status-${v.status}`}>{statusLabel[v.status]}</span></td>
                <td>
                  {magSchrijven ? (
                    <input
                      className="notitie-input"
                      value={bewerktNotitie[v._id] ?? v.notitie ?? ''}
                      placeholder="—"
                      onChange={(e) => setBewerktNotitie((s) => ({ ...s, [v._id]: e.target.value }))}
                      onBlur={() => bewerktNotitie[v._id] !== undefined && slaNotitieOp(v)}
                    />
                  ) : (
                    <span className="muted">{v.notitie || '—'}</span>
                  )}
                </td>
                {magSchrijven && (
                  <td><button className="mini" onClick={() => wisselStatus(v)}>Status →</button></td>
                )}
              </tr>
            ))}
            {voortgang.length === 0 && (
              <tr><td colSpan={magSchrijven ? 5 : 4} className="muted">Nog geen onderdelen.</td></tr>
            )}
          </tbody>
        </table>
        {!magSchrijven && <p className="muted">Je hebt alleen leesrechten.</p>}
      </div>
    </div>
  );
}
