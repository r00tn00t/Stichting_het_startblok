import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LeerlingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { heeftRol } = useAuth();
  const [data, setData] = useState(null);
  const [fout, setFout] = useState('');
  const [aanwezigheid, setAanwezigheid] = useState(null);

  const magSchrijven = heeftRol('coordinator');

  useEffect(() => {
    api(`/leerlingen/${id}`).then(setData).catch((e) => setFout(e.message));
    api(`/aanwezigheid/leerling/${id}`).then(setAanwezigheid).catch(() => setAanwezigheid(null));
  }, [id]);

  if (fout) return <div className="alert">{fout}</div>;
  if (!data) return <p>Laden…</p>;

  const { leerling } = data;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="terug terug-knop">← Terug</button>
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
    </div>
  );
}
