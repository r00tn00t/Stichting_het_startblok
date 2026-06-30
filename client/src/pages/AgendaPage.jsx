import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const WEEKDAGEN = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'];

function isoVan(d) { return d.toISOString().slice(0, 10); }
function vandaagISO() { return isoVan(new Date()); }
function datumPlusDagen(iso, n) { const d = new Date(iso); d.setDate(d.getDate() + n); return isoVan(d); }
function maandagVan(iso) { const d = new Date(iso); const dag = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dag); return isoVan(d); }
const weekdagIndex = (iso) => (new Date(iso).getDay() + 6) % 7; // ma=0
const langeDatum = (iso) => new Date(iso).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function AgendaPage() {
  const { heeftRol } = useAuth();
  const [activiteiten, setActiviteiten] = useState([]);
  const [vakanties, setVakanties] = useState([]);
  const [afspraken, setAfspraken] = useState([]);
  const [weekStart, setWeekStart] = useState(maandagVan(vandaagISO()));
  const [gekozen, setGekozen] = useState(null); // { type:'les'|'afspraak', ... }
  const [mijnKinderen, setMijnKinderen] = useState(null); // eigen toewijzing voor gekozen les
  const [fout, setFout] = useState('');

  const isVrijwilliger = !heeftRol('coordinator');

  useEffect(() => {
    api('/activiteiten').then(setActiviteiten).catch((e) => setFout(e.message));
    api('/vakanties').then(setVakanties).catch(() => {});
    api('/afspraken').then(setAfspraken).catch(() => {});
  }, []);

  // Eigen kinderen ophalen wanneer een vrijwilliger een les selecteert.
  useEffect(() => {
    setMijnKinderen(null);
    if (!isVrijwilliger || gekozen?.type !== 'les') return;
    api(`/badindelingen/mijn?datum=${gekozen.datum}`)
      .then((groepen) => {
        const eigen = groepen.filter((g) => g.activiteit?._id === gekozen.activiteit._id);
        setMijnKinderen(eigen);
      })
      .catch(() => setMijnKinderen([]));
  }, [gekozen, isVrijwilliger]);

  // Losse afspraken op een ISO-datum.
  const afsprakenOp = (iso) => afspraken.filter((a) => isoVan(new Date(a.datum)) === iso);

  const vakantieOp = (iso) => {
    const t = new Date(iso).getTime();
    const v = vakanties.find((x) => t >= new Date(x.van).getTime() && t <= new Date(x.tot).getTime());
    return v ? v.naam : null;
  };

  // Alle items (lessen + losse afspraken) vanaf nu, chronologisch — voor "eerstvolgende".
  function komendeItems(vanafIso, weken = 8) {
    const lijst = [];
    for (let d = 0; d < weken * 7; d++) {
      const iso = datumPlusDagen(vanafIso, d);
      // losse afspraken tellen ook op vakantiedagen mee
      afsprakenOp(iso).forEach((a) => lijst.push({ type: 'afspraak', afspraak: a, datum: iso }));
      if (vakantieOp(iso)) continue;
      const idx = weekdagIndex(iso);
      if (idx > 4) continue; // alleen ma-vr
      const dagNaam = WEEKDAGEN[idx];
      activiteiten.filter((a) => a.weekdag === dagNaam).forEach((a) => lijst.push({ type: 'les', activiteit: a, datum: iso }));
    }
    return lijst;
  }
  const eerstvolgende = komendeItems(vandaagISO())[0];

  const weekDatums = WEEKDAGEN.map((_, i) => datumPlusDagen(weekStart, i));
  const lessenOp = (iso) => {
    if (vakantieOp(iso)) return [];
    const dagNaam = WEEKDAGEN[weekdagIndex(iso)];
    return activiteiten.filter((a) => a.weekdag === dagNaam);
  };

  return (
    <div>
      <h1>Agenda</h1>
      {fout && <div className="alert">{fout}</div>}

      {eerstvolgende && (
        <div className="card agenda-volgende">
          <span className="agenda-volgende-label">Eerstvolgende afspraak</span>
          <div className="agenda-volgende-body">
            {eerstvolgende.type === 'les' ? (
              <div>
                <strong>{eerstvolgende.activiteit.naam}</strong>
                <span className="muted"> — {eerstvolgende.activiteit.locatie?.naam}{eerstvolgende.activiteit.tijd ? ` · ${eerstvolgende.activiteit.tijd}` : ''}</span>
                <div className="muted">{langeDatum(eerstvolgende.datum)}</div>
              </div>
            ) : (
              <div>
                <strong>📌 {eerstvolgende.afspraak.titel}</strong>
                <span className="muted">{eerstvolgende.afspraak.tijd ? ` · ${eerstvolgende.afspraak.tijd}` : ''}</span>
                <div className="muted">{langeDatum(eerstvolgende.datum)}</div>
              </div>
            )}
            <button onClick={() => setGekozen(eerstvolgende)}>Bekijk</button>
          </div>
        </div>
      )}

      <div className="week-nav">
        <button className="grijs" onClick={() => setWeekStart(datumPlusDagen(weekStart, -7))}>← Vorige week</button>
        <strong>Week van {new Date(weekStart).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
        <button className="grijs" onClick={() => setWeekStart(datumPlusDagen(weekStart, 7))}>Volgende week →</button>
        <button className="mini grijs" onClick={() => setWeekStart(maandagVan(vandaagISO()))}>Deze week</button>
      </div>

      <div className="agenda-layout">
        <div className="week-grid agenda-week">
          {WEEKDAGEN.map((dag, i) => {
            const iso = weekDatums[i];
            const vak = vakantieOp(iso);
            const lessen = lessenOp(iso);
            const isVandaag = iso === vandaagISO();
            return (
              <div key={dag} className={`week-dag ${vak ? 'week-vakantie' : ''} ${isVandaag ? 'week-vandaag' : ''}`}>
                <div className="week-dag-kop">
                  <span className="week-dag-naam">{dag}</span>
                  <span className="muted">{new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
                </div>
                {/* Losse afspraken bovenaan (ook op vakantiedagen). */}
                {afsprakenOp(iso).map((a) => {
                  const actief = gekozen?.type === 'afspraak' && gekozen.afspraak._id === a._id;
                  return (
                    <button key={a._id} className={`week-les week-afspraak ${actief ? 'week-les-actief' : ''}`} onClick={() => setGekozen({ type: 'afspraak', afspraak: a, datum: iso })}>
                      <span className="week-les-naam">📌 {a.titel}</span>
                      <span className="muted">{a.tijd || ''}</span>
                    </button>
                  );
                })}
                {vak ? (
                  <div className="week-vak-label">{vak} — geen les</div>
                ) : lessen.length === 0 ? (
                  afsprakenOp(iso).length === 0 && <p className="muted" style={{ fontSize: 13 }}>Geen lessen</p>
                ) : (
                  lessen.map((a) => {
                    const actief = gekozen?.type === 'les' && gekozen.activiteit._id === a._id && gekozen.datum === iso;
                    return (
                      <button key={a._id} className={`week-les ${actief ? 'week-les-actief' : ''}`} onClick={() => setGekozen({ type: 'les', activiteit: a, datum: iso })}>
                        <span className="week-les-naam">{a.naam}</span>
                        <span className="muted">{a.locatie?.naam}{a.tijd ? ` · ${a.tijd}` : ''}</span>
                      </button>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>

        <aside className="agenda-detail">
          {!gekozen ? (
            <p className="muted">Klik op een afspraak om de details te zien.</p>
          ) : gekozen.type === 'afspraak' ? (
            <>
              <h2 style={{ borderBottom: 'none', marginTop: 0 }}>📌 {gekozen.afspraak.titel}</h2>
              <dl className="dl">
                <dt>Datum</dt><dd>{langeDatum(gekozen.datum)}</dd>
                <dt>Tijd</dt><dd>{gekozen.afspraak.tijd || '—'}</dd>
                <dt>Locatie</dt><dd>{gekozen.afspraak.locatie?.naam || '—'}</dd>
              </dl>
              {gekozen.afspraak.omschrijving && <p>{gekozen.afspraak.omschrijving}</p>}
            </>
          ) : (
            <>
              <h2 style={{ borderBottom: 'none', marginTop: 0 }}>{gekozen.activiteit.naam}</h2>
              <dl className="dl">
                <dt>Datum</dt><dd>{langeDatum(gekozen.datum)}</dd>
                <dt>Locatie</dt><dd>{gekozen.activiteit.locatie?.naam || '—'}{gekozen.activiteit.locatie?.plaats ? `, ${gekozen.activiteit.locatie.plaats}` : ''}</dd>
                <dt>Tijd</dt><dd>{gekozen.activiteit.tijd || '—'}</dd>
                <dt>Soort</dt><dd>{gekozen.activiteit.soort || '—'}</dd>
              </dl>
              {heeftRol('coordinator') && (
                <Link to="/badindeling" className="knop-link" style={{ marginTop: 12 }}>Naar badindeling</Link>
              )}
              {isVrijwilliger && (
                <div style={{ marginTop: 14 }}>
                  <h3 style={{ fontSize: '1rem' }}>Mijn kinderen deze les</h3>
                  {mijnKinderen === null ? (
                    <p className="muted">Laden…</p>
                  ) : mijnKinderen.length === 0 ? (
                    <p className="muted">Je bent (nog) niet ingedeeld voor deze les.</p>
                  ) : (
                    mijnKinderen.map((g, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <p className="muted" style={{ margin: '4px 0' }}>{g.blok} · zone {g.zone}</p>
                        <ul className="aandacht" style={{ margin: 0 }}>
                          {g.kinderen.map((k) => (
                            <li key={k.leerling?._id}>
                              <Link to={`/leerlingen/${k.leerling?._id}`}>{k.leerling?.naam}</Link>
                              {k.niveau ? ` (${k.niveau})` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
