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
  const [niveaus, setNiveaus] = useState([]); // [{_id, naam}]

  const magSchrijven = heeftRol('coordinator');

  function laad() {
    api(`/leerlingen/${id}`).then(setData).catch((e) => setFout(e.message));
  }
  useEffect(laad, [id]);
  useEffect(() => {
    api(`/aanwezigheid/leerling/${id}`).then(setAanwezigheid).catch(() => setAanwezigheid(null));
    api('/niveaus').then(setNiveaus).catch(() => setNiveaus([]));
  }, [id]);

  // Status van een vast niveau wisselen. Bestaat er nog geen voortgangsregel voor
  // dit niveau, dan maken we 'm aan (categorie 'Niveau'); anders doorklikken.
  async function wisselNiveau(niveauNaam, regel) {
    try {
      if (regel) {
        await api(`/leerlingen/${id}/voortgang/${regel._id}`, {
          method: 'PUT', body: { status: volgendeStatus[regel.status] },
        });
      } else {
        await api(`/leerlingen/${id}/voortgang`, {
          method: 'POST', body: { onderdeel: niveauNaam, categorie: 'Niveau', status: 'in-uitvoering' },
        });
      }
      laad();
    } catch (e) { setFout(e.message); }
  }

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

  // Koppel elk niveau aan een bestaande voortgangsregel (op onderdeel-naam).
  const niveauNamen = new Set(niveaus.map((n) => n.naam));
  const regelVoorNiveau = (naam) => voortgang.find((v) => v.onderdeel === naam);
  // Losse onderdelen = voortgang die niet bij een vast niveau hoort.
  const losseOnderdelen = voortgang.filter((v) => !niveauNamen.has(v.onderdeel));

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
          <dt>Geslacht</dt><dd>{leerling.geslacht || '—'}</dd>
          <dt>Geboortedatum</dt><dd>{leerling.geboortedatum ? new Date(leerling.geboortedatum).toLocaleDateString('nl-NL') : '—'}</dd>
          <dt>Type beperking</dt><dd>{leerling.typeBeperking || '—'}</dd>
          <dt>Omschrijving beperking</dt><dd>{leerling.beperkingOmschrijving || '—'}</dd>
          <dt>Niveau</dt><dd>{leerling.niveau || '—'}{leerling.niveauToelichting ? ` — ${leerling.niveauToelichting}` : ''}</dd>
          <dt>Zwemtijd</dt><dd>{leerling.zwemtijd || '—'}</dd>
          <dt>Communicatietips</dt><dd>{leerling.communicatieTips || '—'}</dd>
          <dt>Wat werkt wel</dt><dd>{leerling.watWerktWel || '—'}</dd>
          <dt>Wat werkt niet</dt><dd>{leerling.watWerktNiet || '—'}</dd>
          <dt>Eerder gezwommen</dt><dd>{leerling.eerderGezwommen ? `Ja${leerling.eerderToelichting ? ` — ${leerling.eerderToelichting}` : ''}` : 'Nee'}</dd>
          <dt>Fysiotherapie</dt><dd>{leerling.fysiotherapie ? `Ja${leerling.fysiotherapiePraktijk ? ` — ${leerling.fysiotherapiePraktijk}` : ''}` : 'Nee'}</dd>
        </dl>
      </div>

      <div className="card">
        <h2>Adres & contact</h2>
        <dl className="dl">
          <dt>Adres</dt><dd>{[leerling.straatnaam, leerling.huisnummer].filter(Boolean).join(' ') || '—'}{leerling.postcode || leerling.plaats ? `, ${[leerling.postcode, leerling.plaats].filter(Boolean).join(' ')}` : ''}</dd>
          <dt>Telefoon</dt><dd>{leerling.contactTelefoon || '—'}</dd>
          <dt>E-mail</dt><dd>{leerling.email || '—'}</dd>
          <dt>Contactpersoon</dt><dd>{leerling.contactNaam || '—'}</dd>
          <dt>Dagbesteding / school</dt><dd>{leerling.dagbestedingSchool || '—'}</dd>
        </dl>
      </div>

      <div className="card">
        <h2>Media-toestemming</h2>
        <dl className="dl">
          <dt>Website</dt><dd>{leerling.mediaWebsite ? 'Ja' : 'Nee'}</dd>
          <dt>Sociale media</dt><dd>{leerling.mediaSocial ? 'Ja' : 'Nee'}</dd>
          <dt>Krant</dt><dd>{leerling.mediaKrant ? 'Ja' : 'Nee'}</dd>
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
        {leerling.aandachtspunten?.length > 0 && (
          <p style={{ marginTop: 10 }}>
            <strong>Aanvullend:</strong>{' '}
            {leerling.aandachtspunten.map((a) => <span key={a} className="badge">{a}</span>)}
          </p>
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
        <h2>Digitale zwemkaart — niveaus</h2>
        <p className="muted">De vaardigheden uit de kennisbank. {magSchrijven ? 'Klik op de status om door te zetten (nog niet → in uitvoering → behaald).' : ''}</p>
        <table className="tabel">
          <thead>
            <tr><th>Niveau</th><th>Status</th></tr>
          </thead>
          <tbody>
            {niveaus.map((n, i) => {
              const regel = regelVoorNiveau(n.naam);
              const status = regel?.status || 'nog-niet-begonnen';
              return (
                <tr key={n._id}>
                  <td><span className="muted">{i + 1}.</span> {n.naam}</td>
                  <td>
                    {magSchrijven ? (
                      <button className={`status status-${status} status-knop`} onClick={() => wisselNiveau(n.naam, regel)}>
                        {statusLabel[status]}
                      </button>
                    ) : (
                      <span className={`status status-${status}`}>{statusLabel[status]}</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {niveaus.length === 0 && <tr><td colSpan={2} className="muted">Nog geen niveaus ingesteld.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="kop-rij">
          <h2>Overige onderdelen</h2>
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
            {losseOnderdelen.map((v) => (
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
            {losseOnderdelen.length === 0 && (
              <tr><td colSpan={magSchrijven ? 5 : 4} className="muted">Nog geen overige onderdelen.</td></tr>
            )}
          </tbody>
        </table>
        {!magSchrijven && <p className="muted">Je hebt alleen leesrechten.</p>}
      </div>
    </div>
  );
}
